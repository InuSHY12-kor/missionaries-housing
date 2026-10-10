import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.10";

// Supabase Edge Function "send-announcement" (verify_jwt = true) — 2026-10-10 신설.
// 관리자 페이지 "공지 메일 보내기"에서 선교사·숙소 제공자·후원자(복수 선택)에게 공지 메일을 보냅니다.
//   - 승인된 관리자만 호출할 수 있습니다(로그인 토큰 확인 + users.role/status 확인).
//   - 보내는 주소: GMAIL_USER(wewe@wewestay.com, Google Workspace) — send-email과 같은 계정.
//   - 본문 HTML은 WEWE 안내 메일 프레임(send-email의 buildBrandedEmailHtml과 같은 디자인)으로 감쌉니다.
//   - 이메일 알림을 끈 회원은 제외합니다(후원자: notification_email_wewe, 그 외: notification_email).
//   - previewOnly: 실제로 보내지 않고 완성된 메일 HTML과 받는 사람 수만 돌려줍니다.
//   - testOnly: 요청한 관리자 본인에게만 보냅니다.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLES = ["missionary", "host", "supporter"];
const BLOCKED_EMAIL_DOMAINS = ["mailinator.com"];
const WHITE_LOGO_URL = "https://wewestay.com/email-assets/wewe-logo-white.png";
const FONT = "font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 관리자가 작성한 HTML이지만, 메일에 들어가면 안 되는 것(스크립트, 이벤트 속성, javascript: 링크 등)은 제거합니다.
function sanitizeHtml(html) {
  return String(html || "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*(javascript|vbscript|data:text)[^"']*\2/gi, '$1="#"')
    .slice(0, 200000);
}

// send-email의 buildBrandedEmailHtml(brand "wewe", 일반 회원용)과 같은 프레임
function buildFrame(title, bodyHtml) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ee;padding:28px 14px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;">
  <tr>
    <td bgcolor="#1c2f2c" align="center" style="background:#1c2f2c;background:linear-gradient(135deg,#14201d 0%,#1c2f2c 55%,#22201a 100%);padding:20px 32px;">
      <img src="${WHITE_LOGO_URL}" width="30" alt="WEWE" style="display:block;margin:0 auto 8px;border:0;" />
      <span style="color:#f0c9a0;font-size:10px;letter-spacing:0.12em;${FONT}">위로자의 위로자</span>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 32px 0 32px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#b8622c;margin-bottom:10px;${FONT}">WEWE 공지</div>
      <p style="margin:0 0 18px;font-size:17px;font-weight:700;color:#20180f;line-height:1.5;${FONT}">${escapeHtml(title)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 20px 32px;font-size:14.5px;line-height:1.75;color:#4b4038;${FONT}">
      ${bodyHtml}
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 16px 32px;font-size:13px;color:#8a7c6c;${FONT}">
      늘 응원하겠습니다.<br/><b style="color:#5b4c3c;">위위 드림</b>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 32px;background:#faf6ef;border-top:1px solid #eee2d3;">
      <p style="margin:0;font-size:11.5px;color:#a89c8f;line-height:1.7;${FONT}">이 메일은 WEWE(wewestay.com) 회원께 보내드리는 공지입니다.<br/>메일 수신을 원하지 않으시면 프로필 &gt; 알림 설정에서 이메일 알림을 꺼주세요.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>`;
}

function isDeliverable(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return false;
  return !BLOCKED_EMAIL_DOMAINS.includes(email.split("@").pop().toLowerCase());
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return jsonResponse({ error: "Authorization required" }, 401);
  const supabaseUser = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await supabaseUser.auth.getUser(jwt);
  if (userErr || !userData?.user) return jsonResponse({ error: "Invalid session" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: me } = await admin.from("users").select("email, role, status").eq("id", userData.user.id).maybeSingle();
  if (!me || me.role !== "admin" || me.status !== "approved") return jsonResponse({ error: "관리자만 보낼 수 있습니다." }, 403);

  const subject = String(body?.subject || "").trim().slice(0, 150);
  const roles = (Array.isArray(body?.roles) ? body.roles : []).filter((r) => ROLES.includes(r));
  const contentHtml = sanitizeHtml(body?.html);
  if (!subject) return jsonResponse({ error: "제목을 입력해주세요." }, 400);
  if (!htmlToText(contentHtml) && !/<img/i.test(contentHtml)) return jsonResponse({ error: "내용을 입력해주세요." }, 400);
  if (!body?.testOnly && roles.length === 0) return jsonResponse({ error: "받는 대상을 하나 이상 선택해주세요." }, 400);

  const html = buildFrame(subject, contentHtml);

  // 받는 사람: 선택한 역할의 승인된 회원 중 이메일 알림을 켠 사람(중복 제거)
  let recipients = [];
  if (roles.length > 0) {
    const { data: members, error } = await admin
      .from("users")
      .select("email, role, notification_email, notification_email_wewe")
      .in("role", roles)
      .eq("status", "approved");
    if (error) return jsonResponse({ error: error.message }, 500);
    const seen = new Set();
    for (const m of members || []) {
      const optedIn = m.role === "supporter" ? m.notification_email_wewe !== false : m.notification_email !== false;
      const key = String(m.email || "").toLowerCase();
      if (optedIn && isDeliverable(m.email) && !seen.has(key)) {
        seen.add(key);
        recipients.push(m.email);
      }
    }
  }

  if (body?.previewOnly) {
    return jsonResponse({ success: true, html, recipientCount: recipients.length });
  }
  if (body?.testOnly) recipients = [me.email];
  if (recipients.length === 0) return jsonResponse({ error: "보낼 수 있는 받는 사람이 없습니다." }, 400);

  const user = Deno.env.get("GMAIL_USER");
  const pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) return jsonResponse({ error: "메일 계정이 설정되지 않았습니다." }, 500);

  // 한 연결로 한 명씩 차례로 보냅니다(서로의 주소가 보이지 않도록 개별 발송).
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass }, pool: true, maxConnections: 1 });
  const text = `${subject}\n\n${htmlToText(contentHtml)}\n\n— WEWE (wewestay.com)`;
  let sent = 0;
  const failed = [];
  for (const to of recipients) {
    try {
      await transport.sendMail({ from: `"WEWE" <${user}>`, to, subject: `[WEWE] ${subject}`, text, html });
      sent += 1;
    } catch (err) {
      console.error("announcement failed", to, String(err?.message || err));
      failed.push(to);
    }
  }
  transport.close();
  console.log("announcement", JSON.stringify({ subject, roles, sent, failed: failed.length, test: !!body?.testOnly }));
  return jsonResponse({ success: true, sent, failed: failed.length, failedRecipients: failed, test: !!body?.testOnly });
});
