import React from 'react';
import { Link } from 'react-router-dom';

// "소개" 메뉴 하위의 세 페이지(위위란? / 사역 소개 / 대표·이사회)를 오가는 탭.
// 최종적으로는 헤더의 "소개" 메뉴가 드롭다운으로 바뀔 예정이지만, 지금은
// 각 하위 페이지 상단에 이 탭을 두어 서로 이동할 수 있게 합니다.
const TABS = [
  { to: '/about', label: '위위란?' },
  { to: '/about/ministries', label: '사역 소개' },
  { to: '/about/leadership', label: '대표·이사회' },
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
