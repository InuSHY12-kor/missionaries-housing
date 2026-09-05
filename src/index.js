import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import WeweHome from './wewe/WeweHome';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// WEWE 홈페이지 개편(2026-09) — 기존 위위스테이 앱 전체를 "/stay" 하위 경로로 이전(Phase 1).
// "/stay"로 시작하는 주소는 그대로 기존 앱(App.jsx, basename="/stay")을 렌더링한다.
//
// 최상위 "/"는 이제(Phase 2) 신규 WEWE 전체 소개 홈페이지(WeweHome)를 렌더링한다.
// 그 외 주소(예: 아직 만들어지지 않은 "/about", "/blog" 등 — Phase 3/4에서 실제 페이지로
// 구현될 예정. 그리고 Phase 1 이전에 발송된 이메일 등에 남아있는 구버전 절대경로
// "/verify-email", "/complete-profile" 같은 딥링크)는 계속 "/stay"로 리다이렉트해서
// 기존 기능이 깨지지 않도록 한다.
const { pathname, search, hash } = window.location;
const isStayPath = pathname === '/stay' || pathname.startsWith('/stay/');
const isWeweHomePath = pathname === '/' || pathname === '';

if (isStayPath) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (isWeweHomePath) {
  root.render(
    <React.StrictMode>
      <WeweHome />
    </React.StrictMode>
  );
} else {
  window.location.replace(`/stay${pathname}${search}${hash}`);
}
