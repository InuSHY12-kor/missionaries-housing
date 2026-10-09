import { createClient } from "npm:@supabase/supabase-js@2.45.4";

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

function getBearerJwt(req) {
  const authHeader = req.headers.get("Authorization") || "";
  return authHeader.replace(/^Bearer\s+/i, "");
}

// 예약이 확정(confirmed)된 후, 게스트가 토스페이먼츠 결제위젯으로 숙박비 전액을 결제하면
// 프론트엔드(PaymentSuccess.jsx)가 이 함수를 호출해 실제 결제 승인을 서버에서 처리합니다.
// 시크릿 키(TOSS_SECRET_KEY)는 절대 프론트엔드에 노출되면 안 되므로 승인 API 호출은
// 반드시 이 엣지 함수(서버)에서만 수행합니다.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { bookingId, orderId, paymentKey, amount } = body || {};
  if (!bookingId || !orderId || !paymentKey || amount == null) {
    return jsonResponse({ error: "bookingId, orderId, paymentKey, amount가 모두 필요합니다." }, 400);
  }

  const jwt = getBearerJwt(req);
  if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseUser = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
  if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);
  const callerId = userData.user.id;

  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  // RLS가 적용된 사용자 세션 클라이언트로 조회 — 게스트 본인 예약만 보이므로,
  // 결과가 없으면 존재하지 않거나 본인 예약이 아닌 것으로 간주합니다.
  const { data: booking, error: bookingErr } = await supabaseUser
    .from("bookings")
    .select("id, guest_id, status, payment_status, total_price")
    .eq("id", bookingId)
    .single();
  if (bookingErr || !booking) {
    return jsonResponse({ error: "예약을 찾을 수 없거나 접근 권한이 없습니다." }, 404);
  }
  // 결제는 반드시 예약한 본인만 진행할 수 있습니다 (관리자도 대신 결제할 수 없음).
  if (booking.guest_id !== callerId) {
    return jsonResponse({ error: "본인의 예약만 결제할 수 있습니다." }, 403);
  }
  if (booking.status !== "confirmed") {
    return jsonResponse({ error: "예약이 확정된 후에만 결제할 수 있습니다." }, 400);
  }
  if (booking.payment_status === "paid") {
    // 이미 결제 완료된 예약에 대한 재요청 — 에러 대신 성공으로 응답해 중복 처리에도 안전하게 함.
    return jsonResponse({ success: true, alreadyPaid: true });
  }

  // 결제 금액은 절대 클라이언트 값을 그대로 신뢰하지 않고, DB에 저장된 예약 금액과 반드시 비교합니다.
  const expectedAmount = Number(booking.total_price);
  const requestedAmount = Number(amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount !== expectedAmount) {
    return jsonResponse({ error: "결제 금액이 예약 금액과 일치하지 않습니다." }, 400);
  }

  const secretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!secretKey) {
    return jsonResponse({ error: "TOSS_SECRET_KEY가 설정되지 않았습니다. Supabase 대시보드에서 confirm-toss-payment 함수의 Secrets에 등록해주세요." }, 500);
  }

  let tossData;
  let tossOk = false;
  try {
    const basicAuth = "Basic " + btoa(`${secretKey}:`);
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Authorization": basicAuth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount: requestedAmount }),
    });
    tossData = await tossRes.json();
    tossOk = tossRes.ok;
  } catch (err) {
    console.error("Toss confirm API 호출 오류", err);
    return jsonResponse({ error: `토스페이먼츠 승인 요청 중 오류가 발생했습니다: ${err?.message || String(err)}` }, 502);
  }

  if (!tossOk) {
    // 실패 이력도 남겨서 관리자가 나중에 확인할 수 있도록 함.
    await supabaseAdmin.from("payments").insert({
      booking_id: bookingId,
      order_id: orderId,
      payment_key: paymentKey,
      amount: requestedAmount,
      status: "failed",
      failure_reason: tossData?.message || "알 수 없는 오류",
      raw_response: tossData,
    });
    return jsonResponse({ error: tossData?.message || "결제 승인에 실패했습니다." }, 400);
  }

  const { error: insertErr } = await supabaseAdmin.from("payments").insert({
    booking_id: bookingId,
    order_id: orderId,
    payment_key: tossData.paymentKey,
    amount: requestedAmount,
    status: "paid",
    method: tossData.method,
    receipt_url: tossData.receipt?.url,
    raw_response: tossData,
  });
  if (insertErr) {
    console.error("payments insert 오류", insertErr);
    // 결제 자체는 성공했으므로, 기록 저장에 실패하더라도 예약 상태는 반드시 반영합니다.
  }

  const { error: updateErr } = await supabaseAdmin
    .from("bookings")
    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", bookingId);
  if (updateErr) {
    console.error("bookings payment_status 업데이트 오류", updateErr);
    return jsonResponse({ error: "결제는 완료되었지만 예약 상태 갱신에 실패했습니다. 관리자에게 문의해주세요." }, 500);
  }

  return jsonResponse({ success: true, payment: tossData });
});
