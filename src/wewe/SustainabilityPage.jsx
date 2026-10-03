import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Landmark,
  ShieldCheck,
  Users2,
  HelpingHand,
  HeartHandshake,
  Megaphone,
  Church,
  Gift,
  BadgePercent,
} from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import './wewe-shared.css';

// "소개" > "운영·지속가능성" 페이지 (/about/sustainability, 2026-10-03 신설).
// WEWE_2026_사업계획서 260930.pptx의 PART IV "운영 및 지속가능성"(슬라이드 29-34)을
// 담은 완전히 새로운 페이지입니다 — 법인 설립 방향, 선순환 구조, 재원 조성 계획(제안안),
// 추진 일정, 기대효과까지, 기존 어떤 페이지에도 해당 내용이 없어 새로 만들었습니다.
const FUNDING_SOURCES = [
  {
    icon: Users2,
    tag: '개인 정기후원',
    title: 'WE 멤버십',
    items: ['월 정기후원 멤버십', '후원자–선교사 연결 (WE+WE 커넥트)', '정기 소식 · 회복 스토리 발송'],
  },
  {
    icon: Church,
    tag: '교회 파트너십',
    title: '동역 교회',
    items: ['선교 · 구제 연계 후원', '유휴 공간 제공 (WEWE 스테이)', '목회자 추천 · 프로그램 공동 운영'],
  },
  {
    icon: HelpingHand,
    tag: '기업 · 브랜드 협업',
    title: '재능 · 현물 나눔',
    items: ['엘모즈 사례: 맞춤 정장 제작 협업', '숙박 · 모빌리티 · 의료 등 협업', '기업 사회공헌(ESG) 연계'],
  },
  {
    icon: Gift,
    tag: '프로젝트 모금',
    title: '목적형 캠페인',
    items: ['‘전투복 1벌’ 후원', '‘스테이 1박’ 후원', '연말 · 절기 특별 캠페인'],
  },
];

const TIMELINE_ROWS = [
  { label: '법인 · 조직', y2026: '임의단체 운영 · TFT 구성', h1: '사단법인 전환 준비 · 전환', h2: '' },
  { label: 'Refresh Pastor Academy', y2026: '세미나 · 소진관리', h1: '심포지엄 · 세미나', h2: '' },
  { label: '전투복 프로젝트', y2026: '1기–3기', h1: "정례화 · '1벌 후원' 캠페인", h2: '' },
  { label: 'WEWE 스테이', y2026: '리서치, 플랫폼 가오픈', h1: '플랫폼 오픈 · 파일럿', h2: '피드백 · 개선' },
  { label: '모빌리티 · Poiema · 커넥트', y2026: '', h1: '기획', h2: '시범 운영' },
];

const OUTCOME_GROUPS = [
  {
    tag: '목회자',
    items: ['사역의 연속성 확보, 리더십 위기 예방', '최신 목회 동향 등 전문성 강화', '소진관리를 통한 회복탄력성 강화'],
  },
  {
    tag: '선교사',
    items: ['안정적인 귀국 체류, 비용 부담 경감', '정서 · 영적 회복과 정체성 회복', '동료 · 교회와의 지지 체계'],
  },
  {
    tag: '교회',
    items: ['강단의 생명력 회복, 공동체 건강도 상승', '유휴 자산의 선교적 활용', '건강한 동역 모델 구축'],
  },
  {
    tag: '후원자 · 성도',
    items: ['구체적이고 투명한 섬김의 통로', '평신도 섬김의 기회 확대'],
  },
];

