import React from 'react';
import { Instagram } from 'lucide-react';
import weweLogoFull from '../assets/wewe-logo-new.png';
import { ORG_INFO } from '../data/orgInfo';

// 카카오톡 채널 로고(노란 원 + 말풍선) — 외부 이미지 없이 그립니다.
function KakaoLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#FEE500" />
      <path d="M12 6.2c-3.6 0-6.5 2.3-6.5 5.1 0 1.8 1.2 3.4 3 4.3l-.6 2.3c-.1.3.3.5.5.3l2.7-1.8c.3 0 .6.1.9.1 3.6 0 6.5-2.3 6.5-5.2S15.6 6.2 12 6.2z" fill="#3A1D1D" />
    </svg>
  );
}

// WEWE 전체 홈페이지(홈/소개/사역 소개/대표·이사회)에서 공통으로 쓰는 푸터.
// 사업자 정보가 바뀔 때 한 곳만 고치면 되도록 컴포넌트로 분리했습니다.
function WeweFooter() {
  return (
    <footer className="wh-footer">
      <div className="wh-container wh-footer-inner">
        <div className="wh-footer-brand">
          <img src={weweLogoFull} alt="WEWE" className="wh-footer-logo" />
          <p>위로자의 위로자 — 목회자와 선교사, 그들의 위로자가 되는 비영리단체</p>
          <a
            href="https://www.instagram.com/wewe_team/"
            target="_blank"
            rel="noopener noreferrer"
            className="wh-footer-instagram"
            aria-label="WEWE 인스타그램"
          >
            <Instagram size={16} />
            <span>@wewe_team</span>
          </a>
          {/* (2026-10-10) 카카오톡 채널 */}
          <a
            href={ORG_INFO.kakaoChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="wh-footer-instagram wh-footer-kakao"
            aria-label="WEWE 카카오톡 채널"
          >
            <KakaoLogo size={16} />
            <span>카카오톡 채널</span>
          </a>
        </div>

        <div className="wh-footer-info">
          <p>법인으로 보는 단체 WEWE (위로자의 위로자)</p>
          <p>대표 홍현지</p>
          <p>사업자(고유번호) 501-82-75164</p>
          <p>주소 서울특별시 종로구 대학로12길 61, 5층 501-176A호(동승동, 계우빌딩)</p>
          <p>전화 010-8339-7740 · 이메일 wewe@wewestay.com</p>
        </div>

        <div className="wh-footer-copy">
          <p>&copy; {new Date().getFullYear()} WEWE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default WeweFooter;
