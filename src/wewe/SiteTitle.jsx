import { useEffect } from 'react';

// public/index.html의 기본 <title>은 "WEWE STAY"입니다(위위 스테이 쪽 요청 유지).
// 위위 전체 홈페이지(WeweSite) 트리가 마운트되어 있는 동안에는 브라우저 탭 제목을
// "WEWE (위로자의 위로자)"로 바꿔주고, 이 트리를 벗어나면(예: "위위 스테이" 링크를 눌러
// 완전히 다른 페이지로 이동) 원래 제목으로 되돌립니다(2026-09-10 추가).
function SiteTitle({ title }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);

  return null;
}

export default SiteTitle;
