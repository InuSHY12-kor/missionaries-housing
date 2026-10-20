import React, { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../App';
import PageHero from '../../components/PageHero';
import WeweHouseView from './house/WeweHouseView';

// /stay/admin/house — 관리자 전용 "WEWE 하우스" 라이브 대시보드 (2026-10-20).
// 라우트 자체가 App.jsx의 관리자 전용 블록 안에 있고(비관리자·비로그인은 접근 불가),
// 데이터도 서버 함수 get_house_activity()가 관리자가 아니면 거부합니다.
// 공개 사이트 어디에도 연결하지 않으며, 검색엔진에 노출되지 않도록 noindex를 붙입니다.

// 상단 배너: 오피스 사진 1장(슬라이드쇼 없음, 2026-10-21) — 큰 창과 콘크리트 바닥의 밝은 사무실
const HOUSE_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80',
];

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
      hero={(
        <PageHero
          images={HOUSE_HERO_IMAGES}
          eyebrow="ADMIN · LIVE"
          title="WEWE 하우스"
          subtitle="WEWE의 사람들과 사역이 함께 일하는 실시간 사무실입니다"
        />
      )}
      backLink={(
        <Link to="/admin" className="btn btn-secondary whh-btn-std">
          <ArrowLeft size={16} aria-hidden="true" /> 관리자 대시보드
        </Link>
      )}
    />
  );
}

export default WeweHouse;
