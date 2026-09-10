import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { supabase } from '../App';
import { useIdleAutoLogout } from '../utils/useIdleAutoLogout';
import WeweHome from './WeweHome';
import AboutPage from './AboutPage';
import MinistriesPage from './MinistriesPage';
import LeadershipPage from './LeadershipPage';
import NewsListPage from './NewsListPage';
import NewsDetailPage from './NewsDetailPage';
import DonatePage from './DonatePage';
import SignupPage from './SignupPage';
import SupporterSignup from './SupporterSignup';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import MyPage from './MyPage';
import WeweProfilePage from './WeweProfilePage';
import ScrollToTop from './ScrollToTop';
import SiteTitle from './SiteTitle';

// WEWE 전체 홈페이지의 최상위 라우터 (Phase 3, Phase 4에서 /news* 추가, Phase 5에서 /donate 추가,
// Phase 6에서 /signup, /signup/supporter, /login 추가).
// 기존 위위스테이 앱(App.jsx, basename="/stay")과는 완전히 별개의 React 트리이자
// 별개의 BrowserRouter입니다 — index.js의 dispatcher가 pathname을 보고 둘 중 하나만
// 마운트합니다.
//
// "/", "/about" 계열(위위란?/사역 소개/대표·이사회), "/news" 계열(사역 소식 목록/상세),
// "/donate"(후원 안내), "/signup"·"/signup/supporter"(가입 유형 선택·후원자 가입),
// "/login"(로그인)만 실제 페이지이고, 그 외 경로는 아직 없는 페이지이므로 홈으로
// 되돌립니다(예: 오타, 만들어지지 않은 하위 경로, 삭제된 글의 옛 슬러그). "/stay"로
// 시작하는 경로는 index.js가 이 컴포넌트를 마운트하기 전에 이미 걸러내므로 여기서는
// 신경 쓰지 않아도 됩니다. 선교사·호스트 가입(서류 제출 + 관리자 승인)은 이미 검증된
// /stay 쪽 흐름을 그대로 재사용하므로 이 라우터에는 별도 경로가 없습니다(SignupPage 참고).
function WeweSite() {
  // 위위 스테이(App.jsx)와 동일한 규칙(유휴 2시간 자동 로그아웃 + 같은 브라우저 내 로그인
  // 상태 유지)을 위위 홈페이지에서도 지키기 위해, 여기서도 로그인 여부를 직접 추적하고
  // src/utils/useIdleAutoLogout.js 훅을 사용합니다(2026-09-10 추가).
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsLoggedIn(!!data?.session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsLoggedIn(!!session?.user);
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const { autoLogoutMessage, dismissAutoLogoutMessage } = useIdleAutoLogout(isLoggedIn);

  return (
    <BrowserRouter>
      <SiteTitle title="WEWE (위로자의 위로자)" />
      <ScrollToTop />
      {autoLogoutMessage && (
        <div className="wewe-auto-logout-banner">
          <AlertCircle size={18} />
          <span>{autoLogoutMessage}</span>
          <button
            type="button"
            className="wewe-auto-logout-banner-close"
            onClick={dismissAutoLogoutMessage}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<WeweHome />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about/ministries" element={<MinistriesPage />} />
        <Route path="/about/leadership" element={<LeadershipPage />} />
        <Route path="/news" element={<NewsListPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/supporter" element={<SupporterSignup />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/profile" element={<WeweProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <style>{`
        .wewe-auto-logout-banner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #fdf3e3;
          color: #8a5a12;
          border-bottom: 1px solid #f0dcb0;
          padding: 0.75rem 1.25rem;
          font-size: 0.95rem;
          position: sticky;
          top: 0;
          z-index: 300;
        }

        .wewe-auto-logout-banner span {
          flex: 1;
        }

        .wewe-auto-logout-banner-close {
          background: none;
          border: none;
          color: #8a5a12;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.25rem;
        }

        .wewe-auto-logout-banner-close:hover {
          opacity: 0.7;
        }
      `}</style>
    </BrowserRouter>
  );
}

export default WeweSite;
