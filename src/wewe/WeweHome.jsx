import React from 'react';
import { ArrowRight, Home as HomeIcon, Car, HeartHandshake, Users2 } from 'lucide-react';
import WeweHeader from './WeweHeader';
import weweLogoFull from '../assets/wewe-logo-full.png';

// WEWE 비영리단체 전체 소개 홈페이지 (최상위 '/').
// 기존 위위스테이 전용 랜딩(지금은 /stay 안의 LandingPage.jsx)의 디자인 언어(에디토리얼 톤,
// 히어로 배너, 색상 등)를 재사용하되 콘텐츠는 WEWE 전체 소개로 새로 구성했습니다.
//
// 이번 단계(Phase 2)의 범위: 홈페이지 자체와 이원 로고 체계까지만.
// "소개"/"사역 소식"은 Phase 3·4에서 실제 하위 페이지(/about, /blog)로 분리될 예정이라,
// 지금은 이 홈페이지 안의 섹션(#about, #news)으로 연결해둔 임시 구조입니다.
// 로그인/가입하기는 Phase 6 전까지는 실제로 동작하는 /stay 쪽 로그인·가입 화면을 그대로 사용합니다.

const HERO_IMAGE = 'https://images.unsplash.com/photo-1604881991575-dfb1003d8811?auto=format&fit=crop&w=1800&q=80'; // Priscilla Du Preez - 맞잡은 손

