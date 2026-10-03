import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  HeartHandshake,
  Megaphone,
  Ruler,
  Scissors,
  Gift,
  MessageCircle,
} from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import './wewe-shared.css';

// "전투복 프로젝트" 상세 페이지 (/about/ministries/combat-uniform, 2026-10-03 신설).
// WEWE_2026_사업계획서 260930.pptx 슬라이드 16-20을 담았습니다. 기존 /about/ministries
// 페이지에는 "개별 지원" 프로그램의 한 줄짜리 카드로만 소개되어 있던 전투복 프로젝트를,
// PPT에 있는 만큼의 깊이(개요 · 왜 전투복인가 · 운영구조 · 진행프로세스 · 성과관리/확장
// 로드맵)로 다루기 위해 별도 페이지로 분리했습니다.
const WHY_CARDS = [
  {
    tag: 'HONOR',
    ko: '존중',
    desc: '보이지 않는 수고를 공동체가 기억하며, 늘 주기만 하던 이들이 ‘받는’ 경험을 통해 위로를 받습니다.',
  },
  {
    tag: 'SUPPORT',
    ko: '지지',
    desc: '모세의 팔을 붙든 아론과 훌처럼, 성도와 후원자가 한 사람의 사역자를 곁에서 붙듭니다.',
  },
  {
    tag: 'MISSION',
    ko: '사명',
    desc: '하나님의 전신갑주를 입고 다시 강단과 현장에 서는 힘을 회복합니다. 레위인을 섬기는 것이 성도의 사명임을 기억하게 합니다.',
  },
];

const OPERATION_FLOW = [
  { no: '①', title: '후원 · 추천', by: '후원자 · 교회', desc: "'전투복 1벌' 후원 참여, 목회자 추천" },
  { no: '②', title: '제작 의뢰', by: 'WEWE', desc: '기획 · 모집 · 선정 · 모금' },
  { no: '③', title: '맞춤 제작', by: '엘모즈', desc: '치수 측정 · 가봉, 맞춤 정장 제작(재능 나눔)' },
  { no: '④', title: '감사 · 스토리', by: '목회자', desc: '맞춤 정장 수령, 세미나 · 소진관리 프로그램 연계' },
  { no: '⑤', title: '선순환', by: 'WEWE', desc: '전달식 운영 · 후속 케어 연계, 다음 기수 후원으로 선순환' },
];

const PROCESS_STEPS = [
  { icon: Megaphone, title: '모집', desc: '인스타그램 카드뉴스, 기독 콘텐츠 채널 협업 홍보' },
  { icon: MessageCircle, title: '선정', desc: '사연 검토 및 심사, 대상자 개별 연락' },
  { icon: Ruler, title: '만남 · 채촌', desc: '엘모즈 매장 방문, 체형과 사역 스타일 상담' },
  { icon: Scissors, title: '제작', desc: '비스포크 공정으로 한 벌씩 맞춤 제작' },
  { icon: Gift, title: '전달 · 축복', desc: '전달식과 함께 기도하고 축복하는 시간' },
  { icon: HeartHandshake, title: '스토리 · 연결', desc: '동의 하에 이야기 공유, 후원자 · 후속 프로그램 연결' },
];

const KPI = [
  { label: '지원 · 추천 수', value: '17' },
  { label: '수혜 목회자 수', value: '1' },
  { label: '수혜자 만족도', value: '– / 5.0' },
  { label: '후속 참여율', value: '–' },
];

const ROADMAP = [
  { stage: 'STAGE 1', title: '파일럿', when: '2026 하반기', items: ['1기 모집 · 선정 · 제작', '운영 매뉴얼 정리', '수혜 스토리 기록'] },
  { stage: 'STAGE 2', title: '정례화', when: '2027', items: ["2개월 1회 진행", "'전투복 1벌 후원' 정기 캠페인", '교회 단위 추천 파트너십'] },
  { stage: 'STAGE 3', title: '확장', when: '2028~', items: ['인원 확장', '선교사 대상으로 확대', '지역별 전달식 · 모임'] },
];

