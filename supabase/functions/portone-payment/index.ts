import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Supabase Edge Function "portone-payment" (verify_jwt = false, 함수 안에서 직접 확인) — 2026-10-27
// 포트원(PortOne) V2 + KG이니시스 결제(카드·가상계좌). 같은 소스를 "portone-webhook"으로도 배포합니다.
//
//   POST { action: "ping" }                         서버 연결 점검(값은 돌려주지 않음)
//   POST { action: "prepare", bookingId, method }   선교사 본인: 결제 ID 발급(금액은 DB에서) → 화면이 결제창을 엶
//   POST { action: "complete", paymentId }          선교사 본인·관리자: 포트원에 직접 조회해 예약에 반영
//   POST { action: "refund", bookingId, reason }    카드 결제 전액 취소 — 관리자, 또는 환불 진행 중인 자기 예약의 선교사·숙소 제공자
//                                                   (가상계좌는 환불 계좌로 이체 후 관리자가 "환불 완료 처리")
//   포트원 웹훅(헤더 webhook-signature)              서명 확인 후 해당 결제를 다시 조회해 반영
//
// 원칙: 화면에서 온 결제 결과는 믿지 않고, 항상 포트원 API로 금액·상태를 다시 확인합니다.
//       KG이니시스 주문번호(paymentId)는 40자 이내여야 합니다.
// 비밀값(Supabase Secrets): PORTONE_API_SECRET, PORTONE_WEBHOOK_SECRET

const PORTONE_API = "https://api.portone.io";
const STORE_ID = Deno.env.get("PORTONE_STORE_ID") || "store-f2e6972a-2f4f-4627-a4c2-81f56726d29c";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BANK_NAMES = {
  KOOKMIN: "KB국민은행", SHINHAN: "신한은행", WOORI: "우리은행", HANA: "하나은행", NONGHYUP: "NH농협은행",
  LOCAL_NONGHYUP: "지역농협", IBK: "IBK기업은행", SC: "SC제일은행", CITI: "한국씨티은행", KAKAO: "카카오뱅크",
  K_BANK: "케이뱅크", TOSS: "토스뱅크", BUSAN: "부산은행", DAEGU: "iM뱅크(대구)", KWANGJU: "광주은행",
  JEONBUK: "전북은행", KYONGNAM: "경남은행", JEJU: "제주은행", SUHYUP: "수협은행", POST: "우체국",
  SAEMAUL: "새마을금고", SHINHYEOP: "신협", SAVINGBANK: "저축은행", KDB: "KDB산업은행",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function portone(path, init = {}) {
  const res = await fetch(`${PORTONE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `PortOne ${Deno.env.get("PORTONE_API_SECRET")}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, ok: res.ok, body };
}

const admin = () => createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

async function getCaller(req, sb) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const userClient = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data, error } = await userClient.auth.getUser(jwt);
  if (error || !data?.user) return null;
  const { data: profile } = await sb.from("users").select("id, full_name, email, phone, role, status").eq("id", data.user.id).maybeSingle();
  if (!profile) return null;
  return { ...profile, isAdmin: profile.role === "admin" && profile.status === "approved" };
}

