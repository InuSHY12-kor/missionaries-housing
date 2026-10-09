import { useEffect, useState } from 'react';
import { supabase } from '../App';

// WEWE 페이지 안의 "관리자 전용 수정 버튼"용 권한 확인 훅 (2026-10-09).
// - 브라우저에 저장된 세션만 믿지 않고 getUser()로 Supabase 서버에 토큰을 검증받은 뒤,
//   그 계정이 승인된 관리자(role=admin, status=approved)인지 다시 조회합니다.
// - 로그인 상태가 바뀌거나(로그아웃·다른 계정 로그인·토큰 갱신) 창으로 다시 돌아올 때마다 다시
//   확인하므로, 관리자 권한을 잃으면 isAdmin이 곧바로 false가 됩니다.
// 실제 저장 권한은 Supabase RLS(is_admin())가 서버에서 막습니다 — 이 훅은 화면 노출만 담당합니다.
//
// 반환값: { isAdmin, userId, checked } — checked는 첫 확인이 끝났는지 여부.
export function useWeweAdmin() {
  const [state, setState] = useState({ isAdmin: false, userId: null, checked: false });

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      const user = userData?.user;
      if (error || !user) {
        if (mounted) setState({ isAdmin: false, userId: null, checked: true });
        return;
      }
      const { data: profile } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle();
      if (!mounted) return;
      setState({
        isAdmin: profile?.role === 'admin' && profile?.status === 'approved',
        userId: user.id,
        checked: true,
      });
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) setState({ isAdmin: false, userId: null, checked: true });
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
  }, []);

  return state;
}

export default useWeweAdmin;
