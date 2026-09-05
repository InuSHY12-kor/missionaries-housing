import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home as HomeIcon } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import { weweSupabase } from './weweSupabase';
import './wewe-shared.css';

// WEWE 비영리단체 전체 소개 홈페이지 (최상위 '/').
// 기존 위위스테이 전용 랜딩(지금은 /stay 안의 LandingPage.jsx)의 디자인 언어(에디토리얼 톤,
// 히어로 배너, 색상 등)를 재사용하되 콘텐츠는 WEWE 전체 소개로 새로 구성했습니다.
//
// Phase 2(2026-09-05)에서는 "소개"/"사역 소개" 전체 내용을 이 홈페이지 안의 섹션(#about,
// #ministries)으로 임시 구현했었습니다. Phase 3에서 그 내용을 실제 하위 페이지
// (/about, /about/ministries, /about/leadership)로 옮기고, 이 홈페이지는 각 섹션의
// 짧은 요약 + "자세히 보기" 링크만 남겨 홈페이지 자체는 더 가볍게 유지합니다.
// Phase 4에서 "사역 소식" 섹션도 실제 게시글(ministry_posts, /about/ministries의
// 관리자가 /stay/admin에서 작성·발행)의 최신 3개를 보여주도록 바꿨습니다 — 아직 발행된
// 글이 없으면 이전과 같은 "Coming soon" 안내를 그대로 보여줍니다.

const HERO_IMAGE = 'https://images.unsplash.com/photo-1604881991575-dfb1003d8811?auto=format&fit=crop&w=1800&q=80'; // Priscilla Du Preez - 맞잡은 손