// 포트원 결제를 조회해 예약에 반영 — complete·웹훅 공통
async function syncPayment(sb, paymentId) {
  const r = await portone(`/payments/${encodeURIComponent(paymentId)}?storeId=${encodeURIComponent(STORE_ID)}`);
  if (r.status === 404) return { ok: false, error: "결제 정보를 찾을 수 없습니다." };
  if (!r.ok) return { ok: false, error: `포트원 조회 실패(${r.status})` };
  const p = r.body;

  let bookingId = null;
  try { bookingId = JSON.parse(p.customData || "{}").bookingId || null; } catch { bookingId = null; }
  let { data: booking } = await sb.from("bookings")
    .select("id, guest_id, status, payment_status, total_price, pg_payment_id, deposit_due_at")
    .eq("pg_payment_id", paymentId).maybeSingle();
  if (!booking && bookingId) {
    ({ data: booking } = await sb.from("bookings")
      .select("id, guest_id, status, payment_status, total_price, pg_payment_id, deposit_due_at")
      .eq("id", bookingId).maybeSingle());
  }
  if (!booking) return { ok: false, error: "결제에 연결된 예약을 찾을 수 없습니다." };

  const isVa = p.method?.type === "PaymentMethodVirtualAccount";
  const base = { pg_payment_id: paymentId, pg_status: p.status, pg_method: isVa ? "virtual_account" : (p.method ? "card" : null) };
  const amountOk = p.currency === "KRW" && Number(p.amount?.total) === Number(booking.total_price);

  if (p.status === "PAID") {
    // 금액이 다르거나 이미 취소된 예약이면 즉시 결제 취소
    if (!amountOk || booking.status === "cancelled") {
      const reason = !amountOk ? "결제 금액이 예약 금액과 달라 자동 취소" : "취소된 예약의 결제라 자동 취소";
      const c = await portone(`/payments/${encodeURIComponent(paymentId)}/cancel`, {
        method: "POST",
        body: JSON.stringify({ storeId: STORE_ID, reason }),
      });
      await sb.from("bookings").update({ ...base, pg_status: c.ok ? "CANCELLED" : p.status }).eq("id", booking.id);
      return { ok: false, error: reason, cancelled: c.ok };
    }
    if (booking.payment_status === "unpaid") {
      const update = { ...base, payment_status: "paid", paid_at: p.paidAt || new Date().toISOString(), pg_receipt_url: p.receiptUrl || null };
      if (isVa) {
        update.va_bank_name = BANK_NAMES[p.method.bank] || p.method.bank || null;
        update.va_account_number = p.method.accountNumber || null;
        update.va_holder_name = p.method.remitteeName || null;
      }
      await sb.from("bookings").update(update).eq("id", booking.id);
    } else {
      await sb.from("bookings").update(base).eq("id", booking.id);
    }
    return { ok: true, status: "PAID", bookingId: booking.id };
  }

  if (p.status === "VIRTUAL_ACCOUNT_ISSUED") {
    if (!amountOk) return { ok: false, error: "가상계좌 금액이 예약 금액과 다릅니다." };
    await sb.from("bookings").update({
      ...base,
      va_bank_name: BANK_NAMES[p.method?.bank] || p.method?.bank || null,
      va_account_number: p.method?.accountNumber || null,
      va_holder_name: p.method?.remitteeName || null,
      va_issued_at: p.method?.issuedAt || new Date().toISOString(),
      deposit_due_at: p.method?.expiredAt || booking.deposit_due_at,
    }).eq("id", booking.id);
    return { ok: true, status: "VIRTUAL_ACCOUNT_ISSUED", bookingId: booking.id };
  }

  if (p.status === "CANCELLED" || p.status === "PARTIAL_CANCELLED") {
    const update = { ...base };
    if (booking.payment_status === "paid" || booking.payment_status === "refund_pending") {
      update.payment_status = "refunded";
      update.refunded_at = new Date().toISOString();
      if (booking.status !== "cancelled") {
        update.status = "cancelled";
        update.cancel_reason = "결제 취소(포트원)";
      }
    }
    await sb.from("bookings").update(update).eq("id", booking.id);
    return { ok: true, status: p.status, bookingId: booking.id };
  }

  // READY, FAILED, PAY_PENDING 등: 상태만 기록
  await sb.from("bookings").update({ pg_status: p.status }).eq("id", booking.id).eq("pg_payment_id", paymentId);
  return { ok: p.status !== "FAILED", status: p.status, bookingId: booking.id };
}

