import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Accommodations from './pages/Accommodations';
import AccommodationDetail from './pages/AccommodationDetail';
import HostAccommodations from './pages/HostAccommodations';
import Profile from './pages/Profile';
import './App.css';

// Supabase 초기화
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('프로필 로드 오류:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Navigation user={user} userProfile={userProfile} onLogout={handleLogout} />
        
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />

          {/* 로그인 필요 */}
          {user ? (
            <>
              {/* 승인 대기 중 */}
              {userProfile?.status === 'pending' && (
                <Route path="*" element={<PendingApproval userProfile={userProfile} />} />
              )}

              {/* 거절됨 */}
              {userProfile?.status === 'rejected' && (
                <Route path="*" element={
                  <div className="container">
                    <div className="error-box">
                      <h2>계정이 거절되었습니다</h2>
                      <p>{userProfile.rejection_reason}</p>
                      <button onClick={handleLogout}>로그아웃</button>
                    </div>
                  </div>
                } />
              )}

              {/* 승인됨 */}
              {userProfile?.status === 'approved' && (
                <>
                  {/* 관리자 */}
                  {userProfile.role === 'admin' && (
                    <Route path="/admin/*" element={<AdminDashboard />} />
                  )}

                  {/* 일반 사용자 */}
                  <Route path="/dashboard" element={<Dashboard userProfile={userProfile} />} />
                  <Route path="/accommodations" element={<Accommodations />} />
                  <Route path="/accommodations/:id" element={<AccommodationDetail />} />
                  <Route path="/my-accommodations" element={<HostAccommodations userProfile={userProfile} />} />
                  <Route path="/profile" element={<Profile userProfile={userProfile} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
