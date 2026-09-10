import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle, X } from 'lucide-react';
import { useIdleAutoLogout } from './utils/useIdleAutoLogout';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignupRoleSelect from './pages/SignupRoleSelect';
import SignupComplete from './pages/SignupComplete';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompleteProfile from './pages/CompleteProfile';
import PendingApproval from './pages/PendingApproval';
import AccountStatus from './pages/AccountStatus';
import SupporterHome from './pages/SupporterHome';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPostEditor from './pages/AdminPostEditor';
import Accommodations from './pages/Accommodations';
import AccommodationDetail from './pages/AccommodationDetail';
import HostAccommodations from './pages/HostAccommodations';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import BookingCheckout from './pages/BookingCheckout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';
import HostBookings from './pages/HostBookings';
import Reviews from './pages/Reviews';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import './App.css';

// Supabase 초기화
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // localStorage를 사용해 여러 탭에서 로그인 상태가 공유되도록 함(탭마다 다시 로그인할 필요 없음).
    // 대신 세션 만료는 아래의 유휴 시간(활동 없음) 자동 로그아웃 로직으로 처리함.
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  // 유휴(활동 없음) 자동 로그아웃 규칙은 위위 스테이·위위 홈페이지가 공유하는
  // src/utils/useIdleAutoLogout.js 훅으로 옮겼습니다 — 어느 사이트를 보고 있어도 동일한
  // 2시간 규칙과 마지막 활동 시각(localStorage)을 함께 씁니다.
  const { autoLogoutMessage, dismissAutoLogoutMessage } = useIdleAutoLogout(!!user);

  useEffect(() => {
    const initAuth = async () => {
      await checkUser();
    };
    initAuth();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('사용자 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    setProfileLoading(true);
    try {
      // maybeSingle() 사용: 프로필이 아직 없는(이메일 인증만 마친) 신규 사용자의 경우
      // 에러 없이 data: null 을 반환하도록 하여 "프로필 등록 필요" 상태를 구분할 수 있게 함.
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    // 다음에 로그인할 때 이번 세션의 마지막 활동 시각이 남아있다가 잘못 이어받는 것을
    // 막기 위해 공유 저장된 마지막 활동 시각도 함께 지웁니다.
    try {
      window.localStorage.removeItem('wewe_last_activity_at');
    } catch (e) {
      // localStorage 접근 불가(프라이빗 모드 등) 시에도 로그아웃 자체는 계속 진행
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  // 숙소 검색: 관리자 + 선교사(숙소 이용자)만 이용 가능
  const canSearchAccommodations = userProfile && (userProfile.role === 'admin' || userProfile.role === 'missionary');
  // 숙소 등록/관리: 관리자 + 숙소 제공자만 이용 가능
  const canManageAccommodations = userProfile && (userProfile.role === 'admin' || userProfile.role === 'host');

  // (Phase 6, 2026-09-07 수정) 후원자는 /stay 안에서 어떤 URL로 들어와도 항상 소개 전용
  // 화면(SupporterHome)만 보게 하기로 한 결정입니다(결정 사항 #6). 그런데 이 화면은 원래
  // authenticatedRoutes의 "*" 라우트로만 등록돼 있었고, 아래 <Routes>에는 "/", "/signup",
  // "/login" 같은 공개 페이지 라우트도 항상 함께 등록돼 있습니다 — react-router v6은 이런
  // 구체적인 경로를 "*"보다 항상 먼저 매칭하므로, 후원자가 정확히 "/stay"(빈 경로)나
  // "/stay/login" 등으로 들어오면 의도와 다르게 공개 랜딩/로그인 페이지가 그대로 보이는
  // 문제가 있었습니다. 그래서 후원자인 경우에는 아래에서 공개 페이지 라우트 자체를 건너뛰고
  // SupporterHome 하나만 등록해 이 문제를 근본적으로 막습니다.
  const isSupporterHome = !!(
    userProfile
    && userProfile.status === 'approved'
    && userProfile.email_verified_at
    && userProfile.role === 'supporter'
  );

  // 로그인 상태에서 렌더링할 경로들을 상태에 따라 하나로 결정 (동시에 여러 "*" 라우트가
  // 매칭되는 것을 방지하기 위해 우선순위대로 분기)
  let authenticatedRoutes = null;

  if (user) {
    if (profileLoading) {
      authenticatedRoutes = (
        <Route
          path="*"
          element={
            <div className="loading-container">
              <div className="spinner"></div>
              <p>확인 중...</p>
            </div>
          }
        />
      );
    } else if (!userProfile) {
      // 세션은 있지만(이메일 인증 완료) 아직 프로필(회원 정보)을 등록하지 않은 사용자
      authenticatedRoutes = <Route path="*" element={<CompleteProfile />} />;
    } else if (userProfile.status === 'pending') {
      // 이메일 인증과 관리자 승인이 모두 필요 — 둘 중 하나라도 안 됐으면 대기 화면 노출
      authenticatedRoutes = <Route path="*" element={<PendingApproval userProfile={userProfile} />} />;
    } else if (userProfile.status === 'approved' && !userProfile.email_verified_at) {
      // 관리자 승인은 완료됐지만 이메일 인증이 아직 안 된 경우 — 마찬가지로 대기 화면(다른 안내 문구) 노출
      authenticatedRoutes = <Route path="*" element={<PendingApproval userProfile={userProfile} />} />;
    } else if (userProfile.status === 'rejected') {
      authenticatedRoutes = (
        <Route
          path="*"
          element={
            <div className="container">
              <div className="error-box">
                <h2>계정이 거절되었습니다</h2>
                <p>{userProfile.rejection_reason}</p>
                <button onClick={handleLogout}>로그아웃</button>
              </div>
            </div>
          }
        />
      );
    } else if (userProfile.status === 'withdrawn' || userProfile.status === 'deletion_pending') {
      // withdrawn: 탈퇴 처리 완료(5년 보관 후 자동 삭제) / deletion_pending: 관리자가 사유를
      // 입력해 삭제 처리 — 본인이 사유를 확인해야 계정이 완전히 삭제됨
      authenticatedRoutes = <Route path="*" element={<AccountStatus userProfile={userProfile} onLogout={handleLogout} />} />;
    } else if (userProfile.status === 'approved' && userProfile.email_verified_at && userProfile.role === 'supporter') {
      // (Phase 6) 후원자는 서류 심사·관리자 승인 없이 즉시 승인되는 대신, /stay 안에서는
      // 어떤 경로로 들어오든 소개 전용 안내 화면만 보여줍니다(숙소 검색/예약, 관리 기능 등
      // 선교사·호스트·관리자 전용 기능에는 접근할 수 없음) — 사용자가 명시적으로 선택한 범위입니다.
      authenticatedRoutes = <Route path="*" element={<SupporterHome userProfile={userProfile} onLogout={handleLogout} />} />;
    } else if (userProfile.status === 'approved' && userProfile.email_verified_at) {
      authenticatedRoutes = (
        <>
          {/* 관리자 */}
          {userProfile.role === 'admin' && (
            <>
              {/* 사역 소식 글 작성/수정 화면. react-router v6은 경로 구체성으로 매칭
                  순위를 정하므로("/admin/*" 같은 와일드카드는 항상 우선순위가 가장 낮음),
                  아래처럼 "/admin/*" 바로 위/아래 어디에 두어도 이 두 경로가 먼저 매칭됩니다. */}
              <Route path="/admin/posts/new" element={<AdminPostEditor userProfile={userProfile} />} />
              <Route path="/admin/posts/:id/edit" element={<AdminPostEditor userProfile={userProfile} />} />
              <Route path="/admin/*" element={<AdminDashboard userProfile={userProfile} />} />
            </>
          )}

          {/* 일반 사용자 */}
          <Route path="/dashboard" element={<Dashboard userProfile={userProfile} />} />
          <Route
            path="/accommodations"
            element={canSearchAccommodations ? <Accommodations /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/accommodations/:id"
            element={
              (canSearchAccommodations || canManageAccommodations)
                ? <AccommodationDetail userProfile={userProfile} />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route path="/my-bookings" element={<MyBookings userProfile={userProfile} />} />
          <Route path="/my-bookings/:id" element={<BookingDetail userProfile={userProfile} />} />
          <Route path="/my-bookings/:id/pay" element={<BookingCheckout userProfile={userProfile} />} />
          <Route path="/payment/success" element={<PaymentSuccess userProfile={userProfile} />} />
          <Route path="/payment/fail" element={<PaymentFail userProfile={userProfile} />} />
          <Route
            path="/my-accommodations"
            element={canManageAccommodations ? <HostAccommodations userProfile={userProfile} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/host-bookings"
            element={canManageAccommodations ? <HostBookings userProfile={userProfile} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reviews"
            element={canManageAccommodations ? <Reviews userProfile={userProfile} /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/messages" element={<Messages userProfile={userProfile} />} />
          <Route path="/profile" element={<Profile userProfile={userProfile} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      );
    }
  }

  return (
    <BrowserRouter basename="/stay">
      <div className="App">
        {autoLogoutMessage && (
          <div className="auto-logout-banner">
            <AlertCircle size={18} />
            <span>{autoLogoutMessage}</span>
            <button
              type="button"
              className="auto-logout-banner-close"
              onClick={dismissAutoLogoutMessage}
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <Navigation user={user} userProfile={userProfile} onLogout={handleLogout} />

        <Routes>
          {isSupporterHome ? (
            // 후원자는 공개 페이지 라우트와 경로 경쟁이 없는 완전히 별도의 <Routes>로
            // 렌더링해서, 어떤 URL로 들어오든(정확히 "/stay"인 경우 포함) 항상
            // SupporterHome만 보이도록 합니다.
            authenticatedRoutes
          ) : (
            <>
              {/* 공개 페이지 */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupRoleSelect />} />
              <Route path="/signup/missionary" element={<SignUp role="missionary" />} />
              <Route path="/signup/host" element={<SignUp role="host" />} />
              {/* 프로필 등록 직후 안내 화면: 승인 대기 중인 사용자의 catch-all("*") 라우트보다
                  더 구체적인 경로이므로 항상 우선적으로 매칭됩니다. */}
              <Route path="/signup-complete" element={<SignupComplete />} />
              {/* 이메일 인증 링크 도착 페이지: 로그인 여부와 무관하게 항상 접근 가능해야 함 */}
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              {/* 비밀번호 찾기 링크는 이메일로 전달되어 언제든(로그인 여부와 무관하게)
                  들어올 수 있어야 하므로 로그인 필요 라우트보다 앞서 공개 경로로 둡니다. */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* 로그인 필요 */}
              {user ? authenticatedRoutes : <Route path="*" element={<Navigate to="/" replace />} />}
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
