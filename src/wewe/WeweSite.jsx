import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WeweHome from './WeweHome';
import AboutPage from './AboutPage';
import MinistriesPage from './MinistriesPage';
import LeadershipPage from './LeadershipPage';
import NewsListPage from './NewsListPage';
import NewsDetailPage from './NewsDetailPage';
import DonatePage from './DonatePage';

// WEWE 전체 홈페이지의 최상위 라우터 (Phase 3, Phase 4에서 /news* 추가, Phase 5에서 /donate 추가).
// 기존 위위스테이 앱(App.jsx, basename="/stay")과는 완전히 별개의 React 트리이자
// 별개의 BrowserRouter입니다 — index.js의 dispatcher가 pathname을 보고 둘 중 하나만
// 마운트합니다.
//
// "/", "/about" 계열(위위란?/사역 소개/대표·이사회), "/news" 계열(사역 소식 목록/상세),
// "/donate"(후원 안내)만 실제 페이지이고, 그 외 경로는 아직 없는 페이지이므로 홈으로
// 되돌립니다(예: 오타,
// 만들어지지 않은 하위 경로, 삭제된 글의 옛 슬러그). "/stay"로 시작하는 경로는 index.js가
// 이 컴포넌트를 마운트하기 전에 이미 걸러내므로 여기서는 신경 쓰지 않아도 됩니다.
function WeweSite() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WeweHome />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about/ministries" element={<MinistriesPage />} />
        <Route path="/about/leadership" element={<LeadershipPage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default WeweSite;