function CombatUniformPage() {
  return (
    <div className="wewe-page wewe-combat-uniform-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="04 · 전투복 프로젝트 (진행 중)"
        title="전투복 프로젝트"
        subtitle="비스포크 테일러링 브랜드 엘모즈와 함께하는 목회자 존중, 회복 캠페인"
        images={HERO_IMAGE_SETS.combatUniform}
      />

      <div className="wh-container wh-container-narrow wcu-breadcrumb">
        <Link to="/about/ministries"><ArrowLeft size={14} /> 사역 소개로 돌아가기</Link>
      </div>

      {/* 개요 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <blockquote className="wm-prologue">
              목회자에게 정장은 매 주일 강단에 서는 &lsquo;전투복&rsquo;입니다. 그 옷을 지어 드림으로 아론과
              훌이 모세의 팔을 붙들어 올렸듯, 우리는 지친 목회자의 팔을 곁에서 받쳐 드리고자 합니다.
            </blockquote>
            <p className="wcu-related">연결 사업 — Refresh Pastor Academy · 개별 지원</p>
          </Reveal>

          <div className="wcu-overview-grid">
            <Reveal as="div" className="wcu-overview-card" delay={60}>
              <span className="wcu-overview-tag">WHAT</span>
              <p>목회자의 체형과 사역에 맞춘 맞춤 정장(전투복)을 제작 · 전달합니다.</p>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={100}>
              <span className="wcu-overview-tag">WHY</span>
              <p>평생 주기만 해온 목회자가 &lsquo;받는 자리&rsquo;에 서는 경험 — 존중, 회복, 그리고 다시 현장으로의
                파송.</p>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={140}>
              <span className="wcu-overview-tag">WITH</span>
              <p>국내 1위 비스포크 테일러링 브랜드 엘모즈와 채촌부터 제작까지 전문 협업합니다.</p>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={180}>
              <span className="wcu-overview-tag">STATUS</span>
              <p>1~2개월에 1회, 기수별로 진행 중입니다. <span className="wh-progress-badge">진행 중</span></p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 왜 전투복인가 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">WHY 'COMBAT UNIFORM'</span>
            <h2 className="wh-h2-center">왜 &lsquo;전투복&rsquo;인가</h2>
            <p className="wcu-lead">한 벌의 옷에 담긴 세 가지 의미</p>
          </Reveal>

          <div className="wcu-why-grid">
            {WHY_CARDS.map((card, idx) => (
              <Reveal as="div" key={card.tag} className="wcu-why-card" delay={idx * 80}>
                <span className="wcu-why-tag">{card.tag}</span>
                <h4>{card.ko}</h4>
                <p>{card.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal as="p" className="wcu-quote" delay={100}>
            &ldquo;목사님, 뒤에는 저희가 있습니다.&rdquo; 전투복은 선물이기 이전에, 공동체가 건네는 응원이자
            사명의 길입니다.
          </Reveal>
        </div>
      </section>

      {/* 운영 구조 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">HOW IT WORKS</span>
            <h2 className="wh-h2-center">운영 구조</h2>
            <p className="wcu-lead">후원자 · WEWE · 엘모즈 · 목회자가 함께 만드는 한 벌</p>
          </Reveal>

          <div className="wcu-flow">
            {OPERATION_FLOW.map((step, idx) => (
              <Reveal as="div" key={step.no} className="wcu-flow-card" delay={idx * 70}>
                <span className="wcu-flow-no">{step.no}</span>
                <span className="wcu-flow-by">{step.by}</span>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 진행 프로세스 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">PROCESS</span>
            <h2 className="wh-h2-center">진행 프로세스</h2>
            <p className="wcu-lead">모집부터 후속 케어까지 6단계</p>
          </Reveal>

          <div className="wcu-process-grid">
            {PROCESS_STEPS.map((step, idx) => (
              <Reveal as="div" key={step.title} className="wcu-process-card" delay={idx * 60}>
                <span className="wcu-process-icon"><step.icon size={20} /></span>
                <div>
                  <h4>STEP {idx + 1} · {step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal as="div" className="wcu-note-box" delay={100}>
            <strong>운영 포인트</strong>
            <ul>
              <li>수혜 목회자의 개인정보와 사연은 사전 동의 범위 내에서만 공개합니다.</li>
              <li>전달식은 &lsquo;선물 전달&rsquo;이 아닌 &lsquo;축복과 파송&rsquo;의 예배로 기획하여 프로젝트의
                의미를 완성합니다.</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 성과관리 & 확장 계획 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">GROWTH ROADMAP</span>
            <h2 className="wh-h2-center">성과관리 &amp; 확장 계획</h2>
            <p className="wcu-lead">1기 파일럿을 정례 캠페인으로</p>
          </Reveal>

          <Reveal as="div" className="wcu-kpi-grid" delay={60}>
            {KPI.map((k) => (
              <div className="wcu-kpi-card" key={k.label}>
                <span className="wcu-kpi-value">{k.value}</span>
                <span className="wcu-kpi-label">{k.label}</span>
              </div>
            ))}
          </Reveal>

          <div className="wcu-roadmap">
            {ROADMAP.map((stage, idx) => (
              <Reveal as="div" key={stage.stage} className="wcu-roadmap-card" delay={idx * 80}>
                <span className="wcu-roadmap-stage">{stage.stage}</span>
                <h4>{stage.title}</h4>
                <span className="wcu-roadmap-when">{stage.when}</span>
                <ul>
                  {stage.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="wa-cta">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>목회자 돌봄 사역이 더 궁금하신가요?</h2>
            <p>Refresh Pastor Academy의 전체 프로그램을 소개합니다.</p>
          </div>
          <Link to="/about/ministries" className="wh-btn wh-btn-primary">
            사역 소개로 돌아가기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wcu-related {
          color: var(--wh-stone);
          font-size: 0.85rem;
          margin: 0 0 2rem;
        }

        .wcu-why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .wcu-why-card {
          padding: 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-align: center;
        }

        .wcu-why-tag {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--wh-teal);
          margin-bottom: 0.5rem;
        }

        .wcu-why-card h4 {
          color: var(--wh-ink);
          font-size: 1.1rem;
          margin-bottom: 0.6rem;
        }

        .wcu-why-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .wcu-quote {
          text-align: center;
          font-style: italic;
          font-weight: 600;
          color: var(--wh-ink);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.8;
        }

        .wcu-flow {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.85rem;
        }

        .wcu-flow-card {
          padding: 1.25rem 1rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-align: center;
        }

        .wcu-flow-no {
          display: block;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--wh-orange);
          margin-bottom: 0.3rem;
        }

        .wcu-flow-by {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--wh-stone);
          margin-bottom: 0.4rem;
        }

        .wcu-flow-card h4 {
          color: var(--wh-ink);
          font-size: 0.92rem;
          margin-bottom: 0.4rem;
        }

        .wcu-flow-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .wcu-process-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .wcu-process-card {
          display: flex;
          gap: 0.9rem;
          align-items: flex-start;
          padding: 1.25rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wcu-process-icon {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wcu-process-card h4 {
          color: var(--wh-ink);
          font-size: 0.92rem;
          margin-bottom: 0.3rem;
        }

        .wcu-process-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
          line-height: 1.55;
        }

        .wcu-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .wcu-kpi-card {
          padding: 1.5rem 1rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-align: center;
        }

        .wcu-kpi-value {
          display: block;
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--wh-orange-deep);
          font-variant-numeric: tabular-nums;
          margin-bottom: 0.3rem;
        }

        .wcu-kpi-label {
          font-size: 0.8rem;
          color: var(--wh-stone);
        }

        .wcu-roadmap {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .wcu-roadmap-card {
          padding: 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wcu-roadmap-stage {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--wh-teal);
          margin-bottom: 0.4rem;
        }

        .wcu-roadmap-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.2rem;
        }

        .wcu-roadmap-when {
          display: block;
          font-size: 0.78rem;
          color: var(--wh-stone);
          margin-bottom: 0.9rem;
        }

        .wcu-roadmap-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .wcu-roadmap-card li {
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
          line-height: 1.55;
          padding-left: 0.9rem;
          position: relative;
        }

        .wcu-roadmap-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        @media (max-width: 860px) {
          .wcu-why-grid,
          .wcu-process-grid,
          .wcu-roadmap {
            grid-template-columns: 1fr;
          }

          .wcu-flow {
            grid-template-columns: 1fr 1fr;
          }

          .wcu-kpi-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default CombatUniformPage;
