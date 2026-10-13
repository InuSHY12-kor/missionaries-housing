// 비밀번호 규칙 (2026-10-14) — Supabase Auth 설정(최소 8자, 영문·숫자 포함)과 같은 값입니다.
// 서버에서 실제로 막고, 화면에서는 미리 확인해 한국어로 안내합니다. 설정을 바꾸면 여기도 함께 맞춰주세요.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = '8자 이상, 영문과 숫자 포함';

// 문제가 있으면 안내 문구, 없으면 null
export function passwordProblem(password) {
  const pw = String(password || '');
  if (pw.length < PASSWORD_MIN_LENGTH) return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return '비밀번호에는 영문과 숫자가 모두 들어가야 합니다.';
  return null;
}

// Supabase Auth의 영어 오류를 한국어 안내로 바꿉니다(모르는 오류는 원문 그대로).
export function authErrorMessage(error) {
  const code = error?.code || '';
  const msg = String(error?.message || error || '');
  // "same password" 문구에도 "password should"가 들어 있으므로 먼저 확인합니다.
  if (code === 'same_password' || /different from the old password/i.test(msg)) {
    return '새 비밀번호가 지금 비밀번호와 같습니다. 다른 비밀번호를 입력해주세요.';
  }
  if (code === 'weak_password' || /password should/i.test(msg)) {
    return `비밀번호가 너무 단순합니다. ${PASSWORD_HINT}으로 입력해주세요.`;
  }
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || /rate limit/i.test(msg)) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  return msg;
}
