import React, { useState, useEffect } from 'react';
import { useHero, HeroEditButton, renderRich } from '../edit/EditMode';

/**
 * 위위스테이 각 페이지 상단의 머리말 배너입니다.
 * (2026-10-31 흑백 에디토리얼) 어두운 사진 위 가운데 글씨 → WEWE 하위 페이지(WevePageHero)와 같은
 * "왼쪽 라벨 + 오른쪽 제목·설명" 흰 바탕 머리말과, 그 아래 낮은 사진 띠(자동 크로스페이드)로 바꿨습니다.
 */
// (2026-10-09) 관리자 편집 모드 — 페이지 경로별로 저장된 배너(사진·문구)가 있으면 그것을, 없으면 props
// 기본값을 보여줍니다(src/edit/EditMode.jsx). 저장된 내용을 불러오기 전에는 잠깐 숨겨 깜빡임을 막습니다.
function PageHero({ images: defaultImages, eyebrow: defaultEyebrow, title: defaultTitle, subtitle: defaultSubtitle }) {
  const defaults = { images: defaultImages || [], eyebrow: defaultEyebrow, title: defaultTitle, subtitle: defaultSubtitle };
  const hero = useHero(defaults);
  const { images, eyebrow, title, subtitle } = hero;
  const [slide, setSlide] = useState(0);

  const imageCount = images ? images.length : 0;
  useEffect(() => {
    setSlide(0);
    if (imageCount < 2) return undefined;
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % imageCount);
    }, 3500);
    return () => clearInterval(timer);
  }, [imageCount]);

  if (!images || images.length === 0) return null;

  return (
    <section className="page-hero">
      <div className="page-hero-inner">
        {(eyebrow || title || subtitle) && (
          <div className="page-hero-head" style={{ opacity: hero.ready ? 1 : 0, transition: 'opacity 0.25s ease' }}>
            <div className="page-hero-eyebrow">{eyebrow || 'WEWE STAY'}</div>
            <div>
              {title && <h2>{title}</h2>}
              {subtitle && <p>{renderRich(subtitle)}</p>}
            </div>
          </div>
        )}

        <div className="page-hero-media">
          {hero.ready && images.map((src, idx) => (
            <div
              key={idx}
              className={`page-hero-slide ${idx === slide ? 'active' : ''}`}
              style={{ backgroundImage: `url("${src}")` }}
            />
          ))}

          {images.length > 1 && (
            <div className="page-hero-progress" aria-hidden="true">
              {images.map((_, idx) => (
                <span key={idx} className={`page-hero-dot ${idx === slide ? 'active' : ''}`} />
              ))}
            </div>
          )}

          <HeroEditButton defaults={defaults} />
        </div>
      </div>

      <style>{`
        .page-hero {
          background: #fff;
          margin-bottom: 2.5rem;
        }

        .page-hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3.5rem 72px 0;
        }

        .page-hero-head {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          padding-bottom: 1.75rem;
          border-bottom: 1px solid #000;
        }

        .page-hero-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #111;
          padding-top: 0.5rem;
        }

        .page-hero-eyebrow::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d97b3f;
          margin-right: 0.6rem;
          vertical-align: middle;
          transform: translateY(-1px);
        }

        .page-hero-head h2 {
          color: #000;
          font-size: clamp(1.7rem, 3.2vw, 2.5rem);
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.03em;
          margin: 0 0 0.6rem;
        }

        .page-hero-head p {
          color: #424242;
          font-size: 1rem;
          line-height: 1.7;
          margin: 0;
          max-width: 620px;
        }

        .page-hero-media {
          position: relative;
          margin-top: 1.75rem;
          aspect-ratio: 21 / 5;
          border-radius: 4px;
          overflow: hidden;
          background: #f2f2f2;
        }

        .page-hero-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 0.45s ease-in-out;
        }

        .page-hero-slide.active {
          opacity: 1;
        }

        .page-hero-progress {
          position: absolute;
          right: 0.9rem;
          bottom: 0.9rem;
          display: flex;
          gap: 0.35rem;
          padding: 0.45rem 0.6rem;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.55);
        }

        .page-hero-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.45);
          transition: background-color 0.2s ease-in-out;
        }

        .page-hero-dot.active {
          background: #d97b3f;
        }

        @media (max-width: 1000px) {
          .page-hero-inner {
            padding: 2.25rem 20px 0;
          }

          .page-hero-head {
            grid-template-columns: 1fr;
            gap: 0.6rem;
          }

          .page-hero-media {
            aspect-ratio: 16 / 6;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .page-hero-slide {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}

export default PageHero;
