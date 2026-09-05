import React from 'react';
import weweLogoFull from '../assets/wewe-logo-full.png';

// WEWE 전체 홈페이지(홈/소개/사역 소개/대표·이사회)에서 공통으로 쓰는 푸터.
// 사업자 정보가 바뀔 때 한 곳만 고치면 되도록 컴포넌트로 분리했습니다.
function WeweFooter() {
  return (
    <footer className="wh-footer">
      <div className="wh-container wh-footer-inner">
        <div className="wh-footer-brand">
          <img src={weweLogoFull} alt="WEWE" className="wh-footer-logo" />
          <p>위로자의 위로자 — 목회자와 선교사, 그들의 위로자가 되는 비영리단체</p>
        </div>

        <div className="wh-footer-info">
          <p>비영리단체 WEWE (위로자의 위로자) · 대표 홍현지</p>
          <p>사업자(고유번호) 501-82-75164</p>
          <p>주소 서울특별시 종로구 대학로12길 61, 5층 501-176A호(동승동, 계우빌딩)</p>
          <p>전화 [연락처 입력 필요] · 이메일 wewe@wewestay.com</p>
        </div>

        <div className="wh-footer-copy">
          <p>&copy; {new Date().getFullYear()} WEWE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default WeweFooter;
