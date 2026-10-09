import React from 'react';
import PageHero from '../components/PageHero';

const REFUND_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1766431066492-9bec8410a57b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1771354959667-96360bf59eab?auto=format&fit=crop&w=1800&q=80',
];

// WEWE STAY 취소·환불 규정 (/stay/refund-policy, 2026-10-10 신설).
// 토스페이먼츠 실결제 심사와 이용자 안내를 위한 공개 페이지입니다. 실제 환불 처리 규칙은
// 서버 함수 cancel-toss-payment와 같습니다(입실일 전날까지 게스트 취소 시 전액 환불).
// 내용을 바꾸면 cancel-toss-payment의 규칙과 결제 화면(BookingCheckout) 안내도 함께 맞춰주세요.
function RefundPolicy() {
  return (
    <div className="refund-policy-page">
      <PageHero
        images={REFUND_HERO_IMAGES}
        eyebrow="REFUND POLICY"
        title="취소·환불 규정"
        subtitle="WEWE STAY 숙박 실비 결제의 취소와 환불 기준을 안내합니다"
      />
      <div className="container rp-container">
        <section className="rp-card">
          <h2>1. 기본 원칙</h2>
          <p>
            WEWE STAY는 비영리단체 WEWE(위로자의 위로자)가 운영하는 선교사 숙소 연결 서비스입니다.
            숙박 비용은 숙소 운영에 필요한 실비 수준으로 책정되며, 예약이 숙소 제공자에 의해 확정된 후에
            결제하실 수 있습니다.
          </p>
        </section>

        <section className="rp-card rp-highlight">
          <h2>2. 이용자(게스트)의 취소·환불</h2>
          <table className="rp-table">
            <thead>
              <tr>
                <th>취소 시점</th>
                <th>환불 금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>입실일 <b>전날까지</b> 취소</td>
                <td><b>결제 금액 전액 환불</b></td>
              </tr>
              <tr>
                <td>입실일 <b>당일 이후</b></td>
                <td>직접 취소·환불 불가 (부득이한 사정은 관리자에게 문의)</td>
              </tr>
            </tbody>
          </table>
          <p className="rp-note">취소 기준 시각은 한국 시간(KST) 기준입니다. 결제 전 예약은 언제든 비용 없이 취소하실 수 있습니다.</p>
        </section>

        <section className="rp-card">
          <h2>3. 숙소 제공자 또는 운영자 사정에 의한 취소</h2>
          <p>
            숙소 제공자의 사정이나 숙소 사정(시설 문제 등)으로 예약이 취소되는 경우, 시점과 관계없이
            결제 금액 <b>전액을 환불</b>해드립니다.
          </p>
        </section>

        <section className="rp-card">
          <h2>4. 환불 방법과 기간</h2>
          <ul>
            <li>환불은 결제하신 수단(카드·간편결제 등)으로 결제 취소 방식으로 진행됩니다.</li>
            <li>카드 결제 취소는 카드사에 따라 영업일 기준 약 3~7일 안에 반영됩니다.</li>
            <li>취소는 마이페이지 &gt; 내 예약에서 직접 하실 수 있으며, 결제 완료된 예약은 취소와 함께 자동으로 환불이 요청됩니다.</li>
          </ul>
        </section>

        <section className="rp-card">
          <h2>5. 문의</h2>
          <p>
            취소·환불 관련 문의는 WEWE로 연락해주세요.<br />
            이메일 <a href="mailto:wewe@wewestay.com">wewe@wewestay.com</a> · 전화 010-8339-7740
          </p>
          <p className="rp-note">시행일: 2026년 10월 10일</p>
        </section>
      </div>

      <style>{`
        .rp-container {
          max-width: 820px;
          padding-bottom: 4rem;
        }

        .rp-card {
          background: #fff;
          border: 1px solid #e5e2da;
          border-radius: 12px;
          padding: 1.5rem 1.6rem;
          margin-bottom: 1rem;
          word-break: keep-all;
        }

        .rp-card h2 {
          font-size: 1.15rem;
          margin: 0 0 0.75rem;
          color: #1c1c1a;
        }

        .rp-card p,
        .rp-card li {
          color: #3a3a36;
          line-height: 1.8;
          font-size: 0.98rem;
        }

        .rp-card ul {
          margin: 0;
          padding-left: 1.2rem;
        }

        .rp-highlight {
          border: 2px solid #d97b3f;
        }

        .rp-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0.75rem;
          font-size: 0.96rem;
        }

        .rp-table th,
        .rp-table td {
          border: 1px solid #e5e2da;
          padding: 0.7rem 0.85rem;
          text-align: left;
        }

        .rp-table th {
          background: #faf6ef;
        }

        .rp-note {
          font-size: 0.88rem !important;
          color: #6b665c !important;
          margin: 0.5rem 0 0;
        }
      `}</style>
    </div>
  );
}

export default RefundPolicy;
