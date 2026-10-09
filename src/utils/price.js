// 숙소 실비 방식 (2026-10-10). DB accommodations.price_type과 같습니다.
//   per_night: 1박 기준 — 총액 = 실비 × 박수 (기본값, 기존 숙소)
//   per_stay : 숙박 1회 정액 — 박수와 관계없이 총액 = 실비
// 실제 결제 금액은 DB 트리거(guard_booking_status)가 같은 규칙으로 다시 계산합니다.
export const PRICE_TYPES = {
  per_night: { label: '1박 기준', unit: '/박', basis: '1박 숙박 실비' },
  per_stay: { label: '숙박 1회 정액', unit: '/1회', basis: '숙박 1회 실비 (박수 무관)' },
};

export function isPerStay(accommodation) {
  return accommodation?.price_type === 'per_stay';
}

export function priceUnit(accommodation) {
  return isPerStay(accommodation) ? PRICE_TYPES.per_stay.unit : PRICE_TYPES.per_night.unit;
}

export function priceBasis(accommodation) {
  return isPerStay(accommodation) ? PRICE_TYPES.per_stay.basis : PRICE_TYPES.per_night.basis;
}

export function totalForStay(accommodation, nights) {
  const price = Number(accommodation?.price) || 0;
  if (isPerStay(accommodation)) return price;
  return price * (Number(nights) || 0);
}

// 정산지급대행 수수료(숙소 제공자 부담) — 지급 시 실비에서 빼고 보냅니다.
// 원 단위 미만은 올림해 수수료가 실제보다 적게 안내되지 않도록 합니다.
export function payoutFee(amount, rate) {
  const value = Number(amount) || 0;
  return Math.ceil(value * rate);
}

export function payoutNet(amount, rate) {
  const value = Number(amount) || 0;
  return value - payoutFee(value, rate);
}