function SustainabilityPage() {
  return (
    <div className="wewe-page wewe-sustainability-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="SUSTAINABLE DIRECTION"
        title="운영 및 지속가능성"
        subtitle="법인화 · 선순환 구조 · 재원 조성 · 추진 일정 · 기대효과"
        images={HERO_IMAGE_SETS.sustainability}
      >
        <AboutSubNav active="/about/sustainability" />
      </WevePageHero>

      {/* 법인 설립 및 운영 방향 — 슬라이드 30 */}
      <section className="ws-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">LEGAL FOUNDATION</span>
            <h2 className="wh-h2-center">법인 설립 및 운영 방향</h2>
            <p className="ws-lead">한 교회의 사역을 넘어, 지속 가능한 돌봄 모델로.</p>
          </Reveal>

          <Reveal as="div" className="ws-limit-box" delay={60}>
            <strong>현재의 한계</strong>
            <p>지속적인 예산이 필요하고, 한 교회 규모로 진행할 경우 확장에 한계가 있습니다.</p>
          </Reveal>

          <div className="ws-stage-row">
            <Reveal as="div" className="ws-stage-card" delay={100}>
              <span className="ws-stage-no">1차</span>
              <h4>임의단체(임의법인)</h4>
              <p>조직 구성 · 사업 시범 운영</p>
            </Reveal>
            <Reveal as="div" className="ws-stage-arrow" delay={120}>
              <ArrowRight size={20} />
            </Reveal>
            <Reveal as="div" className="ws-stage-card" delay={140}>
              <span className="ws-stage-no">2차</span>
              <h4>사단법인 전환</h4>
              <p>법적 지위 · 기부금 신뢰 확보</p>
            </Reveal>
          </div>

          <div className="ws-foundation-grid">
            <Reveal as="div" className="ws-foundation-card" delay={100}>
              <span className="ws-foundation-icon"><Landmark size={20} /></span>
              <h4>법적 지위 확보</h4>
              <p>기부금 영수증 · 공신력 · 계약 주체로서의 지위</p>
            </Reveal>
            <Reveal as="div" className="ws-foundation-card" delay={140}>
              <span className="ws-foundation-icon"><Users2 size={20} /></span>
              <h4>조직의 체계화</h4>
              <p>다분야 전문가(목회 · 상담 · 의료 · 경영) 협업 구조</p>
            </Reveal>
            <Reveal as="div" className="ws-foundation-card" delay={180}>
              <span className="ws-foundation-icon"><ShieldCheck size={20} /></span>
              <h4>투명한 운영</h4>
              <p>정기 사업 · 재정 보고로 후원의 신뢰 확보</p>
            </Reveal>
          </div>

          <Reveal as="p" className="ws-callout" delay={100}>
            <Megaphone size={18} />
            <span><strong>모금 명분 (Why)</strong> — 레위인을 지키는 그리스도의 지체들. 사례 중심의 스토리와
              비영리 모금 전문업체 연계로 모금 명분을 구체화합니다.</span>
          </Reveal>
        </div>
      </section>

      {/* 선순환 구조 — 슬라이드 31 */}
      <section className="ws-section ws-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">VIRTUOUS CYCLE</span>
            <h2 className="wh-h2-center">선순환 구조</h2>
            <p className="ws-lead">후원이 회복을 낳고, 회복의 이야기가 다시 후원을 부릅니다.</p>
          </Reveal>

          <div className="ws-cycle">
            {[
              { no: '1', title: '후원', desc: '평신도 · 교회 · 기업이 ‘레위인을 지키는 지체’로 참여' },
              { no: '2', title: '돌봄', desc: 'Refresh Pastor Academy · Missionary Care의 전문적 케어' },
              { no: '3', title: '회복', desc: '강단의 생명력 회복, 선교 현장의 회복' },
              { no: '4', title: '이야기', desc: '회복 사례를 기록 · 공유하여 모금 명분을 구체화' },
            ].map((step, idx) => (
              <Reveal as="div" key={step.no} className="ws-cycle-card" delay={idx * 80}>
                <span className="ws-cycle-no">{step.no}</span>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 재원 조성 계획 — 슬라이드 32 */}
      <section className="ws-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">FUNDING PLAN</span>
            <h2 className="wh-h2-center">재원 조성 계획</h2>
            <p className="ws-lead">
              다양한 참여 방식으로 안정적 재원을 만듭니다
              <span className="ws-proposal-tag"><BadgePercent size={13} /> 제안안</span>
            </p>
          </Reveal>

          <div className="ws-funding-grid">
            {FUNDING_SOURCES.map((src, idx) => (
              <Reveal as="div" key={src.title} className="ws-funding-card" delay={idx * 80}>
                <span className="ws-funding-icon"><src.icon size={20} /></span>
                <span className="ws-funding-tag">{src.tag}</span>
                <h4>{src.title}</h4>
                <ul>
                  {src.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 추진 일정 — 슬라이드 33 */}
      <section className="ws-section ws-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">TIMELINE</span>
            <h2 className="wh-h2-center">추진 일정 (안)</h2>
            <p className="ws-lead">2026 하반기 ~ 2027</p>
          </Reveal>

          <Reveal as="div" className="ws-table-wrap" delay={80}>
            <table className="ws-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>2026</th>
                  <th>2027 상반기</th>
                  <th>2027 하반기</th>
                </tr>
              </thead>
              <tbody>
                {TIMELINE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>{row.y2026 || '—'}</td>
                    <td>{row.h1 || '—'}</td>
                    <td>{row.h2 || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <p className="ws-table-note">검정 : 진행 중 &nbsp;·&nbsp; 노랑 : 핵심 추진 &nbsp;·&nbsp; 회색 : 계획</p>
        </div>
      </section>

      {/* 기대효과 — 슬라이드 34 */}
      <section className="ws-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">EXPECTED OUTCOME</span>
            <h2 className="wh-h2-center">위로자가 회복되면, 공동체도 살아납니다</h2>
            <p className="ws-lead">지속 가능한 사역 동력 · 외부 네트워크의 자산화 · 건강한 동역 모델 구축</p>
          </Reveal>

          <div className="ws-outcome-grid">
            {OUTCOME_GROUPS.map((group, idx) => (
              <Reveal as="div" key={group.tag} className="ws-outcome-card" delay={idx * 70}>
                <span className="ws-outcome-icon"><HeartHandshake size={18} /></span>
                <h4>{group.tag}</h4>
                <ul>
                  {group.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="wa-cta">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>WEWE의 사역이 더 궁금하신가요?</h2>
            <p>레위인의 회복(목회자)과 선교사의 회복, 두 프로젝트를 자세히 소개합니다.</p>
          </div>
          <Link to="/about/ministries" className="wh-btn wh-btn-primary">
            사역 소개 보기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .ws-section {
          padding: 4.5rem 0;
          background: var(--wh-bg);
        }

        .ws-section-soft {
          background: var(--wh-bg-soft);
        }

        .ws-lead {
          text-align: center;
          color: var(--wh-ink-soft);
          font-size: 0.98rem;
          margin: 0 0 2.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .ws-proposal-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
        }

        .ws-limit-box {
          padding: 1.25rem 1.5rem;
          background: rgba(0, 0, 0, 0.03);
          border-left: 3px solid var(--wh-stone);
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .ws-limit-box strong {
          display: block;
          color: var(--wh-ink);
          margin-bottom: 0.35rem;
          font-size: 0.92rem;
        }

        .ws-limit-box p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .ws-stage-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .ws-stage-card {
          flex: 1;
          padding: 1.5rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-align: center;
        }

        .ws-stage-no {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--wh-orange-deep);
          margin-bottom: 0.5rem;
        }

        .ws-stage-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.4rem;
        }

        .ws-stage-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
        }

        .ws-stage-arrow {
          flex-shrink: 0;
          color: var(--wh-stone);
        }

        .ws-foundation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .ws-foundation-card {
          padding: 1.4rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .ws-foundation-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(20, 107, 113, 0.1);
          color: var(--wh-teal);
          margin-bottom: 0.75rem;
        }

        .ws-foundation-card h4 {
          color: var(--wh-ink);
          font-size: 0.98rem;
          margin-bottom: 0.4rem;
        }

        .ws-foundation-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
          line-height: 1.55;
        }

        .ws-callout {
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
          padding: 1.1rem 1.4rem;
          background: rgba(217, 123, 63, 0.08);
          border-radius: 10px;
          color: var(--wh-ink-soft);
          font-size: 0.9rem;
          line-height: 1.7;
          margin: 0;
        }

        .ws-callout svg {
          flex-shrink: 0;
          color: var(--wh-orange-deep);
          margin-top: 0.2rem;
        }

        .ws-callout strong {
          color: var(--wh-ink);
        }

        .ws-cycle {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .ws-cycle-card {
          padding: 1.5rem 1.25rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-align: center;
          position: relative;
        }

        .ws-cycle-no {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--wh-teal);
          color: #fff;
          font-weight: 800;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .ws-cycle-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.4rem;
        }

        .ws-cycle-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
          line-height: 1.55;
        }

        .ws-funding-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .ws-funding-card {
          padding: 1.5rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .ws-funding-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
          margin-bottom: 0.75rem;
        }

        .ws-funding-tag {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--wh-orange-deep);
          margin-bottom: 0.3rem;
        }

        .ws-funding-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.75rem;
        }

        .ws-funding-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .ws-funding-card li {
          color: var(--wh-ink-soft);
          font-size: 0.86rem;
          line-height: 1.55;
          padding-left: 0.9rem;
          position: relative;
        }

        .ws-funding-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.55rem;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .ws-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .ws-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          background: var(--wh-bg);
        }

        .ws-table th,
        .ws-table td {
          padding: 0.85rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--wh-line);
          white-space: nowrap;
        }

        .ws-table thead th {
          background: var(--wh-ink);
          color: #fff;
          font-weight: 700;
          white-space: nowrap;
        }

        .ws-table tbody th {
          color: var(--wh-ink);
          font-weight: 700;
          background: var(--wh-bg-soft);
        }

        .ws-table tbody td {
          color: var(--wh-ink-soft);
        }

        .ws-table tbody tr:last-child th,
        .ws-table tbody tr:last-child td {
          border-bottom: none;
        }

        .ws-outcome-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .ws-outcome-card {
          padding: 1.5rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .ws-outcome-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(20, 107, 113, 0.1);
          color: var(--wh-teal);
          margin-bottom: 0.75rem;
        }

        .ws-outcome-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.75rem;
        }

        .ws-outcome-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .ws-outcome-card li {
          color: var(--wh-ink-soft);
          font-size: 0.86rem;
          line-height: 1.55;
          padding-left: 0.9rem;
          position: relative;
        }

        .ws-outcome-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--wh-teal);
        }

        @media (max-width: 860px) {
          .ws-section {
            padding: 3.25rem 0;
          }

          .ws-stage-row {
            flex-direction: column;
          }

          .ws-stage-arrow {
            transform: rotate(90deg);
          }

          .ws-foundation-grid,
          .ws-cycle,
          .ws-funding-grid,
          .ws-outcome-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default SustainabilityPage;
