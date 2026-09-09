import React, { useEffect, useState } from 'react';

// /about, /about/ministries, /about/leadership, /donate, /signup, /news 등
// WEWE 소개 계열 하위 페이지가 공통으로 사용하는 작은 히어로 배너. 히어로 바로
// 아래에 AboutSubNav(children)를 함께 넣어서 세 페이지 사이를 오갈 수 있게 합니다.
//
// (2026-09-07) 배경에 사진이 전혀 없어 밋밋하다는 피드백에 따라, WEWE STAY 랜딩
// 히어로(src/pages/LandingPage.jsx의 HERO_IMAGES)와 동일한 방식 — 사진이 3.5초마다
// 부드럽게 크로스페이드되는 슬라이드쇼 — 를 배경에 얹었습니다.
//
// (2026-09-09) 두 가지를 보강했습니다.
//   1) 사진이 페이지마다 전부 똑같았던 문제 — 이제 `images` prop으로 페이지별 사진
//      묶음을 넘길 수 있고, 넘기지 않으면 기존 기본 4장(DEFAULT_IMAGES)을 그대로
//      씁니다(하위 호환).
//   2) 위위 스테이 랜딩 히어로에는 있던 "원형 링이 채워지는" 슬라이드 진행 인디케이터가
//      이 컴포넌트에는 빠져 있던 문제 — 동일한 SVG 링 인디케이터를 추가했습니다.
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1604881991575-dfb1003d8811?auto=format&fit=crop&w=1800&q=80', // Priscilla Du Preez - 맞잡은 손
  'https://images.unsplash.com/photo-1763616828336-e7fcd02086f5?auto=format&fit=crop&w=1800&q=80', // Rochelle Lee
  'https://images.unsplash.com/photo-1749703810919-1f979a9a3982?auto=format&fit=crop&w=1800&q=80', // Kailun Zhang
  'https://images.unsplash.com/photo-1769366316790-dfcb6a546f05?auto=format&fit=crop&w=1800&q=80' // Oriol Pascual
];

function WevePageHero({ eyebrow, title, subtitle, children, images }) {
  const heroImages = images && images.length > 0 ? images : DEFAULT_IMAGES;
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    setSlide(0);
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % heroImages.length);
    }, 3500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroImages.length]);

  return (
    <section className="wp-hero">
      {heroImages.map((src, idx) => (
        <div
          key={src}
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

      {heroImages.length > 1 && (
        <div className="wp-hero-progress">
          {heroImages.map((src, idx) => (
            <div className="wp-hero-dot-wrap" key={src}>
              <svg className="wp-hero-ring" viewBox="0 0 32 32">
                <circle className="wp-hero-ring-track" cx="16" cy="16" r="14" />
                {idx === slide && (
                  <circle
                    key={`fill-${slide}`}
                    className="wp-hero-ring-fill"
                    cx="16"
                    cy="16"
                    r="14"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default WevePageHero;
