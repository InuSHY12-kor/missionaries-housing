import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import AdminDashboard from '../pages/AdminDashboard';
import AdminPostEditor from '../pages/AdminPostEditor';
import './wewe-shared.css';

// WEWE 쪽 관리자 페이지 (/admin, /admin/posts/new, /admin/posts/:id/edit) — 2026-10-07 추가.
//
// 상단 메뉴만 WEWE 헤더(WeweHeader)를 쓰고, 그 아래 내용은 위위스테이 관리자 페이지
// (/stay/admin, src/pages/AdminDashboard.jsx · AdminPostEditor.jsx)와 "같은 컴포넌트"를
// 그대로 렌더링합니다. 두 사이트가 같은 Supabase 데이터를 읽고 쓰므로, 어느 쪽에서
// 승인·삭제·글 작성 등을 해도 다른 쪽에 바로 똑같이 보입니다.
// site="wewe"를 넘기면 AdminDashboard가 히어로 배너를 WEWE 스타일로 바꾸고, 위위스테이
// 전용 화면(숙소 상세 등)으로 가는 링크는 /stay/... 전체 페이지 이동으로 연결합니다.
//
// 관리자(role=admin, status=approved)가 아니면 접근할 수 없습니다 — 로그인하지 않았으면
// /login, 관리자가 아니면 홈으로 돌려보냅니다. (실제 데이터 보호는 Supabase RLS가 담당하고,
// 이 확인은 화면 노출만 막습니다.)
function WeweAdminPage({ mode = 'dashboard' }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        if (mounted) navigate('/login', { replace: true });
        return;
      }

      const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (!mounted) return;
      if (!data || data.role !== 'admin' || data.status !== 'approved') {
        navigate('/', { replace: true });
        return;
      }
      setUserProfile(data);
      setChecking(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="wewe-admin-page">
      <WeweHeader />
      {checking ? (
        <div className="wewe-admin-checking">
          <div className="spinner"></div>
          <p>관리자 권한을 확인하는 중...</p>
        </div>
      ) : mode === 'post-editor' ? (
        <AdminPostEditor userProfile={userProfile} site="wewe" />
      ) : (
        <AdminDashboard userProfile={userProfile} site="wewe" />
      )}
      <WeweFooter />

      <style>{`
        .wewe-admin-page {
          background: #f7f6f2;
          min-height: 100vh;
        }

        .wewe-admin-checking {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding-top: 120px;
          color: #6b665c;
          background: #1c2f2c;
        }

        .wewe-admin-checking p {
          color: rgba(255, 255, 255, 0.8);
        }

        /* 관리자 콘텐츠(App.css 기반)와 WEWE 푸터 사이 간격 */
        .wewe-admin-page .admin-dashboard,
        .wewe-admin-page .admin-post-editor-container {
          padding-bottom: 3rem;
        }
      `}</style>
    </div>
  );
}

export default WeweAdminPage;
