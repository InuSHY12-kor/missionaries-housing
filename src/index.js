import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import WeweSite from './wewe/WeweSite';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// WEWE 홈페이지 개편(2026-09) — 기존 위위스테이 앱 전체를 "/stay" 하위 경로로 이전(Phase 1).
// "/stay"로 시작하는 주소는 그대로 기존 앱(App.jsx, basename="/stay")을 렌더링한다.
//
// 최상위 "/", "/about" 계열(위위란?/사역 소개/대표·이사회, Phase 3), "/news" 계열
// (사역 소식 목록/상세, Phase 4), "/donate"(후원 안내, Phase 5), "/signup"·"/signup/supporter"·
// "/login"(가입 유형 선택·후원자 가입·로그인, Phase 6)은 신규 WEWE 전체 소개 홈페이지
// (WeweSite, 자체 BrowserRouter를 가진 별도의 React 트리)를 렌더링한다.
// 그 외 주소(Phase 1 이전에 발송된 이메일 등에 남아있는 구버전 절대경로 "/verify-email",
// "/complete-profile" 같은 딥링크 포함)는 계속 "/stay"로 리다이렉트해서 기존 기능이
// 깨지지 않도록 한다.
const { pathname, search, hash } = window.location;
const isStayPath = pathname === '/stay' || pathname.startsWith('/stay/');
const isWeweSitePath =
  pathname === '/' ||
  pathname === '' ||
  pathname === '/about' ||
  pathname.startsWith('/about/') ||
  pathname === '/news' ||
  pathname.startsWith('/news/') ||
  pathname === '/donate' ||
  pathname === '/signup' ||
  pathname.startsWith('/signup/') ||
  pathname === '/login';

if (isStayPath) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (isWeweSitePath) {
  root.render(
    <React.StrictMode>
      <WeweSite />
    </React.StrictMode>
  );
} else {
  window.location.replace(`/stay${pathname}${search}${hash}`);
}
