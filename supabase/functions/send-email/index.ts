import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.10";

// Supabase Edge Function "send-email" (verify_jwt = false).
// (2026-10-07) 저장소에 원본을 보관하기 시작했습니다. 배포본(v17)에서 바뀐 점:
//   1) 관리자 대상 메일(문의 접수, 관리자 문의, 신규 가입, 이메일 인증 완료)을 환경변수
//      ADMIN_NOTIFY_EMAIL 한 곳에만 보내던 것을 → ADMIN_NOTIFY_EMAIL + "승인된 모든 관리자 중
//      이메일 알림을 켜 둔 사람"에게 보냅니다(getAdminRecipients). 최고관리자 계정이 가입 신청
//      알림 메일을 받지 못하던 문제의 원인이었습니다.
//   2) 새 type "admin_notification" — DB의 notifications 테이블에 관리자 앞으로 알림(종 아이콘)이
//      생길 때 DB 트리거(pg_net)가 이 함수를 호출해, 같은 내용을 해당 관리자에게 메일로도
//      보냅니다(새 숙소 등록, 예약/확정/취소, 리뷰 등 위 1)에 없는 모든 변동 사항).
//      위 1)에서 이미 자세한 메일을 보내는 종류는 중복 발송하지 않습니다.
//   3) (2026-10-10) "admin_notification"을 관리자뿐 아니라 승인된 모든 회원(선교사·숙소 제공자)에게도 —
//      회원 승인, 새 예약 요청, 예약 확정·취소, 숙소 승인, 리뷰 등 종 알림을 메일로도 받습니다
//      (위위스테이 이메일 알림 설정을 켠 경우). 관리자 전용 메일 테스트(type "test_email") 추가.
//      sendMail이 Gmail의 수락 결과를 로그로 남깁니다.
//   4) (2026-10-10) 관리자 메일을 동시에 보내지 않고 한 명씩 차례로 보냅니다(동시 SMTP 접속 제한 회피).
//      수신자별 결과를 로그에 남기고, 일부만 실패해도 로그에 남깁니다. test_email에 allAdmins 옵션 추가.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLE_LABEL = { admin: "관리자", host: "숙소 제공자", missionary: "선교사", supporter: "후원자" };

// 공개 테스트용 받은편지함 도메인 — 개인정보가 담긴 관리자 알림을 보내지 않습니다
// (예: QA용 관리자 계정 wewestay.qa.admin2@mailinator.com).
const BLOCKED_EMAIL_DOMAINS = ["mailinator.com"];

// 관리자 알림 메일(type "admin_notification")로 보내지 않는 알림 종류 — 다른 경로에서 이미
// 자세한 메일을 보내므로 중복을 막습니다.
//   member_signup  → admin_new_signup,  email_verified → admin_email_verified,
//   inquiry_new    → inquiry,           new_message    → host_contact / admin_contact / message_reply
const ADMIN_NOTIFICATION_SKIP_TYPES = ["member_signup", "email_verified", "inquiry_new", "new_message"];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// 최근(기본 30분 이내) 시각인지 — 누구나 호출 가능한 관리자 대상 메일의 반복 발송 방지용.
function isRecent(ts, minutes = 30) {
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() <= minutes * 60 * 1000;
}

function isDeliverableEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return false;
  const domain = email.split("@").pop().toLowerCase();
  return !BLOCKED_EMAIL_DOMAINS.includes(domain);
}

function wantsEmail(user) {
  // 위위스테이 알림(notification_email) 또는 위위 알림(notification_email_wewe) 중 하나라도 켜져 있으면 발송.
  return user?.notification_email !== false || user?.notification_email_wewe !== false;
}

// 관리자 대상 메일의 수신자 목록: ADMIN_NOTIFY_EMAIL + 승인된 관리자 중 이메일 알림을 켠 사람(중복 제거).
async function getAdminRecipients(supabaseAdmin) {
  const set = new Map();
  const envEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL");
  if (isDeliverableEmail(envEmail)) set.set(envEmail.toLowerCase(), envEmail);

  const { data: admins, error } = await supabaseAdmin
    .from("users")
    .select("email, notification_email, notification_email_wewe")
    .eq("role", "admin")
    .eq("status", "approved");
  if (error) console.error("admin recipients query error", error);

  for (const a of admins || []) {
    if (wantsEmail(a) && isDeliverableEmail(a.email)) set.set(a.email.toLowerCase(), a.email);
  }
  return [...set.values()];
}