function WeweHome() {
  return (
    <div className="wewe-home">
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

      {/* OUR STORY */}
      <section id="about" className="wh-about">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">OUR STORY</span>
          <h2 className="wh-h2-center">위(WE)로자의 위(WE)로자</h2>

          <blockquote className="wh-verse">
            “너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서 먹고 배부르게 하라
            그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라”
            <cite>(신명기 14:29)</cite>
          </blockquote>

          <p>
            WEWE는 가장 깊은 상실의 자리에서 시작되었습니다. 누군가의 아픔을 돌보는 이들이 정작 자신의 무너진 마음은
            숨겨야만 하는 현실, 그리고 그들의 눈물을 안타까움으로 바라보시는 하나님의 시선을 마주했습니다.
            &ldquo;누가 그들의 눈물을 닦아주는가?&rdquo; 이 질문에 대한 답을 성경에서 찾았습니다. 고아와 과부, 나그네를
            향한 구제의 손길 이전에, 기업이 없어 공동체의 돌봄이 절실했던 &lsquo;레위인&rsquo;이 있었습니다. WEWE는
            현대판 레위인인 목회자와 선교사들이 다시 일어설 수 있도록, 그들의 &lsquo;위로자&rsquo;가 되고자 합니다.
          </p>

          <div className="wh-identity-grid">
            <div className="wh-identity-card">
              <h3>WE + WE<span className="wh-identity-sub">나에서 우리로</span></h3>
              <p>
                혼자(I) 있던 위로자에게 다가가, 다시 &lsquo;우리(WE)&rsquo;가 되는 연결이 됩니다. 먼저 아파본
                위로자(WE)가 지금 아픈 위로자(WE)의 손을 잡아 줍니다.
              </p>
            </div>
            <div className="wh-identity-card">
              <h3>The Hands of &lsquo;W&rsquo;<span className="wh-identity-sub">브랜드 심볼의 의미</span></h3>
              <p>
                &lsquo;W&rsquo;는 아래에서 위로 향하는 두 손의 모양입니다. 출애굽기에서 모세의 팔이 내려가지 않도록
                곁에서 받쳐주었던 아론과 훌의 손을 상징합니다. 위로자의 팔이 꺾이지 않도록, WEWE가 묵묵히 지지합니다.
              </p>
            </div>
          </div>

          <div className="wh-leader">
            <img src={weweLogoFull} alt="WEWE" className="wh-leader-logo" />
            <div>
              <h4>대표 홍현지</h4>
              <p>
                간호학(전공) 학사 · 호스피스 전문 간호사(석사) — 현 세브란스 완화의료팀 프로젝트매니저,
                전 세브란스 완화의료팀 소아전문간호사, 전 국립암센터 소아암 병동 전문간호사.
                이사회 구성 등 자세한 소개는 준비 중입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 사역 소개 */}
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
              <ul className="wh-ministry-list">
                <li>
                  <strong>목회자 아카데미</strong>
                  <span>심포지엄 · 목회자 세미나 · 소진관리 프로그램</span>
                </li>
                <li>
                  <strong>개별 지원</strong>
                  <span>심리상담·자기탐색 프로그램, 재정 지원, 목회자 양성 장학사업</span>
                </li>
              </ul>
            </div>

            {/* 프로젝트 2 — 선교사 */}
            <div className="wh-ministry-card wh-ministry-orange">
              <span className="wh-ministry-tag">PROJECT 2 · 선교사</span>
              <h3>Missionary Care</h3>
              <p className="wh-ministry-desc">선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록.</p>
              <ul className="wh-ministry-list">
                <li className="wh-ministry-list-live">
                  <span className="wh-ministry-icon"><HomeIcon size={18} /></span>
                  <div>
                    <strong>WEWE 스테이 <span className="wh-live-badge">이용 가능</span></strong>
                    <span>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼</span>
                  </div>
                  <a href="/stay" className="wh-ministry-link">바로가기 <ArrowRight size={14} /></a>
                </li>
                <li>
                  <span className="wh-ministry-icon"><Car size={18} /></span>
                  <div>
                    <strong>레위인의 모빌리티</strong>
                    <span>단기 귀국 선교사를 위한 차량 쉐어링</span>
                  </div>
                </li>
                <li>
                  <span className="wh-ministry-icon"><HeartHandshake size={18} /></span>
                  <div>
                    <strong>Poiema 돌봄</strong>
                    <span>선교사 정체성 회복을 위한 전인적 힐링캠프</span>
                  </div>
                </li>
                <li>
                  <span className="wh-ministry-icon"><Users2 size={18} /></span>
                  <div>
                    <strong>WE+WE 커넥트</strong>
                    <span>후원자·선교사, 선교사·선교사를 잇는 멤버십 프로그램</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 사역 소식 (준비 중) */}
      <section id="news" className="wh-news">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">MINISTRY NEWS</span>
          <h2 className="wh-h2-center">사역 소식</h2>
          <div className="wh-news-card">
            <p>WEWE가 걸어가는 이야기와 사역 현장의 소식을 곧 이곳에서 전해드릴게요.</p>
            <span className="wh-news-soon">Coming soon</span>
          </div>
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

      {/* 푸터 */}
      <footer className="wh-footer">
        <div className="wh-container wh-footer-inner">
          <div className="wh-footer-brand">
            <img src={weweLogoFull} alt="WEWE" className="wh-footer-logo" />
            <p>위로자의 위로자 — 목회자와 선교사, 그들의 위로자가 되는 비영리단체</p>
          </div>

          <div className="wh-footer-info">
            <p>비영리단체 WEWE (위로자의 위로자) · 대표 홍현지</p>
            <p>사업자(고유번호) 501-82-75164</p>
            <p>주소 서울특별시 종로구 대학로12길 61, 5층 501-176A호(동승동, 계우빌딩)</p>
            <p>전화 [연락처 입력 필요] · 이메일 wewe@wewestay.com</p>
          </div>

          <div className="wh-footer-copy">
            <p>&copy; {new Date().getFullYear()} WEWE. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .wewe-home {
          --wh-ink: #1c1c1a;
          --wh-ink-soft: #4a4a46;
          --wh-stone: #8c8880;
          --wh-line: #e5e2da;
          --wh-bg: #ffffff;
          --wh-bg-soft: #faf9f6;
          --wh-teal: #146b71;
          --wh-orange: #d97b3f;
          --wh-orange-deep: #b8622c;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--wh-bg);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
        }

        .wh-container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .wh-container-narrow {
          max-width: 760px;
        }

        .wh-eyebrow {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--wh-orange);
          margin-bottom: 0.85rem;
        }

        .wh-eyebrow-center {
          display: block;
          text-align: center;
        }

        .wh-h2-center {
          text-align: center;
          color: var(--wh-ink);
          margin-bottom: 2rem;
          font-size: 1.85rem;
        }

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

        .wh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 1.6rem;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.98rem;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }

        .wh-btn-primary {
          color: #fff;
          background: linear-gradient(90deg, var(--wh-orange) 0%, var(--wh-orange-deep) 100%);
        }

        .wh-btn-primary:hover {
          box-shadow: 0 6px 18px rgba(217, 123, 63, 0.45);
        }

        .wh-btn-outline {
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.65);
        }

        .wh-btn-outline:hover {
          border-color: #fff;
          background: rgba(255,255,255,0.08);
        }

        .wh-btn-ghost {
          color: var(--wh-ink);
          border: 1.5px solid var(--wh-line);
        }

        .wh-btn-ghost:hover {
          border-color: var(--wh-orange);
          color: var(--wh-orange);
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

        .wh-identity-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin: 2.5rem 0;
        }

        .wh-identity-card {
          padding: 1.75rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wh-identity-card h3 {
          color: var(--wh-ink);
          margin-bottom: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .wh-identity-sub {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--wh-stone);
          letter-spacing: 0.02em;
        }

        .wh-identity-card p {
          margin: 0;
          font-size: 0.95rem;
        }

        .wh-leader {
          display: grid;
          grid-template-columns: 90px 1fr;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 1.75rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wh-leader-logo {
          width: 100%;
          height: auto;
        }

        .wh-leader h4 {
          color: var(--wh-ink);
          margin-bottom: 0.4rem;
        }

        .wh-leader p {
          margin: 0;
          font-size: 0.92rem;
          color: var(--wh-ink-soft);
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
          margin-bottom: 1.5rem;
          line-height: 1.7;
        }

        .wh-ministry-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wh-ministry-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid var(--wh-line);
        }

        .wh-ministry-list li:first-child {
          padding-top: 0;
          border-top: none;
        }

        .wh-ministry-list li > strong {
          display: block;
          color: var(--wh-ink);
          font-size: 0.98rem;
          margin-bottom: 0.15rem;
        }

        .wh-ministry-list li > span,
        .wh-ministry-list li div span {
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

        .wh-ministry-list-live {
          align-items: center;
          flex-wrap: wrap;
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
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--wh-orange-deep);
          text-decoration: none;
          white-space: nowrap;
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

        /* 푸터 */
        .wh-footer {
          background: #141412;
          padding: 2.75rem 1.5rem;
        }

        .wh-footer-inner {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 2rem;
        }

        .wh-footer-logo {
          height: 40px;
          width: auto;
          display: block;
          margin-bottom: 0.6rem;
        }

        .wh-footer-brand p {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
          max-width: 280px;
          line-height: 1.6;
        }

        .wh-footer-info p {
          color: rgba(255,255,255,0.55);
          font-size: 0.85rem;
          margin: 0.2rem 0;
          line-height: 1.6;
        }

        .wh-footer-copy {
          display: flex;
          align-items: flex-end;
        }

        .wh-footer-copy p {
          color: rgba(255,255,255,0.35);
          font-size: 0.8rem;
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

          .wh-identity-grid,
          .wh-ministry-grid {
            grid-template-columns: 1fr;
          }

          .wh-leader {
            grid-template-columns: 64px 1fr;
            padding: 1.25rem;
          }

          .wh-about, .wh-ministries, .wh-news {
            padding: 3.5rem 0;
          }

          .wh-cta-inner {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }

          .wh-footer-inner {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweHome;
