import React, { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../App';
import WeweHouseView from './house/WeweHouseView';

// /stay/admin/house — 관리자 전용 "WEWE 하우스" 라이브 대시보드 (2026-10-20).
// 라우트 자체가 App.jsx의 관리자 전용 블록 안에 있고(비관리자·비로그인은 접근 불가),
// 데이터도 서버 함수 get_house_activity()가 관리자가 아니면 거부합니다.
// 공개 사이트 어디에도 연결하지 않으며, 검색엔진에 노출되지 않도록 noindex를 붙입니다.
function WeweHouse() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'WEWE 하우스 · 관리자';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  const fetcher = useCallback(() => supabase.rpc('get_house_activity', { p_limit: 20 }), []);

  return (
    <WeweHouseView
      fetcher={fetcher}
      backLink={(
        <Link to="/admin" className="whh-back">
          <ArrowLeft size={16} aria-hidden="true" /> 관리자 대시보드
        </Link>
      )}
    />
  );
}

export default WeweHouse;