// 같은 메일을 여러 관리자에게 각각 보냅니다(서로의 주소가 노출되지 않도록 1명씩, 차례로).
async function sendToAdmins(supabaseAdmin, mail) {
  const recipients = await getAdminRecipients(supabaseAdmin);
  if (recipients.length === 0) throw new Error("No admin recipients (ADMIN_NOTIFY_EMAIL / admin users)");
  const results = [];
  for (const to of recipients) {
    try {
      const r = await sendMail({ ...mail, to });
      results.push({ to, ok: true, response: r.response, rejected: r.rejected });
    } catch (err) {
      console.error("admin mail failed", to, String(err?.message || err));
      results.push({ to, ok: false, error: String(err?.message || err) });
    }
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length === recipients.length) throw new Error(failed[0].error);
  return { sent: recipients.length - failed.length, failed: failed.length, results };
}

// ─────────────────────────────────────────────
// 공통 상수
// ─────────────────────────────────────────────

// WEWE 로고 흰색 버전 (Netlify 서빙)
const WHITE_LOGO_URL = "https://wewestay.com/email-assets/wewe-logo-white.png";

// 인증 이메일 배너 사진 (Unsplash)
const VERIFICATION_BANNER_IMAGE_URL =
  "https://images.unsplash.com/photo-1632518741173-9c2d8e962704?auto=format&fit=crop&w=1200&h=500&q=80";

const FONT = "font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;";

// (Phase 7) 브랜드별 헤더 톤 — wewestay.com의 wewe-shared.css(WEWE 전체 홈페이지 공용 스타일)
// 에서 실제 쓰는 색상값을 그대로 가져와 이메일과 웹사이트의 톤을 맞춥니다.
//  - "stay"  : 기존 WEWE STAY 서비스 알림(예약/메시지/문의) 전용. 지금까지 쓰던 톤 그대로 유지.
//  - "wewe"  : 회원가입/이메일 인증/관리자 신규 가입 알림처럼 조직 전체(WEWE) 차원의 메일.
//              /about, /donate 등 WEWE 전체 홈페이지의 다크 히어로(.wp-hero)와 동일한
//              그라디언트 + 태그라인("위로자의 위로자")을 사용합니다.
const BRAND = {
  stay: {
    headerBg: "#20180f",
    headerGradient: "linear-gradient(135deg,#20180f 0%,#2a1f14 100%)",
    tagline: "위로자들을 위한 쉼의 공간",
    taglineColor: "#cbb89a",
    label: "WEWE STAY",
    orgName: "WEWE STAY",
    fromName: "WEWE STAY",
  },
  wewe: {
    headerBg: "#1c2f2c",
    headerGradient: "linear-gradient(135deg,#14201d 0%,#1c2f2c 55%,#22201a 100%)",
    tagline: "위로자의 위로자",
    taglineColor: "#f0c9a0",
    label: "WEWE",
    orgName: "WEWE",
    fromName: "WEWE",
  },
};

