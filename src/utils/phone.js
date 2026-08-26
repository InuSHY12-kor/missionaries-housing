/**
 * 숫자만 입력된 전화번호를 010-0000-0000 형태로 자동 변환합니다.
 * 입력 중간에도 계속 호출되므로, 사용자가 지우거나 붙여넣는 모든 경우에
 * 항상 숫자만 남긴 뒤 자릿수에 맞춰 하이픈을 다시 삽입합니다.
 *
 * 예: "01000000000" -> "010-0000-0000"
 *     "0212345678"   -> "02-1234-5678" (2자리 지역번호도 대응)
 */
export function formatPhoneNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';

  // 서울 지역번호(02)는 2자리, 그 외는 3자리로 취급합니다.
  const areaLength = digits.startsWith('02') ? 2 : 3;

  if (digits.length <= areaLength) {
    return digits;
  }

  const area = digits.slice(0, areaLength);
  const rest = digits.slice(areaLength);

  if (rest.length <= 4) {
    return `${area}-${rest}`;
  }

  // 마지막 4자리는 항상 뒷자리로 고정하고, 중간 부분을 나머지로 채웁니다.
  const last = rest.slice(-4);
  const middle = rest.slice(0, rest.length - 4);
  return `${area}-${middle}-${last}`;
}

export default formatPhoneNumber;