// Standard Webhooks 서명 확인(포트원 V2 웹훅)
async function verifyWebhook(req, rawBody) {
  const secret = Deno.env.get("PORTONE_WEBHOOK_SECRET") || "";
  const id = req.headers.get("webhook-id");
  const ts = req.headers.get("webhook-timestamp");
  const sigHeader = req.headers.get("webhook-signature") || "";
  if (!secret || !id || !ts) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 5 * 60) return false;
  const keyB64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes;
  try { keyBytes = Uint8Array.from(atob(keyB64), (ch) => ch.charCodeAt(0)); } catch { keyBytes = new TextEncoder().encode(secret); }
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${rawBody}`)));
  const expected = btoa(String.fromCharCode(...mac));
  return sigHeader.split(" ").some((part) => part.split(",")[1] === expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const rawBody = await req.text();
  const sb = admin();

  // ── 포트원 웹훅
  if (req.headers.get("webhook-signature")) {
    if (!(await verifyWebhook(req, rawBody))) return json({ error: "invalid signature" }, 401);
    let event;
    try { event = JSON.parse(rawBody); } catch { return json({ error: "Invalid JSON body" }, 400); }
    const paymentId = event?.data?.paymentId;
    if (String(event?.type || "").startsWith("Transaction.") && paymentId) {
      const result = await syncPayment(sb, paymentId);
      console.log("webhook", event.type, paymentId, JSON.stringify(result));
    }
    return json({ received: true });
  }

  let body;
  try { body = JSON.parse(rawBody || "{}"); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const { action } = body || {};

  try {
    if (action === "ping") {
      const hasApiSecret = !!Deno.env.get("PORTONE_API_SECRET");
      let api = "missing";
      if (hasApiSecret) {
        const r = await portone(`/payments/${encodeURIComponent(`ping-${crypto.randomUUID()}`)}`);
        if (r.status === 404) api = "ok";
        else if (r.status === 401 || r.status === 403) api = "invalid";
        else api = `unexpected-${r.status}${r.body?.type ? `-${r.body.type}` : ""}`;
      }
      return json({ api, webhookSecret: !!Deno.env.get("PORTONE_WEBHOOK_SECRET") });
    }

    const caller = await getCaller(req, sb);
    if (!caller) return json({ error: "로그인이 필요합니다." }, 401);

    if (action === "prepare") {
      const { bookingId, method } = body;
      if (!bookingId || !["card", "virtual_account"].includes(method)) return json({ error: "잘못된 요청입니다." }, 400);
      const { data: b } = await sb.from("bookings")
        .select("id, guest_id, status, payment_status, total_price, deposit_due_at, pg_method, pg_status, va_account_number, accommodations(title)")
        .eq("id", bookingId).maybeSingle();
      if (!b || b.guest_id !== caller.id) return json({ error: "예약을 찾을 수 없습니다." }, 404);
      if (b.status !== "confirmed") return json({ error: "숙소 제공자가 확정한 예약만 결제할 수 있습니다." }, 400);
      if (b.payment_status !== "unpaid") return json({ error: "이미 결제가 완료된 예약입니다." }, 400);
      if (b.deposit_due_at && new Date(b.deposit_due_at) < new Date()) return json({ error: "결제 기한이 지났습니다." }, 400);
      if (b.pg_method === "virtual_account" && b.pg_status === "VIRTUAL_ACCOUNT_ISSUED" && b.va_account_number) {
        return json({ error: "이미 발급된 가상계좌가 있습니다. 안내된 계좌로 입금해주세요." }, 400);
      }

      // 40자 이내 주문번호: wb + 예약 ID 앞 16자 + 시각(36진수)
      const paymentId = `wb${bookingId.replace(/-/g, "").slice(0, 16)}${Date.now().toString(36)}`;
      await sb.from("bookings").update({ pg_payment_id: paymentId, pg_method: method, pg_status: "READY" }).eq("id", b.id);

      const hoursLeft = b.deposit_due_at ? Math.floor((new Date(b.deposit_due_at).getTime() - Date.now()) / 3600000) : 168;
      return json({
        storeId: STORE_ID,
        paymentId,
        amount: Number(b.total_price),
        orderName: `WEWE STAY ${b.accommodations?.title || "숙박"}`.slice(0, 40),
        customer: {
          customerId: caller.id,
          fullName: caller.full_name || undefined,
          email: caller.email || undefined,
          phoneNumber: (caller.phone || "").replace(/[^0-9]/g, "") || undefined,
        },
        virtualAccountHours: Math.max(1, Math.min(168, hoursLeft)),
      });
    }

    if (action === "complete") {
      const { paymentId } = body;
      if (!paymentId) return json({ error: "paymentId required" }, 400);
      const { data: b } = await sb.from("bookings").select("id, guest_id").eq("pg_payment_id", paymentId).maybeSingle();
      if (!b || (b.guest_id !== caller.id && !caller.isAdmin)) return json({ error: "결제 정보를 찾을 수 없습니다." }, 404);
      const result = await syncPayment(sb, paymentId);
      return json(result, result.ok ? 200 : 400);
    }

    if (action === "refund") {
      // 관리자: 결제 완료·환불 진행 중 건 모두. 선교사·숙소 제공자: cancel_paid_booking(환불 규정 확인)을 거쳐
      // "환불 진행 중"이 된 자기 예약만.
      const { bookingId, reason } = body;
      const { data: b } = await sb.from("bookings")
        .select("id, guest_id, payment_status, pg_method, pg_payment_id, accommodations(host_id)")
        .eq("id", bookingId).maybeSingle();
      if (!b) return json({ error: "예약을 찾을 수 없습니다." }, 404);
      const isParty = b.guest_id === caller.id || b.accommodations?.host_id === caller.id;
      if (!caller.isAdmin && !(isParty && b.payment_status === "refund_pending")) return json({ error: "Forbidden" }, 403);
      if (!["paid", "refund_pending"].includes(b.payment_status)) return json({ error: "환불할 결제가 없습니다." }, 400);
      if (b.pg_method !== "card" || !b.pg_payment_id) {
        return json({ error: "카드 결제만 여기서 취소할 수 있습니다. 가상계좌는 환불 계좌로 이체한 뒤 '환불 완료 처리'를 눌러주세요." }, 400);
      }
      const c = await portone(`/payments/${encodeURIComponent(b.pg_payment_id)}/cancel`, {
        method: "POST",
        body: JSON.stringify({ storeId: STORE_ID, reason: String(reason || "예약 취소에 따른 환불").slice(0, 100) }),
      });
      if (!c.ok) return json({ error: `포트원 취소 실패: ${c.body?.message || c.status}` }, 400);
      const result = await syncPayment(sb, b.pg_payment_id);
      return json({ ok: true, ...result });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