// ─────────────────────────────────────────────
// 1) 이메일 인증 전용 디자인 (히어로 사진 배너 포함)
// ─────────────────────────────────────────────
function buildVerificationEmailHtml(fullName, link, brand = "stay") {
  const b = BRAND[brand] || BRAND.stay;
  const name = escapeHtml(fullName);
  const introLine = brand === "wewe"
    ? `${name}님, 반갑습니다.<br/>WEWE와 함께해주셔서 감사합니다.`
    : `${name}님, 반갑습니다.<br/>WEWE STAY와 함께해주셔서 감사합니다.`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ee;padding:28px 14px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;">
  <tr>
    <td>
      <img src="${VERIFICATION_BANNER_IMAGE_URL}" width="560" alt="WEWE" style="display:block;width:100%;height:auto;border:0;" />
    </td>
  </tr>
  <tr>
    <td bgcolor="${b.headerBg}" align="center" style="background:${b.headerBg};background:${b.headerGradient};padding:18px 32px;">
      <img src="${WHITE_LOGO_URL}" width="30" alt="WEWE" style="display:block;margin:0 auto 8px;border:0;" />
      <span style="color:${b.taglineColor};font-size:10.5px;letter-spacing:0.1em;${FONT}">${b.tagline}</span>
    </td>
  </tr>
  <tr>
    <td style="padding:30px 32px 10px 32px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#b8622c;margin-bottom:10px;${FONT}">OUR STORY</div>
      <p style="margin:0 0 18px;font-size:14.5px;line-height:1.75;color:#4b4038;${FONT}">${introLine}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td bgcolor="#faf1e6" style="background:#faf1e6;border-left:3px solid #b8622c;padding:16px 18px;">
            <p style="margin:0 0 8px;font-size:13.5px;line-height:1.7;color:#5b4c3c;font-style:italic;${FONT}">"너희 중에 나그네나 고아와 과부들이 와서 먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라"</p>
            <p style="margin:0;font-size:12px;color:#9c8b76;${FONT}">(신명기 14:29)</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 22px;font-size:14.5px;line-height:1.75;color:#4b4038;${FONT}">WEWE는 '위로자의 위로자'라는 뜻으로, 사역 현장에서 지친 선교사님과 목회자님이 잠시 쉬어갈 수 있는 쉼터를 연결해드리고 있습니다. 이메일 인증을 마치시면 저희와 함께하실 준비가 끝나요.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr>
          <td bgcolor="#b8622c" style="background:#b8622c;background:linear-gradient(90deg,#d97b3f 0%,#b8622c 100%);border-radius:8px;">
            <a href="${link}" style="display:inline-block;padding:14px 30px;${FONT}font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">이메일 인증하고 시작하기</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 4px;font-size:12.5px;color:#93877c;line-height:1.7;${FONT}">인증을 완료해야 관리자 승인 절차가 진행됩니다. 링크는 48시간 동안 유효합니다.</p>
      <p style="margin:22px 0 0;font-size:13px;color:#8a7c6c;${FONT}">늘 응원하겠습니다.<br/><b style="color:#5b4c3c;">위위 드림</b></p>
      <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #eee2d3;font-size:11.5px;color:#a89c8f;word-break:break-all;line-height:1.7;${FONT}">버튼이 동작하지 않으면 다음 주소를 복사해 브라우저 주소창에 붙여넣어주세요:<br/>${link}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px;background:#faf6ef;border-top:1px solid #eee2d3;">
      <p style="margin:0;font-size:11.5px;color:#a89c8f;line-height:1.7;${FONT}">이 메일은 ${b.orgName}(wewestay.com)에서 발송되었습니다.<br/>본인이 요청하지 않은 메일이라면 별도 조치 없이 무시하셔도 됩니다.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>`;
}

// ─────────────────────────────────────────────
// 2) 일반 브랜드 이메일 빌더
//    title       : 메일 제목 (다크 헤더 아래 표시)
//    bodyHtml    : 본문 HTML (테이블 셀 안에 삽입)
//    ctaUrl      : 버튼 URL (없으면 버튼 미출력)
//    ctaText     : 버튼 텍스트 (기본 "바로 확인하기")
//    isAdmin     : true면 scripture 인용 생략 (관리자용 알림)
//    brand       : "stay"(기본, 예약/메시지/문의 알림) | "wewe"(가입/인증/관리자 신규가입 알림)
// ─────────────────────────────────────────────
function buildBrandedEmailHtml({ title, bodyHtml, ctaUrl = "", ctaText = "바로 확인하기", isAdmin = false, brand = "stay" }) {
  const b = BRAND[brand] || BRAND.stay;
  const ctaBlock = ctaUrl ? `<table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td bgcolor="#b8622c" style="background:#b8622c;background:linear-gradient(90deg,#d97b3f 0%,#b8622c 100%);border-radius:8px;">
            <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:13px 28px;${FONT}font-size:14.5px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(ctaText)}</a>
          </td>
        </tr>
      </table>` : "";

  const scriptureSection = isAdmin ? "" : `
  <tr>
    <td style="padding:0 32px 20px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td bgcolor="#faf1e6" style="background:#faf1e6;border-left:3px solid #b8622c;padding:14px 16px;">
            <p style="margin:0 0 6px;font-size:13px;line-height:1.7;color:#5b4c3c;font-style:italic;${FONT}">"너희 중에 나그네나 고아와 과부들이 와서 먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라"</p>
            <p style="margin:0;font-size:11.5px;color:#9c8b76;${FONT}">(신명기 14:29)</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  const signatureSection = isAdmin ? "" : `
  <tr>
    <td style="padding:0 32px 16px 32px;font-size:13px;color:#8a7c6c;${FONT}">
      늘 응원하겠습니다.<br/><b style="color:#5b4c3c;">위위 드림</b>
    </td>
  </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ee;padding:28px 14px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;">

  <tr>
    <td bgcolor="${b.headerBg}" align="center" style="background:${b.headerBg};background:${b.headerGradient};padding:20px 32px;">
      <img src="${WHITE_LOGO_URL}" width="30" alt="WEWE" style="display:block;margin:0 auto 8px;border:0;" />
      <span style="color:${b.taglineColor};font-size:10px;letter-spacing:0.12em;${FONT}">${b.tagline}</span>
    </td>
  </tr>

  <tr>
    <td style="padding:22px 32px 0 32px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#b8622c;margin-bottom:10px;${FONT}">${b.label}</div>
      <p style="margin:0 0 18px;font-size:17px;font-weight:700;color:#20180f;line-height:1.5;${FONT}">${escapeHtml(title)}</p>
    </td>
  </tr>

  ${scriptureSection}

  <tr>
    <td style="padding:0 32px 20px 32px;font-size:14.5px;line-height:1.75;color:#4b4038;${FONT}">
      ${bodyHtml}
    </td>
  </tr>

  ${ctaUrl ? `<tr><td style="padding:0 32px 24px 32px;">${ctaBlock}</td></tr>` : ""}

  ${signatureSection}

  <tr>
    <td style="padding:16px 32px;background:#faf6ef;border-top:1px solid #eee2d3;">
      <p style="margin:0;font-size:11.5px;color:#a89c8f;line-height:1.7;${FONT}">이 메일은 ${b.orgName}(wewestay.com)에서 발송되었습니다.<br/>본인이 요청하지 않은 메일이라면 별도 조치 없이 무시하셔도 됩니다.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>`;
}

