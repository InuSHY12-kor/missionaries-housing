import React, { useEffect, useState } from 'react';

// /about, /about/ministries, /about/leadership, /donate, /signup, /news 등
// WEWE 소개 계열 하위 페이지가 공통으로 사용하는 작은 히어로 배너. 히어로 바로
// 아래에 AboutSubNav(children)를 함께 넣어서 세 페이지 사이를 오갈 수 있게 합니다.
//
// (2026-09-07 수정) 배경에 사진이 전혀 없어 밋밋하다는 피드백에 따라, WEWE STAY
// 랜딩 히어로(src/pages/LandingPage.jsx의 HERO_IMAGES)와 동일한 방식 — 사진 4장이
// 3.5초마다 부드럽게 크로스페이드되는 슬라이드쇼 — 를 배경에 얹었습니다. 이 컴포넌트를
// 쓰는 모든 하위 페이지가 같은 컴포넌트를 공유하므로, 배너의 크기와 느낌이 자동으로
// 통일됩니다(홈 화면 '/'의 대형 히어로는 WeweHome.jsx가 쓰는 별도 컴포넌트라 대상이
// 아닙니다).
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1604881991575-dfb1003d8811?auto=format&fit=crop&w=1800&q=80', // Priscilla Du Preez - 맞잡은 손
  'https://images.unsplash.com/photo-1763616828336-e7fcd02086f5?auto=format&fit=crop&w=1800&q=80', // Rochelle Lee
  'https://images.unsplash.com/photo-1749703810919-1f979a9a3982?auto=format&fit=crop&w=1800&q=80', // Kailun Zhang
  'https://images.unsplash.com/photo-1769366316790-dfcb6a546f05?auto=format&fit=crop&w=1800&q=80' // Oriol Pascual
];

function WevePageHero({ eyebrow, title, subtitle, children }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="wp-hero">
      {HERO_IMAGES.map((src, idx) => (
        <div
          key={idx}
          className={`wp-hero-slide ${idx === slide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      <div className="wp-hero-inner">
        {eyebrow && <span className="wp-hero-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export default WevePageHero;
