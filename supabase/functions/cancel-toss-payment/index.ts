import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Supabase Edge Function "cancel-toss-payment" (verify_jwt = true) — 2026-10-10 신설.
// 결제 완료된 WEWE STAY 예약을 취소하면서 토스페이먼츠 결제를 전액 환불합니다.
//
// 환불 규정(사이트 /stay/refund-policy와 동일): 입실일 전날까지 취소하면 전액 환불, 입실일 당일부터는
// 게스트가 직접 취소·환불할 수 없습니다(관리자 문의). 숙소 제공자·관리자는 언제든 취소·전액 환불 가능.
// 시크릿 키(TOSS_SECRET_KEY)는 서버에서만 사용합니다.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 한국 시간 기준 오늘 날짜(YYYY-MM-DD)
function todayKst() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { bookingId } = body || {};
  const reason = String(body?.reason || "예약 취소").slice(0, 200);
  if (!bookingId) return jsonResponse({ error: "bookingId가 필요합니다." }, 400);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
  if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);
  const callerId = userData.user.id;

  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("id, guest_id, status, payment_status, total_price, check_in, accommodations(host_id)")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingErr || !booking) return jsonResponse({ error: "예약을 찾을 수 없습니다." }, 404);

  const { data: caller } = await supabaseAdmin
    .from("users")
    .select("role, status")
    .eq("id", callerId)
    .maybeSingle();
  const isAdmin = caller?.role === "admin" && caller?.status === "approved";
  const isHost = booking.accommodations?.host_id === callerId;
  const isGuest = booking.guest_id === callerId;
  if (!isAdmin && !isHost && !isGuest) return jsonResponse({ error: "이 예약을 취소할 권한이 없습니다." }, 403);

  if (booking.payment_status === "refunded") return jsonResponse({ success: true, alreadyRefunded: true });
  if (booking.payment_status !== "paid") return jsonResponse({ error: "결제 완료된 예약만 환불할 수 있습니다." }, 400);

  // 게스트 본인 취소는 입실일 전날까지만(한국 시간 기준)
  if (isGuest && !isAdmin && !isHost && !(todayKst() < String(booking.check_in))) {
    return jsonResponse({
      error: "입실일 당일부터는 직접 취소·환불할 수 없습니다. 관리자에게 문의해주세요.",
      code: "REFUND_WINDOW_CLOSED",
    }, 400);
  }

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, payment_key, amount")
    .eq("booking_id", bookingId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment?.payment_key) return jsonResponse({ error: "결제 기록을 찾을 수 없습니다. 관리자에게 문의해주세요." }, 404);

  const secretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!secretKey) return jsonResponse({ error: "TOSS_SECRET_KEY가 설정되지 않았습니다." }, 500);

  let tossData;
  let tossOk = false;
  try {
    const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(payment.payment_key)}/cancel`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${secretKey}:`),
        "Content-Type": "application/json",
        // 같은 예약에 대한 중복 환불 요청을 토스가 한 번만 처리하도록
        "Idempotency-Key": `wewe-refund-${bookingId}`,
      },
      body: JSON.stringify({ cancelReason: reason }),
    });
    tossData = await res.json();
    tossOk = res.ok;
  } catch (err) {
    console.error("Toss cancel API 오류", err);
    return jsonResponse({ error: `환불 요청 중 오류가 발생했습니다: ${err?.message || String(err)}` }, 502);
  }

  if (!tossOk) {
    return jsonResponse({ error: tossData?.message || "환불에 실패했습니다." }, 400);
  }

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("payments")
    .update({ status: "refunded", refunded_at: now, cancel_reason: reason, raw_response: tossData, updated_at: now })
    .eq("id", payment.id);

  const { error: updErr } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled", payment_status: "refunded" })
    .eq("id", bookingId);
  if (updErr) {
    console.error("bookings 환불 상태 업데이트 오류", updErr);
    return jsonResponse({ error: "환불은 완료되었지만 예약 상태 갱신에 실패했습니다. 관리자에게 문의해주세요." }, 500);
  }

  return jsonResponse({ success: true, refundedAmount: payment.amount });
});
