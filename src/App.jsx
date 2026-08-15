import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle, X } from 'lucide-react';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignupRoleSelect from './pages/SignupRoleSelect';
import SignupComplete from './pages/SignupComplete';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Accommodations from './pages/Accommodations';
import AccommodationDetail from './pages/AccommodationDetail';
import HostAccommodations from './pages/HostAccommodations';
import MyBookings from './pages/MyBookings';
import HostBookings from './pages/HostBookings';
import Profile from './pages/Profile';
import './App.css';

// Supabase 초기화
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // sessionStorage를 사용하면 브라우저(모든 탭)를 완전히 종료하거나 컴퓨터를 재부팅했을 때
    // 로그인 세션이 유지되지 않고 자동으로 로그아웃됩니다(탭 새로고침에는 영향 없음).
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 활동이 없을 때 자동 로그아웃까지 대기하는 시간 (2시간)
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
// 활동 감지에 사용할 이벤트 목록
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'];

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [autoLogoutMessage, setAutoLogoutMessage] = useState(null);
  const lastActivityRef = useRef(Date.now());

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
          setAutoLogoutMessage(null);
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
  };

  // 로그인된 사용자의 활동을 감지해 일정 시간(2시간) 이상 활동이 없으면 자동 로그아웃
  // 의존성을 user 객체가 아닌 boolean(로그인 여부)으로 둬서, 토큰 자동 갱신 등으로
  // user 객체 참조만 바뀌는 경우에는 타이머가 리셋되지 않도록 함.
  const isLoggedIn = !!user;
  useEffect(() => {
    if (!isLoggedIn) return;

    lastActivityRef.current = Date.now();
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const checkIdle = async () => {
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        setAutoLogoutMessage('장시간 활동이 없어 자동으로 로그아웃되었습니다. 다시 로그인해주세요.');
      }
    };

    // 1분마다 유휴 시간을 확인하고, 탭이 다시 보일 때(예: 절전 모드 복귀)도 즉시 확인
    const intervalId = setInterval(checkIdle, 60 * 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkIdle();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, updateActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [isLoggedIn]);

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
    } else if (userProfile.status === 'approved') {
      authenticatedRoutes = (
        <>
          {/* 관리자 */}
          {userProfile.role === 'admin' && (
            <Route path="/admin/*" element={<AdminDashboard />} />
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
          <Route
            path="/my-accommodations"
            element={canManageAccommodations ? <HostAccommodations userProfile={userProfile} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/host-bookings"
            element={canManageAccommodations ? <HostBookings userProfile={userProfile} /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/profile" element={<Profile userProfile={userProfile} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      );
    }
  }

  return (
    <BrowserRouter>
      <div className="App">
        {autoLogoutMessage && (
          <div className="auto-logout-banner">
            <AlertCircle size={18} />
            <span>{autoLogoutMessage}</span>
            <button
              type="button"
              className="auto-logout-banner-close"
              onClick={() => setAutoLogoutMessage(null)}
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <Navigation user={user} userProfile={userProfile} onLogout={handleLogout} />

        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupRoleSelect />} />
          <Route path="/signup/missionary" element={<SignUp role="missionary" />} />
          <Route path="/signup/host" element={<SignUp role="host" />} />
          {/* 프로필 등록 직후 안내 화면: 승인 대기 중인 사용자의 catch-all("*") 라우트보다
              더 구체적인 경로이므로 항상 우선적으로 매칭됩니다. */}
          <Route path="/signup-complete" element={<SignupComplete />} />
          <Route path="/login" element={<Login />} />

          {/* 로그인 필요 */}
          {user ? authenticatedRoutes : <Route path="*" element={<Navigate to="/" replace />} />}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
