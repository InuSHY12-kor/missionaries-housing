import React from 'react';
import { Link } from 'react-router-dom';
import { StayInfoLayout } from './StayInfo';
import { ORG_INFO, PAYMENT_POLICY } from '../data/orgInfo';
import { TERMS_EFFECTIVE_DATE } from '../data/termsOfService';

// WEWE STAY 취소·환불 규정 (/stay/refund-policy).
// 2026-10-10 신설, 같은 날 계좌이체(페이플 가상계좌) + 입실 후 지급대행 방식으로 개정.
// 기준(입실일 전날까지 전액 환불)을 바꾸면 이용약관(data/termsOfService.js),
// 이용 흐름(StayInfo.jsx)과 환불 처리 서버 함수도 함께 맞춰주세요.
function RefundPolicy() {
  return (
    <StayInfoLayout
      active="/refund-policy"
      eyebrow="REFUND POLICY"
      title="취소·환불 규정"
      subtitle="WEWE STAY 숙박 실비의 취소와 환불 기준을 안내합니다"
    >
      <section className="si-card">
        <h2>1. 기본 원칙</h2>
        <p>
          숙박 실비는 숙소 제공자가 관리비·청소비 등 실비 수준으로 정한 금액이며, 예약이 확정된 뒤
          {' '}{ORG_INFO.paymentPartner}가 발급한 예약 전용 가상계좌로 계좌이체하여 입금합니다.
          입금된 실비는 선교사님의 입실이 확인되기 전까지 숙소 제공자에게 지급되지 않으므로,
          입실 전 취소는 아래 기준에 따라 환불됩니다.
        </p>
      </section>

      <section className="si-card rp-highlight">
        <h2>2. 이용자(선교사)의 취소·환불</h2>
        <table className="si-table">
          <thead>
            <tr>
              <th>취소 시점</th>
              <th>환불 금액</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>입금 전</td>
              <td>비용 없이 언제든 취소</td>
            </tr>
            <tr>
              <td>입금 후 입실일 <b>전날까지</b> 취소</td>
              <td><b>입금액 전액 환불</b></td>
            </tr>
            <tr>
              <td>입실일 <b>당일 이후</b></td>
              <td>직접 취소·환불 불가 (부득이한 사정은 WEWE에 문의)</td>
            </tr>
          </tbody>
        </table>
        <p className="si-note">취소 기준 시각은 한국 시간(KST)입니다.</p>
      </section>

      <section className="si-card">
        <h2>3. 숙소 제공자 또는 숙소 사정에 의한 취소</h2>
        <p>
          숙소 제공자의 사정이나 숙소 사정(시설 문제 등)으로 예약이 취소되면, 시점과 관계없이
          입금액 <b>전액을 환불</b>해드립니다.
        </p>
      </section>

      <section className="si-card">
        <h2>4. 미입금 예약</h2>
        <p>
          숙박 실비는 계좌이체로만 받으며, 가상계좌 발급일로부터 <b>{PAYMENT_POLICY.depositDays}일 안에</b> 입금되지 않은 예약은
          자동으로 취소됩니다. 기한이 지난 가상계좌로는 입금되지 않으니 다시 예약해주세요.
        </p>
      </section>

      <section className="si-card">
        <h2>5. 환불 방법과 기간</h2>
        <ul>
          <li>환불은 <b>입금하신 분 본인 명의의 계좌</b>로 이체합니다. 취소 시 환불받을 계좌(은행, 계좌번호, 예금주)를 받습니다.</li>
          <li>환불 요청이 접수되면 영업일 기준 3일 안에 {ORG_INFO.paymentPartner}를 통해 이체합니다.</li>
          <li>입금액보다 많은 금액이 입금된 경우 차액도 함께 환불합니다.</li>
          <li>환불은 입금하신 금액 전액이며, 정산지급대행 수수료 등 별도 비용을 빼지 않습니다.</li>
          <li>입실이 확인되어 숙소 제공자에게 지급된 이후에는 환불할 수 없으며, 이후 문제는 당사자 간 협의를 원칙으로 WEWE가 조정을 돕습니다.</li>
        </ul>
      </section>

      <section className="si-card">
        <h2>6. 문의</h2>
        <p>
          취소·환불 문의: 전화 {ORG_INFO.phone} · 이메일 <a href={`mailto:${ORG_INFO.email}`}>{ORG_INFO.email}</a> ({ORG_INFO.hours})
        </p>
        <p>
          전체 순서는 <Link to="/how-it-works">이용 흐름</Link>, 회원 간 권리·의무는 <Link to="/terms">이용약관</Link>을 확인해주세요.
        </p>
        <p className="si-note">시행일: {TERMS_EFFECTIVE_DATE}</p>
      </section>

      <style>{`
        .rp-highlight {
          border: 2px solid #d97b3f;
        }
      `}</style>
    </StayInfoLayout>
  );
}

export default RefundPolicy;