// ─────────────────────────────────────────────
// SMTP 발송
// ─────────────────────────────────────────────
async function sendMail({ to, subject, text, html, fromName = "WEWE STAY" }) {
  const user = Deno.env.get("GMAIL_USER");
  const pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD가 설정되지 않았습니다.");
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    const info = await transport.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    console.log("mail sent", JSON.stringify({ subject, accepted: info.accepted, rejected: info.rejected, response: info.response }));
    return {
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || "",
      // Gmail은 보내는 계정 자신에게 보낸 메일을 받은편지함이 아니라 "보낸편지함/전체보관함"에만 둡니다.
      sameAsSender: String(to).trim().toLowerCase() === String(user).trim().toLowerCase(),
    };
  } catch (err) {
    console.error("Gmail SMTP error", err);
    throw new Error(`Gmail SMTP error: ${err?.message || String(err)}`);
  }
}

function getBearerJwt(req) {
  const authHeader = req.headers.get("Authorization") || "";
  return authHeader.replace(/^Bearer\s+/i, "");
}

// 알림(notifications.link)은 위위스테이 앱 기준 경로("/admin", "/my-bookings" …)라서 메일 버튼용
// 전체 주소로 바꿉니다. 관리자 페이지는 WEWE 쪽 관리자 페이지(/admin, 위위스테이와 같은 화면)로 연결.
function notificationLinkToUrl(link) {
  if (!link || typeof link !== "string" || !link.startsWith("/")) return "https://wewestay.com/admin";
  if (link === "/admin" || link.startsWith("/admin?") || link.startsWith("/admin/")) {
    return `https://wewestay.com${link}`;
  }
  return `https://wewestay.com/stay${link}`;
}

