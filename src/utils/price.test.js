import { totalForStay, priceUnit, priceBasis, isPerStay } from './price';

// 숙소 실비 방식 계산 (DB 트리거 guard_booking_status와 같은 규칙이어야 함)
test('1박 기준: 실비 × 박수, 기존 숙소(price_type 없음)도 1박 기준', () => {
  expect(totalForStay({ price: 30000, price_type: 'per_night' }, 3)).toBe(90000);
  expect(totalForStay({ price: 30000 }, 2)).toBe(60000);
  expect(priceUnit({ price: 30000 })).toBe('/박');
  expect(isPerStay({ price: 30000 })).toBe(false);
});

test('숙박 1회 정액: 박수와 관계없이 실비 그대로', () => {
  const acc = { price: 50000, price_type: 'per_stay' };
  expect(totalForStay(acc, 1)).toBe(50000);
  expect(totalForStay(acc, 7)).toBe(50000);
  expect(priceUnit(acc)).toBe('/1회');
  expect(priceBasis(acc)).toContain('박수 무관');
});
