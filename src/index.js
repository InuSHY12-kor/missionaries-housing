import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// WEWE 홈페이지 개편(2026-09) — 기존 위위스테이 앱 전체를 "/stay" 하위 경로로 이전.
// "/stay"로 시작하는 주소는 그대로 기존 앱(App.jsx, basename="/stay")을 렌더링하고,
// 그 외 주소(예: "/", 그리고 아직 만들어지지 않은 "/about" 등)는 임시로 "/stay"로 리다이렉트한다.
// → 신규 WEWE 전체 홈페이지(소개/사역 소식/후원 등)가 만들어지면 이 부분을 그 홈페이지로 교체할 예정.
const { pathname, search, hash } = window.location;
const isStayPath = pathname === '/stay' || pathname.startsWith('/stay/');

if (isStayPath) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  window.location.replace(`/stay${pathname}${search}${hash}`);
}