// ─────────────────────────────────────────────
// 메인 핸들러
// ─────────────────────────────────────────────
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

  const { type } = body || {};

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  try {
    // ── (2026-10-07) 관리자 알림 메일 — notifications 테이블 INSERT 트리거(pg_net)가 호출.
    //    누구나 호출할 수 있는 함수이므로(verify_jwt=false) 다음을 모두 확인한 뒤 1회만 보냅니다:
    //    알림이 실제로 존재 / 10분 이내 생성 / 아직 메일 미발송(emailed_at) / 받는 사람이 승인된 관리자.
    if (type === "admin_notification") {
      const { notificationId } = body;
      if (!notificationId) return jsonResponse({ error: "notificationId required" }, 400);

      // 먼저 emailed_at을 채워 "선점"합니다 — 중복 호출이 와도 한 번만 발송됩니다.
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: claimed, error: claimErr } = await supabaseAdmin
        .from("notifications")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", notificationId)
        .is("emailed_at", null)
        .gte("created_at", tenMinutesAgo)
        .select("id, recipient_id, type, title, body, link, created_at")
        .maybeSingle();
      if (claimErr) return jsonResponse({ error: claimErr.message }, 500);
      if (!claimed) return jsonResponse({ success: true, skipped: "not found, too old, or already emailed" });

      if (ADMIN_NOTIFICATION_SKIP_TYPES.includes(claimed.type)) {
        return jsonResponse({ success: true, skipped: "covered by a dedicated email" });
      }

      const { data: recipient } = await supabaseAdmin
        .from("users")
        .select("email, full_name, role, status, notification_email, notification_email_wewe")
        .eq("id", claimed.recipient_id)
        .maybeSingle();
      if (!recipient || recipient.status !== "approved") {
        return jsonResponse({ success: true, skipped: "recipient is not an approved member" });
      }
      if (!isDeliverableEmail(recipient.email)) {
        return jsonResponse({ success: true, skipped: "undeliverable address" });
      }

      // (2026-10-10) 관리자가 아닌 회원(선교사·숙소 제공자 등): 위위스테이 이메일 알림 설정을 따릅니다.
      if (recipient.role !== "admin") {
        if (recipient.notification_email === false) {
          return jsonResponse({ success: true, skipped: "recipient opted out" });
        }
        const memberTitle = claimed.title || "새 알림";
        const memberHtml = buildBrandedEmailHtml({
          title: memberTitle,
          bodyHtml: `
        <p style="margin:0 0 14px;">${escapeHtml(recipient.full_name ? `${recipient.full_name}님, ` : "")}${escapeHtml(claimed.body || "")}</p>
        <p style="margin:0 0 16px;font-size:12.5px;color:#93877c;">${escapeHtml(new Date(claimed.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }))}</p>
        <p style="margin:0;font-size:12px;color:#93877c;">이메일 알림은 위위스테이 프로필 &gt; 알림 설정에서 끌 수 있습니다.</p>`,
          ctaUrl: notificationLinkToUrl(claimed.link || "/dashboard"),
          ctaText: "위위스테이에서 확인",
          isAdmin: false,
          brand: "stay",
        });
        const memberText = `${memberTitle}\n${claimed.body || ""}\n\n${notificationLinkToUrl(claimed.link || "/dashboard")}`;
        await sendMail({ to: recipient.email, subject: `[WEWE STAY] ${memberTitle}`, text: memberText, html: memberHtml });
        return jsonResponse({ success: true });
      }

      if (!wantsEmail(recipient)) {
        return jsonResponse({ success: true, skipped: "recipient opted out" });
      }

      const emailTitle = claimed.title || "새 알림";
      const bodyHtml = `
        <p style="margin:0 0 14px;">${escapeHtml(claimed.body || "")}</p>
        <p style="margin:0 0 16px;font-size:12.5px;color:#93877c;">${escapeHtml(new Date(claimed.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }))}</p>`;
      const html = buildBrandedEmailHtml({
        title: emailTitle,
        bodyHtml,
        ctaUrl: notificationLinkToUrl(claimed.link),
        ctaText: "관리자 페이지에서 확인",
        isAdmin: true,
        brand: "wewe",
      });
      const text = `${emailTitle}\n${claimed.body || ""}\n\n${notificationLinkToUrl(claimed.link)}`;
      await sendMail({ to: recipient.email, subject: `[WEWE 관리자] ${emailTitle}`, text, html, fromName: "WEWE" });
      return jsonResponse({ success: true });
    }

    // ── (2026-10-10) 메일 발송 테스트 — 승인된 관리자만, 로그인한 본인 주소로 보내고 Gmail의 결과를 돌려줍니다.
    if (type === "test_email") {
      const jwt = getBearerJwt(req);
      if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_ANON_KEY"),
        { global: { headers: { Authorization: `Bearer ${jwt}` } } },
      );
      const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
      if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);
      const { data: me } = await supabaseAdmin
        .from("users")
        .select("email, full_name, role, status")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (!me || me.role !== "admin" || me.status !== "approved") return jsonResponse({ error: "Forbidden" }, 403);

      const sentAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      const html = buildBrandedEmailHtml({
        title: "메일 발송 테스트",
        bodyHtml: `<p style="margin:0 0 14px;">이 메일이 받은편지함에 보이면 WEWE 알림 메일이 정상적으로 도착하는 것입니다.</p>
        <p style="margin:0;font-size:12.5px;color:#93877c;">${escapeHtml(sentAt)} 발송</p>`,
        ctaUrl: "https://wewestay.com/admin",
        ctaText: "관리자 페이지 열기",
        isAdmin: true,
        brand: "wewe",
      });
      const mail = { subject: "[WEWE] 메일 발송 테스트", text: `메일 발송 테스트 (${sentAt})`, html, fromName: "WEWE" };
      // allAdmins: 관리자 알림 메일과 똑같은 경로(ADMIN_NOTIFY_EMAIL + 승인된 관리자)로 보내고 수신자별 결과를 돌려줍니다.
      if (body.allAdmins) {
        const summary = await sendToAdmins(supabaseAdmin, mail);
        return jsonResponse({ success: true, allAdmins: true, ...summary });
      }
      const result = await sendMail({ ...mail, to: me.email });
      return jsonResponse({ success: true, to: me.email, ...result });
    }

    // ── 문의 접수 (관리자 알림) — WEWE STAY 서비스(숙소 검색/예약) 자체 문의 폼. STAY 브랜딩 유지.
    if (type === "inquiry") {
      const { inquiryId } = body;
      if (!inquiryId) return jsonResponse({ error: "inquiryId required" }, 400);

      const { data: inquiry, error } = await supabaseAdmin
        .from("inquiries")
        .select("*")
        .eq("id", inquiryId)
        .single();
      if (error || !inquiry) return jsonResponse({ error: "Inquiry not found" }, 404);
      // (2026-10-07) 관리자 전원에게 가는 메일이라, 오래된 문의 id로 반복 호출하는 남용을 막습니다.
      if (inquiry.created_at && !isRecent(inquiry.created_at)) {
        return jsonResponse({ success: true, skipped: "inquiry is not recent" });
      }

      const bodyHtml = `
        <p style="margin:0 0 16px;">새로운 문의가 접수되었습니다. 아래 내용을 확인해주세요.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f0;border-radius:8px;padding:16px;margin-bottom:16px;">
          <tr><td style="padding:6px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">이름</b> &nbsp; ${escapeHtml(inquiry.name)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">이메일</b> &nbsp; ${escapeHtml(inquiry.email)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">전화</b> &nbsp; ${escapeHtml(inquiry.phone)}</td></tr>
          <tr><td style="padding:6px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">메시지</b><br/>${escapeHtml(inquiry.message || "(없음)").replace(/\n/g, "<br/>")}</td></tr>
        </table>`;

      const html = buildBrandedEmailHtml({
        title: "새로운 문의가 접수되었습니다",
        bodyHtml,
        ctaUrl: "https://wewestay.com/stay/admin",
        ctaText: "관리자 페이지에서 확인",
        isAdmin: true,
      });

      const text = `새 문의\n이름: ${inquiry.name}\n이메일: ${inquiry.email}\n전화: ${inquiry.phone}\n메시지: ${inquiry.message || "(없음)"}`;
      await sendToAdmins(supabaseAdmin, { subject: "[WEWE STAY] 새로운 문의가 접수되었습니다", text, html });
      return jsonResponse({ success: true });
    }

    // ── 숙소 문의 / 관리자 문의 — 예약/메시지 운영 알림. STAY 브랜딩 유지.
    if (type === "host_contact" || type === "admin_contact") {
      const { messageId } = body;
      if (!messageId) return jsonResponse({ error: "messageId required" }, 400);

      const jwt = getBearerJwt(req);
      if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);

      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_ANON_KEY"),
        { global: { headers: { Authorization: `Bearer ${jwt}` } } },
      );
      const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
      if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);

      const { data: msg, error: msgErr } = await supabaseAdmin
        .from("messages")
        .select("id, sender_id, recipient_id, message, accommodation_id, sender:users!messages_sender_id_fkey(full_name, church_name), recipient:users!messages_recipient_id_fkey(full_name, email), accommodations(title)")
        .eq("id", messageId)
        .single();
      if (msgErr || !msg) return jsonResponse({ error: "Message not found" }, 404);

      if (msg.sender_id !== userData.user.id) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const senderName = msg.sender?.full_name || "이용자";
      const accTitle = msg.accommodations?.title;
      const contextLine = accTitle ? `(숙소: ${accTitle})` : "";

      let subject, emailTitle, isAdminMail;
      if (type === "host_contact") {
        emailTitle = `${senderName}님이 문의를 남겨주셨습니다`;
        subject = `[WEWE STAY] ${emailTitle}${contextLine ? " " + contextLine : ""}`;
        isAdminMail = false;
      } else {
        emailTitle = `관리자 문의: ${senderName}님`;
        subject = `[WEWE STAY] ${emailTitle}${contextLine ? " " + contextLine : ""}`;
        isAdminMail = true;
      }

      const bodyHtml = `
        <p style="margin:0 0 14px;"><b style="color:#20180f;">${escapeHtml(senderName)}</b>님이 메시지를 보냈습니다${contextLine ? " " + escapeHtml(contextLine) : ""}.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f0;border-radius:8px;padding:16px;margin-bottom:16px;">
          <tr><td style="font-size:14px;line-height:1.75;color:#4b4038;white-space:pre-wrap;">${escapeHtml(msg.message)}</td></tr>
        </table>`;

      const html = buildBrandedEmailHtml({
        title: emailTitle,
        bodyHtml,
        ctaUrl: "https://wewestay.com/stay/messages",
        ctaText: "메시지함에서 답장하기",
        isAdmin: isAdminMail,
      });

      const text = `${senderName}님이 보낸 메시지${contextLine ? " " + contextLine : ""}:\n\n${msg.message}`;
      if (type === "host_contact") {
        const to = msg.recipient?.email;
        if (!to) return jsonResponse({ error: "Recipient email not found" }, 500);
        await sendMail({ to, subject, text, html });
      } else {
        await sendToAdmins(supabaseAdmin, { subject, text, html });
      }
      return jsonResponse({ success: true });
    }

    // ── 메시지 답장 알림 — 예약/메시지 운영 알림. STAY 브랜딩 유지.
    if (type === "message_reply") {
      const { messageId } = body;
      if (!messageId) return jsonResponse({ error: "messageId required" }, 400);

      const jwt = getBearerJwt(req);
      if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);

      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_ANON_KEY"),
        { global: { headers: { Authorization: `Bearer ${jwt}` } } },
      );
      const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
      if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);

      const { data: msg, error: msgErr } = await supabaseAdmin
        .from("messages")
        .select("id, sender_id, recipient_id, message, accommodation_id, sender:users!messages_sender_id_fkey(full_name, church_name), recipient:users!messages_recipient_id_fkey(full_name, email), accommodations(title)")
        .eq("id", messageId)
        .single();
      if (msgErr || !msg) return jsonResponse({ error: "Message not found" }, 404);

      if (msg.sender_id !== userData.user.id) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const senderName = msg.sender?.full_name || "이용자";
      const accTitle = msg.accommodations?.title;
      const contextLine = accTitle ? `(숙소: ${accTitle})` : "";
      const to = msg.recipient?.email;
      if (!to) return jsonResponse({ error: "Recipient email not found" }, 500);

      const emailTitle = `${senderName}님이 답장을 보냈습니다`;
      const subject = `[WEWE STAY] ${emailTitle}${contextLine ? " " + contextLine : ""}`;

      const bodyHtml = `
        <p style="margin:0 0 14px;"><b style="color:#20180f;">${escapeHtml(senderName)}</b>님이 답장을 보냈습니다${contextLine ? " " + escapeHtml(contextLine) : ""}.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f0;border-radius:8px;padding:16px;margin-bottom:16px;">
          <tr><td style="font-size:14px;line-height:1.75;color:#4b4038;white-space:pre-wrap;">${escapeHtml(msg.message)}</td></tr>
        </table>`;

      const html = buildBrandedEmailHtml({
        title: emailTitle,
        bodyHtml,
        ctaUrl: "https://wewestay.com/stay/messages",
        ctaText: "메시지함에서 대화 이어가기",
        isAdmin: false,
      });

      const text = `${senderName}님이 보낸 답장${contextLine ? " " + contextLine : ""}:\n\n${msg.message}`;
      await sendMail({ to, subject, text, html });
      return jsonResponse({ success: true });
    }

    // ── 이메일 인증 — (Phase 7) 가입/온보딩 단계의 첫 메일이라 WEWE 전체 브랜딩 적용.
    if (type === "email_verification") {
      const { userId, link } = body;
      if (!userId || !link) return jsonResponse({ error: "userId and link required" }, 400);

      const jwt = getBearerJwt(req);
      if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);

      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_ANON_KEY"),
        { global: { headers: { Authorization: `Bearer ${jwt}` } } },
      );
      const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
      if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);
      const callerId = userData.user.id;

      const { data: targetUser, error: targetErr } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name")
        .eq("id", userId)
        .single();
      if (targetErr || !targetUser) return jsonResponse({ error: "User not found" }, 404);

      let allowed = callerId === userId;
      if (!allowed) {
        const { data: caller } = await supabaseAdmin
          .from("users")
          .select("role, status")
          .eq("id", callerId)
          .single();
        allowed = caller?.role === "admin" && caller?.status === "approved";
      }
      if (!allowed) return jsonResponse({ error: "Forbidden" }, 403);

      const subject = "[WEWE] 이메일 주소를 인증해주세요";
      const text = `${targetUser.full_name}님, 반갑습니다. WEWE와 함께해주셔서 감사합니다.\n\n아래 링크를 눌러 이메일 인증을 완료해주세요:\n${link}\n\n인증을 완료해야 관리자 승인 절차가 진행됩니다. (링크는 48시간 동안 유효합니다)\n\n이 메일은 WEWE(wewestay.com)에서 발송되었습니다.`;
      const html = buildVerificationEmailHtml(targetUser.full_name, link, "wewe");

      await sendMail({ to: targetUser.email, subject, text, html, fromName: "WEWE" });
      return jsonResponse({ success: true });
    }

    // ── 관리자: 새 가입 신청 / 이메일 인증 완료 알림 — (Phase 7) 조직 전체 차원의 알림이라 WEWE 전체 브랜딩 적용.
    if (type === "admin_new_signup" || type === "admin_email_verified") {
      const { userId } = body;
      if (!userId) return jsonResponse({ error: "userId required" }, 400);

      const { data: targetUser, error: targetErr } = await supabaseAdmin
        .from("users")
        .select("full_name, email, role, email_verified_at, created_at")
        .eq("id", userId)
        .single();
      if (targetErr || !targetUser) return jsonResponse({ error: "User not found" }, 404);

      // (2026-10-07) 누구나 호출할 수 있는 함수라, 관리자 전원에게 메일이 반복 발송되는 남용을 막기
      // 위해 최근(30분 이내) 가입한 회원에 대해서만 "새 가입 신청" 메일을 보냅니다.
      if (type === "admin_new_signup" && !isRecent(targetUser.created_at)) {
        return jsonResponse({ success: true, skipped: "signup is not recent" });
      }
      if (type === "admin_email_verified" && !isRecent(targetUser.email_verified_at)) {
        return jsonResponse({ success: true, skipped: "verification is not recent" });
      }

      const roleLabel = ROLE_LABEL[targetUser.role] || targetUser.role;
      // (Phase 6) 후원자는 서류 심사·관리자 승인 없이 즉시 승인되므로, 신규 가입 알림 메일의
      // 문구도 "승인해주세요"가 아닌 참고용 안내로 다르게 보여줍니다.
      const isSupporterSignup = targetUser.role === "supporter";

      let emailTitle, subject, text, bodyHtml;
      if (type === "admin_new_signup") {
        emailTitle = `새 가입 신청: ${targetUser.full_name}`;
        subject = `[WEWE] ${emailTitle}`;
        text = isSupporterSignup
          ? `${targetUser.full_name}(${targetUser.email})님이 ${roleLabel}(으)로 가입했습니다. 후원자는 서류 심사·승인 없이 즉시 이용 가능합니다(참고용 알림).`
          : `${targetUser.full_name}(${targetUser.email})님이 ${roleLabel}(으)로 가입 신청했습니다.\n이메일 인증: ${targetUser.email_verified_at ? "완료" : "미완료"}\n관리자 페이지에서 확인해주세요.`;
        bodyHtml = `
          <p style="margin:0 0 14px;"><b style="color:#20180f;">${escapeHtml(targetUser.full_name)}</b>(${escapeHtml(targetUser.email)})님이 <b>${escapeHtml(roleLabel)}</b>(으)로 가입${isSupporterSignup ? "했습니다" : " 신청했습니다"}.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f0;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <tr><td style="padding:4px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">역할</b> &nbsp; ${escapeHtml(roleLabel)}</td></tr>
            <tr><td style="padding:4px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">이메일</b> &nbsp; ${escapeHtml(targetUser.email)}</td></tr>
            ${isSupporterSignup ? "" : `<tr><td style="padding:4px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">인증 상태</b> &nbsp; ${targetUser.email_verified_at ? "✅ 완료" : "⏳ 미완료"}</td></tr>`}
          </table>
          <p style="margin:0 0 16px;font-size:13.5px;color:#4b4038;">${isSupporterSignup ? "후원자는 서류 심사와 관리자 승인 없이 즉시 이용 가능합니다. 별도로 확인하실 사항은 없습니다(참고용 알림)." : `관리자 페이지의 <b>'승인 대기 사용자'</b> 탭에서 확인 후 승인 여부를 결정해주세요.`}</p>`;
      } else {
        emailTitle = `이메일 인증 완료: ${targetUser.full_name}`;
        subject = `[WEWE] ${emailTitle}`;
        text = `${targetUser.full_name}(${targetUser.email})님이 이메일 인증을 완료했습니다. 승인 여부를 확인해주세요.`;
        bodyHtml = `
          <p style="margin:0 0 14px;"><b style="color:#20180f;">${escapeHtml(targetUser.full_name)}</b>(${escapeHtml(targetUser.email)})님이 이메일 인증을 완료했습니다.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4f0;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <tr><td style="padding:4px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">역할</b> &nbsp; ${escapeHtml(roleLabel)}</td></tr>
            <tr><td style="padding:4px 0;font-size:13.5px;color:#4b4038;"><b style="color:#20180f;">이메일</b> &nbsp; ${escapeHtml(targetUser.email)}</td></tr>
          </table>
          <p style="margin:0 0 16px;font-size:13.5px;color:#4b4038;">승인 여부를 관리자 페이지에서 확인해주세요.</p>`;
      }

      const html = buildBrandedEmailHtml({
        title: emailTitle,
        bodyHtml,
        ctaUrl: "https://wewestay.com/admin",
        ctaText: "관리자 페이지에서 확인",
        isAdmin: true,
        brand: "wewe",
      });

      await sendToAdmins(supabaseAdmin, { subject, text, html, fromName: "WEWE" });
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unknown type" }, 400);
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: String(e?.message || e) }, 500);
  }
});
