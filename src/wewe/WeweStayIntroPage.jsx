import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Users,
  Home,
  ShieldCheck,
  Lock,
  FileText,
  Car,
  Heart,
  KeyRound,
  FileBarChart,
} from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import './wewe-shared.css';

// "WEWE 스테이 소개" 상세 페이지 (/about/ministries/wewe-stay, 2026-10-03 신설).
// WEWE_2026_사업계획서 260930.pptx 슬라이드 24-28을 담았습니다. 실제 예약·검색이
// 이루어지는 플랫폼(/stay)과는 별개로, "왜·어떻게 WEWE 스테이가 만들어졌는가"를
// 소개하는 스토리 페이지입니다 — 페이지 끝에서 실제 플랫폼(/stay)으로 안내합니다.
const SERVICE_MODEL = [
  {
    icon: Building2,
    tag: 'HOST · 공급',
    title: '교회 · 성도',
    items: ['교회 선교관 · 비어 있는 사택', '수련원 · 게스트룸 등 유휴 숙소', '성도 개인의 빈집 · 세컨드하우스'],
    value: '유휴 자산이 선교 동역의 통로가 되고, 선교사와 직접 교제할 기회',
  },
  {
    icon: Home,
    tag: 'WEWE PLATFORM',
    title: 'WEWE 스테이',
    items: ['숙소 등록 · 현장 확인 (신뢰 검증)', '선교사 신청 · 파송교회 추천 확인', '매칭 · 예약 · 이용 가이드', '웰컴키트 · 체류 중 돌봄 연계', '이용 후기 · 호스트 결과 리포트'],
    value: '공간 · 사람 · 돌봄 데이터가 쌓이며 Missionary Care 전 프로그램의 허브로 성장',
    highlight: true,
  },
  {
    icon: Users,
    tag: 'GUEST · 이용',
    title: '단기 귀국 선교사',
    items: ['안식년 · 단기 귀국 선교사', '선교사 가정 (자녀 동반)', '치료 · 검진 목적 체류'],
    value: '비용 부담 없이 안심하고 머무는 ‘집’ 같은 쉼과 환대',
  },
];

const MISSIONARY_JOURNEY = [
  { no: 1, title: '이용 신청', desc: '귀국 일정 · 가족 수' },
  { no: 2, title: '자격 확인', desc: '파송단체 · 교회 확인' },
  { no: 3, title: '매칭 제안', desc: '지역 · 기간 맞춤' },
  { no: 4, title: '입실 · 환대', desc: '웰컴 키트 제공' },
  { no: 5, title: '퇴실 · 후기', desc: '감사와 피드백' },
];

const HOST_JOURNEY = [
  { no: 1, title: '숙소 등록', desc: '공간 · 가능 기간' },
  { no: 2, title: '현장 확인', desc: '안전 · 위생 점검' },
  { no: 3, title: '규정 합의', desc: '비용 · 이용 원칙' },
  { no: 4, title: '게스트 맞이', desc: '환대와 교제' },
  { no: 5, title: '감사 리포트', desc: '섬김의 열매 공유' },
];

const ROADMAP = [
  { no: '01', title: 'TFT 구성', items: ['킥오프 모임', '전문가 · 기획자 참여'], done: true },
  { no: '02', title: '리서치 및 개발', items: ['실제 필요 및 장소 리서치', '플랫폼 운영 기획'], done: true },
  { no: '03', title: '플랫폼 시행', items: ['플랫폼 오픈', '파일럿 숙소 운영'], done: true },
  { no: '04', title: '피드백 · 모빌리티', items: ['피드백 기반 개선', '모빌리티 진행 기획', '사단법인 전환'], done: false },
  { no: '05', title: 'WEWE 스테이 설립', items: ['직영 스테이 설립 기획', '검증된 수요 기반 확장'], done: false },
];

