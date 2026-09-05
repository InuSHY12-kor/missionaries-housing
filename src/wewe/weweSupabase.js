import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// WEWE 전체 홈페이지(로그인이 필요 없는 공개 페이지: /, /about*, /news*)에서만 쓰는
// 별도의 Supabase 클라이언트입니다. src/App.jsx가 export하는 supabase 클라이언트
// (로그인 세션을 localStorage에 유지)를 그대로 가져다 쓰지 않는 이유는:
//  1) 이 사이트는 로그인이 필요 없어서 세션을 저장/복원할 이유가 없고,
//  2) 같은 브라우저에서 같은 스토리지 키를 쓰는 Auth 클라이언트를 두 개 만들면
//     "Multiple GoTrueClient instances detected" 경고와 세션 충돌 위험이 있기 때문입니다.
// 사역 소식(ministry_posts)의 "발행된 글"은 RLS에서 누구나(비로그인 포함) 읽을 수 있도록
// 허용되어 있으므로, 이 클라이언트는 세션 저장 없이 anon key로만 조회합니다.
export const weweSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});
