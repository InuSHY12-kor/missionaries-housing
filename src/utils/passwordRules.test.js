import { passwordProblem, authErrorMessage } from './passwordRules';

// 비밀번호 규칙 (2026-10-14): Supabase Auth 설정(8자 이상, 영문·숫자)과 같게 미리 확인
test('비밀번호 규칙: 길이·영문·숫자', () => {
  expect(passwordProblem('abc123')).toContain('8자');
  expect(passwordProblem('abcdefgh')).toContain('영문과 숫자');
  expect(passwordProblem('12345678')).toContain('영문과 숫자');
  expect(passwordProblem('wewe2026')).toBeNull();
  expect(passwordProblem('WeWe!stay9')).toBeNull();
});

test('Supabase 영어 오류를 한국어로', () => {
  expect(authErrorMessage({ code: 'weak_password', message: 'Password should contain at least one character of each' })).toContain('너무 단순');
  expect(authErrorMessage({ message: 'New password should be different from the old password.' })).toContain('지금 비밀번호와 같습니다');
  expect(authErrorMessage({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' })).toContain('잠시 후');
  expect(authErrorMessage({ message: 'Something else' })).toBe('Something else');
});
