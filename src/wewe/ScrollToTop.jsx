import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// (2026-09-09 추가) WeweSite 라우터 전용 — 페이지 이동 시 브라우저가 이전 스크롤
// 위치를 그대로 이어받는 SPA 특유의 문제를 막습니다. 예: "위위란?" 페이지 맨 아래
// CTA 버튼에서 "/about/ministries"로 이동했는데, 직전 페이지에서 스크롤을 많이
// 내려놓은 상태였다면 새 페이지도 그 위치(중간)로 열려버립니다. 경로(pathname)가
// 바뀔 때마다 맨 위로 되돌려 모든 페이지 이동에 공통으로 적용합니다.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
