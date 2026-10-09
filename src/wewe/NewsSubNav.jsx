import React from 'react';
import { Link } from 'react-router-dom';

// "사역 소식" 메뉴 하위의 두 페이지를 오가는 탭 (2026-10-09) — 소개 메뉴의 AboutSubNav와 같은 모양.
//   사역 소식(/news): 인스타그램 카드뉴스 형식의 소식
//   기도 편지(/news/prayer-letters): 줄글 게시판 형식의 기도 편지
const TABS = [
  { to: '/news', label: '사역 소식' },
  { to: '/news/prayer-letters', label: '기도 편지' },
];

function NewsSubNav({ active }) {
  return (
    <nav className="wp-subnav">
      {TABS.map((tab) => (
        <Link key={tab.to} to={tab.to} className={tab.to === active ? 'active' : ''}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default NewsSubNav;
