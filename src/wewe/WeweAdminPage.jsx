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
// 관리자(role=admin, status=approved)가 아니면(로그인하지 않은 경우 포함) 접근할 수 없고
// 곧바로 홈으로 돌려보냅니다. 실제 데이터 보호는 Supabase RLS가 담당하고, 이 확인은 화면 노출을 막습니다.
function WeweAdminPage({ mode = 'dashboard' }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [checking, setChecking] = useState(true);

  // (2026-10-09 보안 강화)
  // - 로그인 여부를 브라우저에 저장된 세션만 보고 판단하지 않고, getUser()로 Supabase 서버에 토큰을
  //   검증받은 뒤 그 계정의 role/status를 다시 조회합니다.
  // - 관리자가 아니면(로그인 안 함 포함) 관리자 화면을 한 번도 그리지 않고 곧바로 홈으로 보냅니다.
  // - 로그인 상태가 바뀌거나(로그아웃·다른 계정 로그인·토큰 갱신) 창으로 다시 돌아올 때마다 권한을
  //   다시 확인해, 그 사이 관리자 권한을 잃었으면 즉시 화면을 벗어납니다.
  // 실제 데이터는 Supabase RLS(is_admin(): 승인된 관리자만)로 서버에서 보호됩니다.
  useEffect(() => {
    let mounted = true;

    const kickOut = () => {
      if (!mounted) return;
      setUserProfile(null);
      setChecking(true);
      navigate('/', { replace: true });
    };

    const verify = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (userError || !user) {
        kickOut();
        return;
      }

      const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (!mounted) return;
      if (!data || data.role !== 'admin' || data.status !== 'approved') {
        kickOut();
        return;
      }
      setUserProfile(data);
      setChecking(false);
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        kickOut();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        verify();
      }
    });

    const handleFocus = () => verify();
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  // 권한이 확인되기 전에는 관리자 관련 문구·화면을 전혀 보여주지 않습니다.
  if (checking) {
    return <div style={{ minHeight: '100vh', background: '#1c2f2c' }} aria-busy="true" />;
  }

  return (
    <div className="wewe-admin-page">
      <WeweHeader />
      {mode === 'post-editor' ? (
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
