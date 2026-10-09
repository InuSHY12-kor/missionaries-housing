import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import weweRepresentative from '../assets/wewe-representative.jpg';
import weweLogoNew from '../assets/wewe-logo-new.png';
import './wewe-shared.css';
import { EditableText } from '../edit/EditMode';

// (2026-10-09) 협력기관·후원기관 목록은 새 "함께하는 사람들" 페이지(/about/partners, PartnersPage.jsx)로
// 옮겼습니다. 이 페이지 하단에는 그 페이지로 가는 안내만 남깁니다.

// "소개" > "대표·이사회" 페이지 (/about/leadership).
// 대표 홍현지님 소개(claude/wewe-brand-content-2026-09-05.md #7)와,
// 아직 구성되지 않은 이사회에 대한 안내(#8, "향후 추가 예정")를 담습니다.
// (2026-09-09) 대표 소개 카드의 로고 자리표시자를 실제 대표 프로필 사진으로,
// 이사회 안내 카드에는 새로 전달받은 WEWE 로고를 붙였습니다.
function LeadershipPage() {
  return (
    <div className="wewe-page wewe-leadership-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="LEADERSHIP"
        title="대표 및 이사회"
        subtitle="WEWE를 이끌어가는 사람들을 소개합니다."
        images={HERO_IMAGE_SETS.leadership}
      >
        <AboutSubNav active="/about/leadership" />
      </WevePageHero>

      {/* (2026-10-10) 대표 인사말을 먼저 보여주고, 약력은 그 아래 카드로 옮겼습니다. */}
      <section className="wl-leader">
        <div className="wh-container">
          <Reveal>
            <EditableText id={"GREETING"} as="span" className="wh-eyebrow wh-eyebrow-center">GREETING</EditableText>
            <EditableText id={"대표 인사말"} as="h2" className="wh-h2-center">대표 인사말</EditableText>
          </Reveal>

          <Reveal as="div" className="wl-greeting" delay={80}>
            <figure className="wl-greeting-photo">
              <img src={weweRepresentative} alt="위위(WEWE) 대표 홍현지" />
              <figcaption>위위(WEWE) 대표 <b>홍현지</b></figcaption>
            </figure>
            <div className="wl-greeting-letter">
              <EditableText id={"인사말 제목"} as="h3" className="wl-greeting-title">위로하는 이들에게도, 위로가 필요합니다.</EditableText>
              <EditableText id={"인사말 1"}>{"안녕하세요. 위위(WEWE) 대표 홍현지입니다."}</EditableText>
              <EditableText id={"인사말 2"}>{"목회자와 선교사, 그리고 하나님 나라를 위해 일하는 사역자들은 늘 누군가의 곁을 지킵니다. 아픈 이를 찾아가고, 지친 이의 이야기를 듣고, 무너진 자리에 다시 소망을 세웁니다. 그런데 정작 그 손을 붙잡아 줄 사람은 많지 않습니다. 위로하는 이들이 가장 위로받기 어려운 자리에 서 있다는 것, 위위는 그 질문에서 시작되었습니다."}</EditableText>
              <EditableText id={"인사말 3"}>{"신명기 14장 29절은 기업이 없는 레위인과 객, 고아와 과부가 와서 먹고 배부르게 하라고 말씀합니다. 하나님께서는 섬기는 자들이 홀로 남겨지지 않도록 공동체에 그 책임을 맡기셨습니다. 위위는 이 말씀을 오늘의 자리에서 살아내고자 합니다."}</EditableText>
              <EditableText id={"인사말 4"}>{"출애굽기의 아말렉 전투에서 모세의 손이 피곤하여 내려올 때, 아론과 훌이 양쪽에서 그 손을 붙들었습니다. 싸움의 승패는 모세 한 사람의 힘이 아니라, 곁에서 함께 버틴 손들에 달려 있었습니다. 위위는 그 '곁의 손'이 되고 싶습니다."}</EditableText>
              <EditableText id={"인사말 5"}>{"하나님의 일은 하나님께서 이뤄가십니다.\n쉼이 필요한 선교사님께 머물 곳을 잇고, 지친 사역자의 이야기에 귀 기울이며, 혼자가 아닌 '우리'로 함께 걷는 길을 만들어 가고 있습니다."}</EditableText>
              <EditableText id={"인사말 6"}>{"이 길에 여러분을 초대합니다. 기도로, 후원으로, 그리고 따뜻한 관심으로 함께해 주신다면, 위로자의 손을 붙드는 손이 하나 더 늘어날 것입니다."}</EditableText>
              <EditableText id={"인사말 7"}>{"나에서 우리로, 위로자의 위로자, 위위가 함께하겠습니다."}</EditableText>
              <EditableText id={"인사말 서명"} className="wl-greeting-sign">위위(WEWE) 대표 홍현지 드림</EditableText>
            </div>
          </Reveal>

          <Reveal as="div" className="wl-leader-card" delay={120}>
            <div className="wl-leader-body">
              <EditableText id={"대표 약력"} as="h3" className="wl-leader-title">대표 홍현지 약력</EditableText>
              <EditableText id={"간호학(전공) 학사 · 호스피스 전문 간호사(석사)"} className="wl-leader-degree">간호학(전공) 학사 · 호스피스 전문 간호사(석사)</EditableText>
              <ul className="wl-leader-history">
                <li>현 세브란스 완화의료팀 프로젝트매니저</li>
                <li>현 상지대학교 아동간호학 강사</li>
                <li>전 세브란스 완화의료팀 소아전문간호사</li>
                <li>전 국립암센터 소아암 병동 전문간호사</li>
              </ul>
              <EditableText id={"약력은 계속 추가될 예정입니다."} className="wl-leader-note">약력은 계속 추가될 예정입니다.</EditableText>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wl-board">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"BOARD OF DIRECTORS"} as="span" className="wh-eyebrow wh-eyebrow-center">BOARD OF DIRECTORS</EditableText>
            <EditableText id={"이사회"} as="h2" className="wh-h2-center">이사회</EditableText>
          </Reveal>

          {/* 대표 홍현지 섹션(wl-leader-card)과 동일하게 왼쪽 이미지 + 오른쪽 내용 배치로
              구성합니다(2026-09-10 수정) — 사진 대신 WEWE 로고를 넣습니다. */}
          <Reveal as="div" className="wl-board-card" delay={80}>
            <div className="wl-board-logo-wrap">
              <img src={weweLogoNew} alt="WEWE" className="wl-board-logo" />
            </div>
            <div className="wl-board-body">
              <EditableText id={"WEWE는 임의법인에서 사단법인으로 전환하는 과정에서 이사회를 구성하고 있습니다."}>WEWE는 임의법인에서 사단법인으로 전환하는 과정에서 이사회를 구성하고 있습니다.</EditableText>
              <span className="wl-board-soon">구성 중</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wl-partners">
        <div className="wh-container wh-container-narrow">
          <Reveal as="div" className="wl-partners-cta">
            <div>
              <EditableText id={"WITH US"} as="span" className="wh-eyebrow">WITH US</EditableText>
              <EditableText id={"WEWE와 함께하는 사람들"} as="h2">WEWE와 함께하는 사람들</EditableText>
              <EditableText id={"협력기관 · 후원기관과 후원자 명단은 &lsquo;함께하는 사람들&rsquo; 페이지에서 보실 수 있습니다."}>협력기관 · 후원기관과 후원자 명단은 &lsquo;함께하는 사람들&rsquo; 페이지에서 보실 수 있습니다.</EditableText>
            </div>
            <Link to="/about/partners" className="wh-btn wh-btn-primary">
              함께하는 사람들 보기 <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wl-leader {
          padding: 5rem 0 1rem;
          background: var(--wh-bg);
        }

        .wl-greeting {
          display: grid;
          grid-template-columns: minmax(220px, 300px) 1fr;
          gap: 3rem;
          align-items: start;
          max-width: 1000px;
          margin: 0 auto 2.5rem;
        }

        .wl-greeting-photo {
          margin: 0;
          position: sticky;
          top: 110px;
        }

        .wl-greeting-photo img {
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          object-position: center top;
          border-radius: 14px;
          display: block;
          box-shadow: 0 18px 40px rgba(28, 28, 26, 0.14);
        }

        .wl-greeting-photo figcaption {
          margin-top: 0.9rem;
          text-align: center;
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
        }

        .wl-greeting-photo figcaption b {
          color: var(--wh-ink);
        }

        .wl-greeting-letter {
          word-break: keep-all;
        }

        .wl-greeting-title {
          font-size: clamp(1.45rem, 2.6vw, 1.95rem);
          line-height: 1.45;
          color: var(--wh-ink);
          margin: 0 0 1.6rem;
          padding-left: 1rem;
          border-left: 4px solid var(--wh-orange);
        }

        .wl-greeting-letter p {
          color: var(--wh-ink-soft);
          font-size: 1.04rem;
          line-height: 1.95;
          margin: 0 0 1.15rem;
          white-space: pre-line;
        }

        .wl-greeting-letter p.wl-greeting-sign {
          margin-top: 2rem;
          text-align: right;
          color: var(--wh-ink);
          font-weight: 700;
        }

        .wl-leader-card {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 2.25rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wl-leader-title {
          font-size: 1.15rem;
          color: var(--wh-ink);
          margin: 0 0 0.8rem;
        }

        .wl-leader-degree {
          color: var(--wh-ink);
          font-weight: 700;
          margin-bottom: 0.9rem;
        }

        .wl-leader-history {
          list-style: none;
          margin: 0 0 0.9rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .wl-leader-history li {
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.6;
          padding-left: 1rem;
          position: relative;
        }

        .wl-leader-history li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wl-leader-note {
          margin: 0;
          font-size: 0.85rem;
          color: var(--wh-stone);
        }

        .wl-board {
          padding: 4rem 0 5.5rem;
          background: var(--wh-bg);
        }

        .wl-board-card {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 2rem;
          align-items: center;
          padding: 2rem;
          background: var(--wh-bg-soft);
          border: 1px dashed var(--wh-line);
          border-radius: 12px;
        }

        .wl-board-logo-wrap {
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 10px;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .wl-board-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .wl-board-body p {
          color: var(--wh-ink-soft);
          margin-bottom: 0.9rem;
          font-size: 1rem;
        }

        .wl-board-soon {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--wh-stone);
          border: 1px solid var(--wh-line);
          border-radius: 999px;
          padding: 0.3rem 0.9rem;
        }

        .wl-partners {
          padding: 1rem 0 5.5rem;
          background: var(--wh-bg);
        }

        .wl-partners-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          padding: 1.75rem 2rem;
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          background: var(--wh-bg-soft);
        }

        .wl-partners-cta h2 {
          color: var(--wh-ink);
          font-size: 1.35rem;
          margin: 0 0 0.4rem;
        }

        .wl-partners-cta p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.98rem;
          line-height: 1.7;
          word-break: keep-all;
        }

        @media (max-width: 860px) {
          .wl-greeting {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }

          .wl-greeting-photo {
            position: static;
            max-width: 240px;
            margin: 0 auto;
          }

          .wl-greeting-letter p {
            font-size: 1rem;
          }

          .wl-leader-card {
            padding: 1.5rem;
          }

          .wl-board-card {
            grid-template-columns: 72px 1fr;
            padding: 1.5rem;
            gap: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default LeadershipPage;