const RISKS = [
  { icon: ShieldCheck, title: '안전 · 검증', desc: '호스트 공간은 현장 확인 후 등록하고, 게스트는 파송단체 · 교회를 통해 확인합니다.' },
  { icon: Lock, title: '선교사 정보 보호', desc: '보안 지역 선교사의 신상 · 사역지 정보는 비공개를 원칙으로 하며, 최소한의 정보만 공유합니다.' },
  { icon: FileText, title: '표준 이용 규정', desc: '이용 기간, 청소 · 관리, 비용(무상/실비) 원칙을 사전에 합의해 서로의 부담을 줄입니다.' },
  { icon: Car, title: '모빌리티 연계', desc: '숙소 이용과 함께 병원 진료 · 교회 방문을 위한 차량 공유를 단계적으로 연결합니다.' },
  { icon: Heart, title: '환대', desc: '단순 숙박이 아닌 교제의 기회로, 호스트 성도를 통한 환대를 경험하도록 합니다.' },
  { icon: FileBarChart, title: '투명한 보고', desc: '이용 현황과 이야기를 호스트 · 후원자에게 정기적으로 공유합니다.' },
];

function WeweStayIntroPage() {
  return (
    <div className="wewe-page wewe-stay-intro-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="06 · WEWE 스테이 (진행 중)"
        title="WEWE 스테이"
        subtitle="비어 있는 공간이, 지친 선교사의 쉼이 됩니다"
        images={HERO_IMAGE_SETS.weweStayIntro}
      />

      <div className="wh-container wh-container-narrow wcu-breadcrumb">
        <Link to="/about/ministries"><ArrowLeft size={14} /> 사역 소개로 돌아가기</Link>
      </div>

      {/* 개요: PROBLEM / SOLUTION / VALUE */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <p className="wsi-asset-line">Asset-Sharing MVP — 새 건물을 짓기 전에, 이미 있는 공간을 먼저
              연결합니다. 작게 시작해 검증하고, 검증된 수요 위에 WEWE 스테이 직영 공간을 세웁니다.</p>
          </Reveal>

          <div className="wcu-overview-grid">
            <Reveal as="div" className="wcu-overview-card" delay={60}>
              <span className="wcu-overview-tag">PROBLEM · 문제</span>
              <ul className="wsi-mini-list">
                <li>단기 귀국 선교사에게 머물 곳이 없음</li>
                <li>친척 · 지인 집을 전전하며 오히려 소진</li>
                <li>한국의 높은 숙박 비용</li>
              </ul>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={100}>
              <span className="wcu-overview-tag">SOLUTION · 해결</span>
              <ul className="wsi-mini-list">
                <li>교회의 선교관 · 사택 · 유휴 숙소를 발굴</li>
                <li>쉼이 필요한 선교사와 연결하는 자산 공유 플랫폼</li>
                <li>노코드 웹 기반 MVP로 빠르게 검증</li>
              </ul>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={140}>
              <span className="wcu-overview-tag">VALUE · 가치</span>
              <ul className="wsi-mini-list">
                <li>선교사: 안심하고 머무는 &lsquo;집&rsquo; 같은 쉼</li>
                <li>교회: 유휴 자산이 선교 동역의 통로로</li>
                <li>공동체: 환대를 통한 선교사–교회 재연결</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 서비스 모델 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">SERVICE MODEL</span>
            <h2 className="wh-h2-center">서비스 모델</h2>
            <p className="wcu-lead">공간을 가진 성도(Host)와 쉼이 필요한 선교사(Guest)를 잇는 플랫폼</p>
          </Reveal>

          <div className="wsi-model-grid">
            {SERVICE_MODEL.map((m, idx) => (
              <Reveal
                as="div"
                key={m.title}
                className={`wsi-model-card${m.highlight ? ' wsi-model-card-highlight' : ''}`}
                delay={idx * 80}
              >
                <span className="wsi-model-icon"><m.icon size={20} /></span>
                <span className="wsi-model-tag">{m.tag}</span>
                <h4>{m.title}</h4>
                <ul>
                  {m.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
                <p className="wsi-model-value"><strong>얻는 가치</strong> {m.value}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 프로세스 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">JOURNEY</span>
            <h2 className="wh-h2-center">이용 프로세스</h2>
            <p className="wcu-lead">선교사와 호스트 모두가 안심할 수 있는 단계별 절차</p>
          </Reveal>

          <div className="wsi-journey-block">
            <h4 className="wsi-journey-title">선교사 JOURNEY</h4>
            <div className="wsi-journey-row">
              {MISSIONARY_JOURNEY.map((step, idx) => (
                <Reveal as="div" key={step.no} className="wsi-journey-card" delay={idx * 60}>
                  <span className="wsi-journey-no">{step.no}</span>
                  <h5>{step.title}</h5>
                  <p>{step.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="wsi-journey-block">
            <h4 className="wsi-journey-title">호스트 JOURNEY</h4>
            <div className="wsi-journey-row">
              {HOST_JOURNEY.map((step, idx) => (
                <Reveal as="div" key={step.no} className="wsi-journey-card wsi-journey-card-host" delay={idx * 60}>
                  <span className="wsi-journey-no">{step.no}</span>
                  <h5>{step.title}</h5>
                  <p>{step.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal as="div" className="wcu-note-box" delay={100}>
            <strong><KeyRound size={16} /> 환대 키트</strong>
            <p className="wsi-kit-desc">
              웰컴 카드와 호스트 교회의 편지 · 기본 식료품과 생활용품 · 주변 병원 · 교통 안내 · WE+WE 커넥트
              초대장
            </p>
          </Reveal>
        </div>
      </section>

      {/* 단계별 추진 로드맵 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">ACTION PLAN</span>
            <h2 className="wh-h2-center">단계별 추진 로드맵</h2>
            <p className="wcu-lead">1차 Action Plan — 플랫폼에서 직영 스테이까지</p>
          </Reveal>

          <div className="wsi-roadmap">
            {ROADMAP.map((stage, idx) => (
              <Reveal
                as="div"
                key={stage.no}
                className={`wsi-roadmap-card${stage.done ? ' wsi-roadmap-card-done' : ''}`}
                delay={idx * 70}
              >
                <span className="wsi-roadmap-no">{stage.no}</span>
                <h4>{stage.title}</h4>
                <ul>
                  {stage.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
          <p className="ws-table-note">■ 완료 · 진행 중 &nbsp;&nbsp;□ 예정</p>
        </div>
      </section>

      {/* 리스크 & 대응 방안 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">RISK & RESPONSE</span>
            <h2 className="wh-h2-center">리스크 &amp; 대응 방안</h2>
            <p className="wcu-lead">신뢰와 안전이 플랫폼의 가장 중요한 자산입니다</p>
          </Reveal>

          <div className="wsi-risk-grid">
            {RISKS.map((risk, idx) => (
              <Reveal as="div" key={risk.title} className="wsi-risk-card" delay={idx * 60}>
                <span className="wsi-risk-icon"><risk.icon size={18} /></span>
                <h4>{risk.title}</h4>
                <p>{risk.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="wa-cta wa-cta-alt">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>지금 바로 WEWE 스테이를 이용해보세요</h2>
            <p>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼이 이미 운영 중입니다.</p>
          </div>
          <a href="/stay" className="wh-btn wh-btn-outline">
            WEWE 스테이 바로가기 <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wsi-asset-line {
          text-align: center;
          color: var(--wh-ink-soft);
          font-size: 0.92rem;
          line-height: 1.75;
          max-width: 640px;
          margin: 0 auto 2.5rem;
        }

        .wsi-mini-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .wsi-mini-list li {
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.55;
          padding-left: 0.9rem;
          position: relative;
        }

        .wsi-mini-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wsi-model-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          align-items: stretch;
        }

        .wsi-model-card {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wsi-model-card-highlight {
          background: var(--wh-ink);
          border-color: var(--wh-ink);
        }

        .wsi-model-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
          margin-bottom: 0.9rem;
        }

        .wsi-model-card-highlight .wsi-model-icon {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .wsi-model-tag {
          display: block;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--wh-teal);
          margin-bottom: 0.3rem;
        }

        .wsi-model-card-highlight .wsi-model-tag {
          color: rgba(255, 255, 255, 0.65);
        }

        .wsi-model-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.9rem;
        }

        .wsi-model-card-highlight h4 {
          color: #fff;
        }

        .wsi-model-card ul {
          margin: 0 0 1.1rem;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
        }

        .wsi-model-card li {
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
          line-height: 1.5;
          padding-left: 0.85rem;
          position: relative;
        }

        .wsi-model-card-highlight li {
          color: rgba(255, 255, 255, 0.78);
        }

        .wsi-model-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wsi-model-card-highlight li::before {
          background: var(--wh-orange);
        }

        .wsi-model-value {
          margin: 0;
          padding-top: 0.9rem;
          border-top: 1px solid var(--wh-line);
          font-size: 0.8rem;
          color: var(--wh-ink-soft);
          line-height: 1.55;
        }

        .wsi-model-card-highlight .wsi-model-value {
          border-top-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.7);
        }

        .wsi-model-value strong {
          display: block;
          color: var(--wh-ink);
          margin-bottom: 0.3rem;
          font-size: 0.78rem;
        }

        .wsi-model-card-highlight .wsi-model-value strong {
          color: #fff;
        }

        .wsi-journey-block {
          margin-bottom: 2.5rem;
        }

        .wsi-journey-title {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--wh-ink);
          margin-bottom: 1rem;
        }

        .wsi-journey-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
        }

        .wsi-journey-card {
          padding: 1.1rem 0.9rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-top: 3px solid var(--wh-teal);
          border-radius: 8px;
          text-align: center;
        }

        .wsi-journey-card-host {
          border-top-color: var(--wh-orange);
        }

        .wsi-journey-no {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--wh-teal);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .wsi-journey-card-host .wsi-journey-no {
          background: var(--wh-orange);
        }

        .wsi-journey-card h5 {
          margin: 0 0 0.3rem;
          font-size: 0.85rem;
          color: var(--wh-ink);
        }

        .wsi-journey-card p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--wh-ink-soft);
          line-height: 1.4;
        }

        .wsi-kit-desc {
          margin: 0.5rem 0 0;
          color: var(--wh-ink-soft);
          font-size: 0.86rem;
          line-height: 1.6;
        }

        .wsi-roadmap {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.85rem;
        }

        .wsi-roadmap-card {
          padding: 1.25rem 1rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          opacity: 0.6;
        }

        .wsi-roadmap-card-done {
          opacity: 1;
          border-color: var(--wh-teal);
        }

        .wsi-roadmap-no {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--wh-stone);
          margin-bottom: 0.4rem;
        }

        .wsi-roadmap-card-done .wsi-roadmap-no {
          color: var(--wh-teal);
        }

        .wsi-roadmap-card h4 {
          color: var(--wh-ink);
          font-size: 0.9rem;
          margin-bottom: 0.6rem;
        }

        .wsi-roadmap-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .wsi-roadmap-card li {
          color: var(--wh-ink-soft);
          font-size: 0.76rem;
          line-height: 1.45;
        }

        .wsi-risk-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .wsi-risk-card {
          padding: 1.4rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wsi-risk-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(20, 107, 113, 0.1);
          color: var(--wh-teal);
          margin-bottom: 0.75rem;
        }

        .wsi-risk-card h4 {
          color: var(--wh-ink);
          font-size: 0.95rem;
          margin-bottom: 0.4rem;
        }

        .wsi-risk-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.84rem;
          line-height: 1.6;
        }

        @media (max-width: 860px) {
          .wsi-model-grid,
          .wsi-risk-grid {
            grid-template-columns: 1fr;
          }

          .wsi-journey-row {
            grid-template-columns: 1fr 1fr;
          }

          .wsi-roadmap {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweStayIntroPage;
