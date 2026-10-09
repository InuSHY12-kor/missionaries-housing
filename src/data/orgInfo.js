// WEWE STAY 운영 단체 정보 (2026-10-10).
// 서비스 안내·약관·개인정보처리방침·환불 규정 페이지가 함께 씁니다. 정보가 바뀌면 여기만 고치세요.
// (랜딩 페이지 푸터와 WEWE 푸터는 관리자 편집 문구라 따로 관리됩니다.)
export const ORG_INFO = {
  serviceName: 'WEWE STAY',
  orgName: '법인으로 보는 단체 WEWE (위로자의 위로자)',
  orgShortName: 'WEWE(위로자의 위로자)',
  representative: '홍현지',
  registrationNo: '501-82-75164',
  registrationLabel: '고유번호',
  address: '서울특별시 종로구 대학로12길 61, 5층 501-176A호(동승동, 계우빌딩)',
  phone: '010-8339-7740',
  email: 'wewe@wewestay.com',
  hours: '평일 10:00 ~ 17:00 (주말·공휴일 휴무)',
  privacyOfficer: '홍현지 (대표)',
  paymentPartner: '페이플(Payple)',
  kakaoChannel: 'https://pf.kakao.com/_ISXFX',
};

// 숙박 실비 입금·지급 정책 (2026-10-10). 바뀌면 여기만 고치면 안내 문구와 계산에 함께 반영됩니다.
//   depositDays: 가상계좌 발급 후 입금 기한(일) — DB 마이그레이션 bank_transfer_flow의 7일과 같아야 합니다.
//   payoutFeeRate: 숙소 제공자에게 지급할 때 정산지급대행 업체(페이플)가 가져가는 수수료율.
//     페이플은 요율을 공개하지 않고 계약 때 정하므로, 계약서의 요율로 꼭 바꿔주세요.
export const PAYMENT_POLICY = {
  depositDays: 7,
  payoutFeeRate: 0.015,
  payoutFeeLabel: '1.5%',
};
