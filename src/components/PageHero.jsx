import React, { useState, useEffect } from 'react';

/**
 * 랜딩 페이지 히어로와 동일한 느낌(자동 전환 슬라이드 + 원형 링 진행 표시)의
 * 축소판 배너입니다. 로그인 후 각 페이지 상단에 얹어 페이지별 분위기 사진을 보여줍니다.
 * 랜딩 페이지 히어로보다 높이를 절반 정도로 낮춰서 콘텐츠를 가리지 않도록 했습니다.
 */
function PageHero({ images, eyebrow, title, subtitle }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!images || images.length < 2) return undefined;
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <section className="page-hero">
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`page-hero-slide ${idx === slide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      <div className="page-hero-overlay" />

      {(eyebrow || title || subtitle) && (
        <div className="page-hero-content">
          {eyebrow && <span className="page-hero-eyebrow">{eyebrow}</span>}
          {title && <h2>{title}</h2>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}

      {images.length > 1 && (
        <div className="page-hero-progress">
          {images.map((_, idx) => (
            <div className="page-hero-dot-wrap" key={idx}>
              <svg className="page-hero-ring" viewBox="0 0 36 36">
                <circle className="page-hero-ring-track" cx="18" cy="18" r="15.5" />
                {idx === slide && (
                  <circle
                    key={`fill-${slide}`}
                    className="page-hero-ring-fill"
                    cx="18"
                    cy="18"
                    r="15.5"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page-hero {
          position: relative;
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          background-color: #1c1c1a;
          margin-bottom: 2rem;
        }

        .page-hero-slide {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1.4s ease;
        }

        .page-hero-slide.active {
          opacity: 1;
        }

        .page-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(15,15,13,0.42) 0%, rgba(15,15,13,0.35) 45%, rgba(15,15,13,0.62) 100%);
        }

        .page-hero-content {
          position: relative;
          z-index: 2;
          max-width: 640px;
          margin: 0 auto;
          padding: 4rem 1.5rem 1.5rem;
        }

        .page-hero-eyebrow {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #e7dcc4;
          margin-bottom: 0.6rem;
        }

        .page-hero-content h2 {
          color: white;
          font-size: 1.9rem;
          font-weight: 700;
          margin-bottom: 0.4rem;
          letter-spacing: -0.01em;
        }

        .page-hero-content p {
          color: rgba(255, 255, 255, 0.88);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }

        .page-hero-progress {
          position: absolute;
          left: 50%;
          bottom: 1.1rem;
          transform: translateX(-50%);
          z-index: 2;
          display: flex;
          gap: 0.7rem;
        }

        .page-hero-dot-wrap {
          width: 16px;
          height: 16px;
        }

        .page-hero-ring {
          width: 16px;
          height: 16px;
          transform: rotate(-90deg);
        }

        .page-hero-ring-track {
          fill: none;
          stroke: rgba(255, 255, 255, 0.35);
          stroke-width: 2.5;
        }

        .page-hero-ring-fill {
          fill: none;
          stroke: #ffffff;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-dasharray: 97.4;
          stroke-dashoffset: 97.4;
          animation: pageHeroRingFill 3s linear forwards;
        }

        @keyframes pageHeroRingFill {
          from { stroke-dashoffset: 97.4; }
          to { stroke-dashoffset: 0; }
        }

        @media (max-width: 768px) {
          .page-hero {
            min-height: 280px;
          }

          .page-hero-content {
            /* 로그인한 사용자(특히 관리자)는 상단바가 여러 줄로 늘어날 수 있어, 상단바의
               실제 렌더링 높이(--navbar-height, Navigation.jsx에서 계속 갱신)만큼 위쪽
               여백을 확보해 제목 글씨가 상단바와 겹치지 않도록 합니다. */
            padding-top: calc(var(--navbar-height, 88px) + 1rem);
            /* 상단바가 여러 줄(아이콘 그리드)로 늘어나 위쪽 여백이 커지면 이 배너 전체가
               내용물 높이만큼 함께 늘어나는데, 아래쪽 슬라이드 진행 점은 배너 "맨 아래"
               기준으로 고정 배치되어 있어 문구 바로 아래로 바짝 붙어버립니다(랜딩 페이지
               히어로는 아래쪽 여백이 원래 넉넉해 이 문제가 없었습니다). 아래쪽 여백을
               넉넉히 확보해 문구와 진행 점이 상단바 줄 수와 무관하게 항상 충분히
               떨어지도록 합니다. */
            padding-bottom: 4rem;
          }

          .page-hero-content h2 {
            font-size: 1.4rem;
          }

          .page-hero-content p {
            font-size: 0.9rem;
          }

          .page-hero-progress {
            bottom: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .page-hero {
            min-height: 220px;
            margin-bottom: 1.25rem;
          }

          .page-hero-content {
            padding-top: calc(var(--navbar-height, 76px) + 0.75rem);
            padding-left: 1.1rem;
            padding-right: 1.1rem;
            /* 768px 구간과 동일한 이유로, 좁은 화면에서도 문구와 진행 점 사이 여백을
               넉넉히 확보합니다. */
            padding-bottom: 3rem;
          }

          .page-hero-eyebrow {
            font-size: 0.7rem;
          }

          .page-hero-content h2 {
            font-size: 1.2rem;
          }

          .page-hero-content p {
            font-size: 0.85rem;
            line-height: 1.5;
          }

          .page-hero-progress {
            bottom: 1rem;
          }

          .page-hero-dot-wrap,
          .page-hero-ring {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
    </section>
  );
}

export default PageHero;
