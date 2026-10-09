import { normalizePayoutAccount, maskAccountNumber } from './PayoutAccountForm';

// 지급 계좌 입력 검사 (페이플 계좌조회 형식: 개인=생년월일 6자리, 법인·단체=사업자·고유번호 10자리)
jest.mock('../App', () => ({ supabase: {} }));

test('개인: 하이픈을 지우고 은행명을 채운다', () => {
  const { row, error } = normalizePayoutAccount({
    bank_code: '088', account_number: '110-123-456789', holder_name: ' 홍길동 ', holder_type: 'personal', holder_info: '90-01-01',
  });
  expect(error).toBeNull();
  expect(row).toEqual({
    bank_code: '088', bank_name: '신한은행', account_number: '110123456789', holder_name: '홍길동', holder_type: 'personal', holder_info: '900101',
  });
});

test('법인·단체는 10자리 번호가 필요하다', () => {
  const base = { bank_code: '004', account_number: '1234567890', holder_name: '사랑의교회', holder_type: 'corporate' };
  expect(normalizePayoutAccount({ ...base, holder_info: '900101' }).error).toContain('10자리');
  expect(normalizePayoutAccount({ ...base, holder_info: '501-82-75164' }).error).toBeNull();
});

test('은행 미선택·짧은 계좌번호는 거절', () => {
  expect(normalizePayoutAccount({ bank_code: '', account_number: '1234567', holder_name: 'a', holder_type: 'personal', holder_info: '900101' }).error).toContain('은행');
  expect(normalizePayoutAccount({ bank_code: '088', account_number: '123', holder_name: 'a', holder_type: 'personal', holder_info: '900101' }).error).toContain('계좌번호');
});

test('계좌번호 가리기', () => {
  expect(maskAccountNumber('110123456789')).toBe('********6789');
});