function WeweHome() {
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsLoaded, setNewsLoaded] = useState(false);

  // 다른 페이지에서 "/#ministries"처럼 해시가 붙은 주소로 들어온 경우, 해당 섹션이
  // 화면에 그려진 뒤에 스크롤해서 보여줍니다(브라우저의 기본 해시 스크롤은 정적
  // HTML을 기준으로 동작해서, 이 콘텐츠처럼 자바스크립트로 그려지는 섹션에는
  // 적용되지 않기 때문입니다).
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto' }));
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    weweSupabase
      .from('ministry_posts')
      .select('id, slug, title, excerpt, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setNewsPosts(data || []);
        setNewsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="wewe-page wewe-home">
      <WeweHeader />

      {/* 히어로 */}
      <section id="top" className="wh-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="wh-hero-content">
          <span className="wh-hero-eyebrow">WE + WE, 나에서 우리로</span>
          <h1>위로자의 위로자, WEWE입니다</h1>
          <p>
            사역 현장에서 누군가를 위로하느라 자신의 아픔은 숨겨야 했던 목회자와 선교사님들.
            <br />
            먼저 아파본 위로자가 지금 아픈 위로자의 손을 잡아드립니다.
          </p>
          <div className="wh-hero-actions">
            <a href="/stay" className="wh-btn wh-btn-primary">
              위위 스테이 살펴보기 <ArrowRight size={18} />
            </a>
            <a href="#ministries" className="wh-btn wh-btn-outline">사역 알아보기</a>
          </div>
        </div>
      </section>

      {/* OUR STORY (요약 — 전체 내용은 /about) */}
      <section id="about" className="wh-about">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">OUR STORY</span>
          <h2 className="wh-h2-center">위(WE)로자의 위(WE)로자</h2>

          <blockquote className="wh-verse">
            &ldquo;너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서 먹고
            배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라&rdquo;
            <cite>(신명기 14:29)</cite>
          </blockquote>

          <p>
            WEWE는 가장 깊은 상실의 자리에서 시작되었습니다. 누군가의 아픔을 돌보는 이들이 정작 자신의 무너진
            마음은 숨겨야만 하는 현실 속에서, WEWE는 현대판 레위인인 목회자와 선교사들의 &lsquo;위로자&rsquo;가
            되고자 합니다.
          </p>

          <div className="wh-about-more">
            <Link to="/about" className="wh-btn wh-btn-ghost">
              WEWE 이야기 더 보기 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 사역 소개 (요약 — 전체 내용은 /about/ministries) */}
      <section id="ministries" className="wh-ministries">
        <div className="wh-container">
          <span className="wh-eyebrow wh-eyebrow-center">OUR MINISTRIES</span>
          <h2 className="wh-h2-center">우리가 하는 일</h2>
          <p className="wh-ministries-lead">Blessed Blessing, 하나님의 영광을 위해 사람을 세웁니다.</p>

          <div className="wh-ministry-grid">
            {/* 프로젝트 1 — 목회자 */}
            <div className="wh-ministry-card wh-ministry-teal">
              <span className="wh-ministry-tag">PROJECT 1 · 목회자</span>
              <h3>Refresh Pastor Academy</h3>
              <p className="wh-ministry-desc">레위인의 회복 — 성도의 위로가 되어온 목회자님이, 이제는 위로받으실 시간입니다.</p>
              <p className="wh-ministry-summary">목회자 아카데미(심포지엄·세미나·소진관리)와 개별 지원(심리상담, 재정, 장학사업)으로 구성됩니다.</p>
              <Link to="/about/ministries" className="wh-ministry-link">자세히 보기 <ArrowRight size={14} /></Link>
            </div>

            {/* 프로젝트 2 — 선교사 */}
            <div className="wh-ministry-card wh-ministry-orange">
              <span className="wh-ministry-tag">PROJECT 2 · 선교사</span>
              <h3>Missionary Care</h3>
              <p className="wh-ministry-desc">선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록.</p>

              <div className="wh-ministry-live">
                <span className="wh-ministry-icon"><HomeIcon size={18} /></span>
                <div>
                  <strong>WEWE 스테이 <span className="wh-live-badge">이용 가능</span></strong>
                  <span>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼</span>
                </div>
                <a href="/stay" className="wh-ministry-link">바로가기 <ArrowRight size={14} /></a>
              </div>

              <p className="wh-ministry-summary">그 외 레위인의 모빌리티(차량 쉐어링), Poiema 돌봄(힐링캠프), WE+WE 커넥트(멤버십)도 준비하고 있습니다.</p>
              <Link to="/about/ministries" className="wh-ministry-link">자세히 보기 <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* 사역 소식 */}
      <section id="news" className="wh-news">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">MINISTRY NEWS</span>
          <h2 className="wh-h2-center">사역 소식</h2>

          {newsLoaded && newsPosts.length > 0 ? (
            <>
              <ul className="wh-news-list">
                {newsPosts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/news/${post.slug}`} className="wh-news-item">
                      <span className="wh-news-item-date">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
                      </span>
                      <span className="wh-news-item-title">{post.title}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="wh-news-more">
                <Link to="/news" className="wh-btn wh-btn-ghost">
                  사역 소식 전체 보기 <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <div className="wh-news-card">
              <p>WEWE가 걸어가는 이야기와 사역 현장의 소식을 곧 이곳에서 전해드릴게요.</p>
              <span className="wh-news-soon">Coming soon</span>
            </div>
          )}
        </div>
      </section>

      {/* WEWE 스테이 CTA 밴드 */}
      <section className="wh-cta">
        <div className="wh-container wh-cta-inner">
          <div>
            <h2>선교사이신가요, 숙소를 나누고 싶으신가요?</h2>
            <p>위위 스테이에서 회원가입하고 신뢰의 공유 숙소 커뮤니티에 함께해 주세요.</p>
          </div>
          <div className="wh-cta-actions">
            <a href="/stay/signup" className="wh-btn wh-btn-primary">가입하기</a>
            <a href="/stay/login" className="wh-btn wh-btn-ghost">로그인</a>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        /* 히어로 */
        .wh-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 6rem 2rem;
          background-color: #14201d;
          background-size: cover;
          background-position: center;
        }

        .wh-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,20,18,0.6) 0%, rgba(15,20,18,0.5) 45%, rgba(15,20,18,0.88) 100%);
        }

        .wh-hero-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
          margin: 0 auto;
        }

        .wh-hero-eyebrow {
          display: inline-block;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #f0c9a0;
          margin-bottom: 1.1rem;
        }

        .wh-hero h1 {
          color: #fff;
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          margin-bottom: 1.1rem;
        }

        .wh-hero p {
          color: rgba(255,255,255,0.92);
          font-size: 1.1rem;
          line-height: 1.75;
          margin-bottom: 2.25rem;
        }

        .wh-hero-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* OUR STORY */
        .wh-about {
          padding: 5.5rem 0;
          background: var(--wh-bg);
        }

        .wh-about p {
          color: var(--wh-ink-soft);
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        .wh-verse {
          margin: 0 0 2rem;
          padding: 1.5rem 1.75rem;
          background: var(--wh-bg-soft);
          border-left: 3px solid var(--wh-orange);
          color: var(--wh-ink);
          font-weight: 600;
          line-height: 1.8;
          font-style: italic;
        }

        .wh-verse cite {
          display: block;
          margin-top: 0.75rem;
          color: var(--wh-orange);
          font-style: normal;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .wh-about-more {
          text-align: center;
          margin-top: 1.5rem;
        }

        /* 사역 소개 */
        .wh-ministries {
          padding: 5.5rem 0;
          background: var(--wh-bg-soft);
        }

        .wh-ministries-lead {
          text-align: center;
          color: var(--wh-ink-soft);
          font-weight: 600;
          margin: -1rem 0 2.5rem;
        }

        .wh-ministry-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.75rem;
        }

        .wh-ministry-card {
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          padding: 2rem;
          border-top: 4px solid transparent;
          display: flex;
          flex-direction: column;
        }

        .wh-ministry-teal {
          border-top-color: var(--wh-teal);
        }

        .wh-ministry-orange {
          border-top-color: var(--wh-orange);
        }

        .wh-ministry-tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.9rem;
        }

        .wh-ministry-teal .wh-ministry-tag {
          color: var(--wh-teal);
          background: rgba(20, 107, 113, 0.1);
        }

        .wh-ministry-orange .wh-ministry-tag {
          color: var(--wh-orange-deep);
          background: rgba(217, 123, 63, 0.1);
        }

        .wh-ministry-card h3 {
          color: var(--wh-ink);
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
        }

        .wh-ministry-desc {
          color: var(--wh-ink-soft);
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .wh-ministry-summary {
          color: var(--wh-stone);
          font-size: 0.88rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .wh-ministry-live {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 1rem 0;
          margin-bottom: 0.5rem;
          border-top: 1px solid var(--wh-line);
          border-bottom: 1px solid var(--wh-line);
        }

        .wh-ministry-live > strong {
          display: block;
          color: var(--wh-ink);
          font-size: 0.98rem;
          margin-bottom: 0.15rem;
        }

        .wh-ministry-live > div > span {
          display: block;
          color: var(--wh-stone);
          font-size: 0.87rem;
          line-height: 1.5;
        }

        .wh-ministry-icon {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.1);
          color: var(--wh-orange-deep);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wh-live-badge {
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: var(--wh-teal);
          color: #fff;
          vertical-align: middle;
        }

        .wh-ministry-link {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--wh-orange-deep);
          text-decoration: none;
          white-space: nowrap;
        }

        .wh-ministry-live .wh-ministry-link {
          margin-top: 0;
          margin-left: auto;
        }

        .wh-ministry-link:hover {
          text-decoration: underline;
        }

        /* 사역 소식 */
        .wh-news {
          padding: 5rem 0;
          background: var(--wh-bg);
        }

        .wh-news-card {
          text-align: center;
          padding: 2.5rem;
          background: var(--wh-bg-soft);
          border: 1px dashed var(--wh-line);
          border-radius: 10px;
        }

        .wh-news-card p {
          color: var(--wh-ink-soft);
          margin-bottom: 0.9rem;
          font-size: 1rem;
        }

        .wh-news-soon {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--wh-stone);
          border: 1px solid var(--wh-line);
          border-radius: 999px;
          padding: 0.3rem 0.9rem;
        }

        .wh-news-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .wh-news-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.1rem 1.4rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-decoration: none;
          color: var(--wh-ink);
          transition: border-color 0.15s ease;
        }

        .wh-news-item:hover {
          border-color: var(--wh-orange);
        }

        .wh-news-item-date {
          flex-shrink: 0;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--wh-stone);
        }

        .wh-news-item-title {
          flex: 1;
          font-weight: 600;
          font-size: 0.98rem;
        }

        .wh-news-item svg {
          flex-shrink: 0;
          color: var(--wh-orange-deep);
        }

        .wh-news-more {
          text-align: center;
          margin-top: 1.75rem;
        }

        /* CTA 밴드 */
        .wh-cta {
          padding: 4rem 0;
          background: var(--wh-ink);
        }

        .wh-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .wh-cta h2 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .wh-cta p {
          color: rgba(255,255,255,0.72);
          margin: 0;
        }

        .wh-cta-actions {
          display: flex;
          gap: 0.85rem;
          flex-shrink: 0;
        }

        .wh-cta .wh-btn-ghost {
          color: #fff;
          border-color: rgba(255,255,255,0.35);
        }

        .wh-cta .wh-btn-ghost:hover {
          border-color: #fff;
          color: #fff;
          background: rgba(255,255,255,0.08);
        }

        /* 모바일 */
        @media (max-width: 860px) {
          .wh-hero {
            min-height: 560px;
            padding: 7rem 1.25rem 3.5rem;
          }

          .wh-hero h1 {
            font-size: 1.9rem;
          }

          .wh-hero p {
            font-size: 0.95rem;
          }

          .wh-ministry-grid {
            grid-template-columns: 1fr;
          }

          .wh-about, .wh-ministries, .wh-news {
            padding: 3.5rem 0;
          }

          .wh-cta-inner {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweHome;
