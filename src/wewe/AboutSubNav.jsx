import React from 'react';
import { Link } from 'react-router-dom';

// "소개" 메뉴 하위의 네 페이지(위위란? / 사역 소개 / 대표·이사회 / 운영·지속가능성)를
// 오가는 탭. 최종적으로는 헤더의 "소개" 메뉴가 드롭다운으로 바뀔 예정이지만, 지금은
// 각 하위 페이지 상단에 이 탭을 두어 서로 이동할 수 있게 합니다.
// (2026-10-03) 사업계획서 PPT의 "운영 및 지속가능성"(법인화·선순환·재원조성·추진일정·
// 기대효과) 내용을 위한 네 번째 탭을 추가했습니다.
const TABS = [
  { to: '/about', label: '위위란?' },
  { to: '/about/ministries', label: '사역 소개' },
  { to: '/about/leadership', label: '대표·이사회' },
  // (2026-10-09) 협력기관·후원기관·후원자 명단 페이지 — 대표·이사회와 운영·지속가능성 사이.
  { to: '/about/partners', label: '함께하는 사람들' },
  { to: '/about/sustainability', label: '운영·지속가능성' },
];

function AboutSubNav({ active }) {
  return (
    <nav className="wp-subnav">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={tab.to === active ? 'active' : ''}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default AboutSubNav;
