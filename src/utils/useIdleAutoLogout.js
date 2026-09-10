import { useEffect, useRef, useState } from 'react';
import { supabase } from '../App';

// 위위 스테이(App.jsx)와 위위 전체 홈페이지(WeweSite.jsx)는 서로 다른 React 트리이지만,
// 같은 supabase 클라이언트(App.jsx가 export하는 것)와 같은 브라우저 localStorage를 쓰기
// 때문에 "로그인 상태"는 원래도 두 사이트에서 함께 유지됩니다. 이 훅은 거기서 한 걸음 더 나가
// "일정 시간(활동 없음) 자동 로그아웃" 규칙까지 두 트리가 동일하게 지키도록 만든 공용 로직
// 입니다(2026-09-10, WEWE 쪽에도 위위 스테이와 동일한 세션 규칙을 적용해달라는 요청).
//
// 이전에는 이 로직이 App.jsx 안에만 있어서, 위위 스테이(/stay) 화면을 보고 있을 때만 유휴
// 타이머가 동작했습니다 — 위위 홈페이지(/about, /news 등)만 계속 보고 있으면 2시간이 지나도
// 로그아웃되지 않는 문제가 있었습니다. 이제 두 트리 모두 이 훅을 사용해 동일한
// IDLE_TIMEOUT_MS·활동 이벤트 목록·localStorage 키(LAST_ACTIVITY_STORAGE_KEY)를 공유하므로,
// 어느 사이트를 보고 있든 마지막 활동 시각이 함께 갱신되고 함께 만료됩니다.
export const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2시간
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'];
const LAST_ACTIVITY_STORAGE_KEY = 'wewe_last_activity_at';

/**
 * @param {boolean} isLoggedIn 현재 로그인 상태 여부
 * @returns {{ autoLogoutMessage: string|null, dismissAutoLogoutMessage: () => void }}
 */
export function useIdleAutoLogout(isLoggedIn) {
  const [autoLogoutMessage, setAutoLogoutMessage] = useState(null);
  const lastActivityRef = useRef(Date.now());
  const justSignedInRef = useRef(false);

  // 이 훅을 사용하는 트리(위위 스테이든 위위 홈페이지든)에서 로그인이 막 일어난 순간을
  // 감지하기 위한 자체 리스너입니다. App.jsx도 자신만의 onAuthStateChange 리스너로
  // user/프로필 상태를 관리하지만, 여기서는 오직 "방금 로그인했는지"만 신경 씁니다.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        justSignedInRef.current = true;
        setAutoLogoutMessage(null);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const readSharedLastActivity = () => {
      const stored = Number(window.localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY));
      return Number.isFinite(stored) && stored > 0 ? stored : null;
    };

    const writeSharedLastActivity = (timestamp) => {
      try {
        window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(timestamp));
      } catch (e) {
        // localStorage 접근 불가(프라이빗 모드 등) 시에도 현재 탭 내 동작은 계속되도록 무시
      }
    };

    if (justSignedInRef.current) {
      lastActivityRef.current = Date.now();
      writeSharedLastActivity(lastActivityRef.current);
      justSignedInRef.current = false;
    } else {
      const shared = readSharedLastActivity();
      if (shared) {
        lastActivityRef.current = shared;
      }
    }

    const updateActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      writeSharedLastActivity(now);
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const getLastActivity = () => {
      const shared = readSharedLastActivity();
      return shared && shared > lastActivityRef.current ? shared : lastActivityRef.current;
    };

    const checkIdle = async () => {
      if (Date.now() - getLastActivity() >= IDLE_TIMEOUT_MS) {
        await supabase.auth.signOut();
        setAutoLogoutMessage('장시간 활동이 없어 자동으로 로그아웃되었습니다. 다시 로그인해주세요.');
      }
    };

    checkIdle();

    const intervalId = setInterval(checkIdle, 60 * 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkIdle();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleStorageChange = (e) => {
      if (e.key === LAST_ACTIVITY_STORAGE_KEY && e.newValue) {
        const value = Number(e.newValue);
        if (Number.isFinite(value) && value > lastActivityRef.current) {
          lastActivityRef.current = value;
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, updateActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  return {
    autoLogoutMessage,
    dismissAutoLogoutMessage: () => setAutoLogoutMessage(null),
  };
}

export default useIdleAutoLogout;
