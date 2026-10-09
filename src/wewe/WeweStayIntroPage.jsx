import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
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
import { EditableText } from '../edit/EditMode';

// "WEWE 스테이 소개" 상세 페이지 (/about/ministries/wewe-stay, 2026-10-03 신설).
// WEWE_2026_사업계획서 260930.pptx 슬라이드 24-28을 담았습니다. 실제 예약·검색이
// 이루어지는 플랫폼(/stay)과는 별개로, "왜·어떻게 WEWE 스테이가 만들어졌는가"를
// 소개하는 스토리 페이지입니다 — 페이지 끝에서 실제 플랫폼(/stay)으로 안내합니다.
//
// (2026-10-07 개편) 전투복 프로젝트 페이지(CombatUniformPage)와 같은 기준으로 다듬었습니다.
// - 첫 섹션에 제목("프로젝트 개요") 추가, Asset-Sharing MVP 문구를 강조 인용 박스로 변경.
// - 상단 슬라이드를 "머물 곳·집" 테마 사진으로 교체하고, 섹션마다 배너 사진 추가
//   (.wh-section-banner — Refresh Pastor Academy 배너와 같은 크기). 환대 키트에는 사진 카드.
// - 글씨 크기·굵기·줄간격을 사역 소개 페이지 기준으로 키우고(본문 0.95~0.98rem / 1.75~1.8,
//   카드 제목 1.05rem 이상 굵게), 한국어 단어가 줄 끝에서 쪼개지지 않도록 keep-all 적용.
const unsplash = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const SECTION_PHOTOS = {
  overview: unsplash('1766431066492-9bec8410a57b'), // 깔끔하게 정돈된 아늑한 침실
  model: unsplash('1733244766159-f58f4184fd38'), // 집 열쇠를 건네는 손 — 호스트와 게스트를 잇다
  journey: unsplash('1760095435041-3957a2fa220e'), // 방 안에 펼쳐 둔 여행 가방 — 도착과 쉼
  kit: unsplash('1769286145156-70a40fff80ec', 700), // 리본으로 묶은 선물 상자 — 환대 키트
  roadmap: unsplash('1781888688940-5730c3fd5baf'), // 책상 위 건축 설계도 — 직영 스테이까지
  risk: unsplash('1493859923015-f05bc8960fa0'), // 창으로 햇살이 드는 따뜻한 거실 — 안심하고 머무는 집
};

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

const WELCOME_KIT = ['웰컴 카드와 호스트 교회의 편지', '기본 식료품과 생활용품', '주변 병원 · 교통 안내', 'WE+WE 커넥트 초대장'];

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
            <EditableText id={"OVERVIEW"} as="span" className="wh-eyebrow wh-eyebrow-center">OVERVIEW</EditableText>
            <EditableText id={"프로젝트 개요"} as="h2" className="wh-h2-center">프로젝트 개요</EditableText>
            <EditableText id={"유휴 공간을 선교사의 쉼으로 잇는 자산 공유 플랫폼"} className="wcu-lead">유휴 공간을 선교사의 쉼으로 잇는 자산 공유 플랫폼</EditableText>
          </Reveal>

          <Reveal as="blockquote" className="wsi-intro-quote" delay={40}>
            <EditableText id={"새 건물을 짓기 전에, 이미 있는 공간을 먼저 연결합니다. 작게 시작해 검증하고, 검증된 수요 위에 WEWE"}>
              새 건물을 짓기 전에, 이미 있는 공간을 먼저 연결합니다. 작게 시작해 검증하고, 검증된 수요 위에
              WEWE 스테이 직영 공간을 세웁니다.
            </EditableText>
            <cite>Asset-Sharing MVP</cite>
          </Reveal>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.overview})` }}
            role="img"
            aria-label="깔끔하게 정돈된 아늑한 침실"
            delay={60}
          />

          <div className="wsi-overview-grid">
            <Reveal as="div" className="wcu-overview-card wsi-overview-card" delay={60}>
              <span className="wcu-overview-tag">PROBLEM · 문제</span>
              <ul className="wsi-mini-list">
                <li>단기 귀국 선교사에게 머물 곳이 없음</li>
                <li>친척 · 지인 집을 전전하며 오히려 소진</li>
                <li>한국의 높은 숙박 비용</li>
              </ul>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card wsi-overview-card" delay={100}>
              <span className="wcu-overview-tag">SOLUTION · 해결</span>
              <ul className="wsi-mini-list">
                <li>교회의 선교관 · 사택 · 유휴 숙소를 발굴</li>
                <li>쉼이 필요한 선교사와 연결하는 자산 공유 플랫폼</li>
                <li>노코드 웹 기반 MVP로 빠르게 검증</li>
              </ul>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card wsi-overview-card" delay={140}>
              <span className="wcu-overview-tag">VALUE · 가치</span>
              <ul className="wsi-mini-list">
                <li><strong>선교사</strong> 안심하고 머무는 &lsquo;집&rsquo; 같은 쉼</li>
                <li><strong>교회</strong> 유휴 자산이 선교 동역의 통로로</li>
                <li><strong>공동체</strong> 환대를 통한 선교사–교회 재연결</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 서비스 모델 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"SERVICE MODEL"} as="span" className="wh-eyebrow wh-eyebrow-center">SERVICE MODEL</EditableText>
            <EditableText id={"서비스 모델"} as="h2" className="wh-h2-center">서비스 모델</EditableText>
            <EditableText id={"공간을 가진 성도(Host)와 쉼이 필요한 선교사(Guest)를 잇는 플랫폼"} className="wcu-lead">공간을 가진 성도(Host)와 쉼이 필요한 선교사(Guest)를 잇는 플랫폼</EditableText>
          </Reveal>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.model})`, backgroundPosition: 'center 40%' }}
            role="img"
            aria-label="집 열쇠를 건네는 손"
            delay={40}
          />

          {/* (2026-10-08) 공급 → 플랫폼 → 이용 순서로 위에서 아래로 쌓고, 가운데(플랫폼)만 검은색이던
              카드를 세 카드 모두 같은 색으로 통일했습니다. 카드 사이 화살표로 흐름을 보여줍니다. */}
          <div className="wsi-model-list">
            {SERVICE_MODEL.map((m, idx) => (
              <React.Fragment key={m.title}>
                {idx > 0 && (
                  <div className="wsi-model-arrow" aria-hidden="true"><ArrowDown size={20} /></div>
                )}
                <Reveal as="div" className="wsi-model-card" delay={idx * 80}>
                  <div className="wsi-model-head">
                    <span className="wsi-model-icon"><m.icon size={22} /></span>
                    <div>
                      <span className="wsi-model-tag">{m.tag}</span>
                      <h4>{m.title}</h4>
                    </div>
                  </div>
                  <ul>
                    {m.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                  <p className="wsi-model-value"><strong>얻는 가치</strong> {m.value}</p>
                </Reveal>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 프로세스 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"JOURNEY"} as="span" className="wh-eyebrow wh-eyebrow-center">JOURNEY</EditableText>
            <EditableText id={"이용 프로세스"} as="h2" className="wh-h2-center">이용 프로세스</EditableText>
            <EditableText id={"선교사와 호스트 모두가 안심할 수 있는 단계별 절차"} className="wcu-lead">선교사와 호스트 모두가 안심할 수 있는 단계별 절차</EditableText>
          </Reveal>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.journey})` }}
            role="img"
            aria-label="방 안에 펼쳐 둔 여행 가방"
            delay={40}
          />

          <div className="wsi-journey-block">
            <h4 className="wsi-journey-title"><span className="wsi-journey-dot" />선교사 JOURNEY</h4>
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
            <h4 className="wsi-journey-title"><span className="wsi-journey-dot wsi-journey-dot-host" />호스트 JOURNEY</h4>
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

          {/* 환대 키트 — 왼쪽 사진 + 오른쪽 구성 목록 */}
          <Reveal as="div" className="wsi-kit-card" delay={100}>
            <div
              className="wsi-kit-photo"
              style={{ backgroundImage: `url(${SECTION_PHOTOS.kit})` }}
              role="img"
              aria-label="리본으로 묶은 선물 상자"
            />
            <div className="wsi-kit-body">
              <span className="wsi-kit-label"><KeyRound size={16} /> 환대 키트</span>
              <EditableText id={"입실하는 날, 문 앞에서 건네는 환영"} as="h4">입실하는 날, 문 앞에서 건네는 환영</EditableText>
              <ul>
                {WELCOME_KIT.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 단계별 추진 로드맵 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"ACTION PLAN"} as="span" className="wh-eyebrow wh-eyebrow-center">ACTION PLAN</EditableText>
            <EditableText id={"단계별 추진 로드맵"} as="h2" className="wh-h2-center">단계별 추진 로드맵</EditableText>
            <EditableText id={"1차 Action Plan — 플랫폼에서 직영 스테이까지"} className="wcu-lead">1차 Action Plan — 플랫폼에서 직영 스테이까지</EditableText>
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
          <p className="wsi-roadmap-legend">
            <span><i className="wsi-legend-swatch wsi-legend-done" /> 완료 · 진행 중</span>
            <span><i className="wsi-legend-swatch" /> 예정</span>
          </p>

          <Reveal
            as="div"
            className="wh-section-banner wh-section-banner-after"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.roadmap})` }}
            role="img"
            aria-label="책상 위에 펼친 건축 설계도"
          />
        </div>
      </section>

      {/* 리스크 & 대응 방안 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"RISK &amp; RESPONSE"} as="span" className="wh-eyebrow wh-eyebrow-center">RISK &amp; RESPONSE</EditableText>
            <EditableText id={"리스크 &amp; 대응 방안"} as="h2" className="wh-h2-center">리스크 &amp; 대응 방안</EditableText>
            <EditableText id={"신뢰와 안전이 플랫폼의 가장 중요한 자산입니다"} className="wcu-lead">신뢰와 안전이 플랫폼의 가장 중요한 자산입니다</EditableText>
          </Reveal>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.risk})` }}
            role="img"
            aria-label="창으로 햇살이 드는 따뜻한 거실"
            delay={40}
          />

          <div className="wsi-risk-grid">
            {RISKS.map((risk, idx) => (
              <Reveal as="div" key={risk.title} className="wsi-risk-card" delay={idx * 60}>
                <span className="wsi-risk-icon"><risk.icon size={20} /></span>
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
            <EditableText id={"지금 바로 WEWE 스테이를 이용해보세요"} as="h2">지금 바로 WEWE 스테이를 이용해보세요</EditableText>
            <EditableText id={"선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼이 이미 운영 중입니다."}>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼이 이미 운영 중입니다.</EditableText>
          </div>
          <a href="/stay" className="wh-btn wh-btn-outline">
            WEWE 스테이 바로가기 <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        /* 글씨 기준 — 사역 소개 페이지와 동일한 크기·줄간격, 한국어 단어 단위 줄바꿈. */
        .wewe-stay-intro-page {
          word-break: keep-all;
        }

        .wewe-stay-intro-page .wcu-section {
          padding: 4.5rem 0;
        }

        .wewe-stay-intro-page .wcu-lead {
          font-size: 1.02rem;
          line-height: 1.7;
        }

        /* 선교사 사역(Project 2) 페이지라 강조색은 주황 계열 */
        .wsi-intro-quote {
          margin: 0 0 2.25rem;
          padding: 1.75rem 2rem;
          background: rgba(217, 123, 63, 0.07);
          border-left: 4px solid var(--wh-orange);
          border-radius: 0 12px 12px 0;
        }

        .wsi-intro-quote p {
          margin: 0 0 0.85rem;
          color: var(--wh-ink);
          font-size: 1.12rem;
          font-weight: 600;
          line-height: 1.9;
          letter-spacing: -0.005em;
        }

        .wsi-intro-quote cite {
          display: block;
          font-style: normal;
          color: var(--wh-orange-deep);
          font-size: 0.88rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .wsi-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .wewe-stay-intro-page .wsi-overview-card {
          padding: 1.6rem 1.5rem;
        }

        .wewe-stay-intro-page .wcu-overview-tag {
          font-size: 0.78rem;
          margin-bottom: 0.75rem;
        }

        .wsi-mini-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .wsi-mini-list li {
          color: var(--wh-ink);
          font-size: 0.95rem;
          line-height: 1.65;
          padding-left: 0.95rem;
          position: relative;
        }

        .wsi-mini-list li strong {
          display: block;
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--wh-orange-deep);
        }

        .wsi-mini-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.62rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        /* 서비스 모델 (2026-10-08 개편) — 세 카드를 위에서 아래로, 모두 같은 색으로.
           카드 안은 윗줄 [아이콘·구분·이름], 아랫줄 [세부 항목 | 얻는 가치] 두 칸. */
        .wsi-model-list {
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .wsi-model-arrow {
          display: flex;
          justify-content: center;
          padding: 0.45rem 0;
          color: var(--wh-orange);
        }

        .wsi-model-card {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 1rem 1.5rem;
          align-items: start;
          padding: 1.6rem 1.75rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-left: 5px solid var(--wh-orange);
          border-radius: 12px;
          box-shadow: 0 8px 22px rgba(28, 28, 22, 0.05);
        }

        .wsi-model-head {
          grid-column: 1 / -1;
          padding-bottom: 0.9rem;
          border-bottom: 1px solid var(--wh-line);
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .wsi-model-icon {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
        }

        .wsi-model-tag {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--wh-orange-deep);
          margin-bottom: 0.2rem;
        }

        .wsi-model-card h4 {
          color: var(--wh-ink);
          font-size: 1.2rem;
          font-weight: 800;
          margin: 0;
        }

        .wsi-model-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .wsi-model-card li {
          color: var(--wh-ink);
          font-size: 0.95rem;
          line-height: 1.6;
          padding-left: 0.95rem;
          position: relative;
        }

        .wsi-model-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.62rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wsi-model-value {
          margin: 0;
          padding: 0.9rem 1rem;
          background: rgba(217, 123, 63, 0.07);
          border-radius: 10px;
          font-size: 0.92rem;
          color: var(--wh-ink-soft);
          line-height: 1.65;
        }

        .wsi-model-value strong {
          display: block;
          color: var(--wh-orange-deep);
          margin-bottom: 0.3rem;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .wsi-journey-block {
          margin-bottom: 2.25rem;
        }

        .wsi-journey-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.02rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: var(--wh-ink);
          margin-bottom: 1rem;
        }

        .wsi-journey-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wsi-journey-dot-host {
          background: var(--wh-teal);
        }

        .wsi-journey-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.8rem;
        }

        .wsi-journey-card {
          padding: 1.3rem 0.9rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-top: 4px solid var(--wh-orange);
          border-radius: 10px;
          text-align: center;
        }

        .wsi-journey-card-host {
          border-top-color: var(--wh-teal);
        }

        .wsi-journey-no {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--wh-orange);
          color: #fff;
          font-size: 0.82rem;
          font-weight: 800;
          margin-bottom: 0.6rem;
        }

        .wsi-journey-card-host .wsi-journey-no {
          background: var(--wh-teal);
        }

        .wsi-journey-card h5 {
          margin: 0 0 0.35rem;
          font-size: 1rem;
          font-weight: 800;
          color: var(--wh-ink);
        }

        .wsi-journey-card p {
          margin: 0;
          font-size: 0.88rem;
          color: var(--wh-ink-soft);
          line-height: 1.55;
        }

        .wsi-kit-card {
          display: grid;
          grid-template-columns: 240px 1fr;
          background: rgba(217, 123, 63, 0.07);
          border-radius: 12px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .wsi-kit-photo {
          min-height: 200px;
          background-size: cover;
          background-position: center;
        }

        .wsi-kit-body {
          padding: 1.6rem 1.75rem;
        }

        .wsi-kit-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--wh-orange-deep);
          margin-bottom: 0.45rem;
        }

        .wsi-kit-body h4 {
          color: var(--wh-ink);
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 0.8rem;
        }

        .wsi-kit-body ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem 1.25rem;
        }

        .wsi-kit-body li {
          color: var(--wh-ink-soft);
          font-size: 0.93rem;
          line-height: 1.6;
          padding-left: 0.95rem;
          position: relative;
        }

        .wsi-kit-body li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wsi-roadmap {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.85rem;
        }

        .wsi-roadmap-card {
          padding: 1.4rem 1.1rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-top: 4px solid var(--wh-line);
          border-radius: 12px;
        }

        .wsi-roadmap-card-done {
          border-color: rgba(20, 107, 113, 0.35);
          border-top-color: var(--wh-teal);
        }

        .wsi-roadmap-no {
          display: block;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--wh-stone);
          margin-bottom: 0.45rem;
        }

        .wsi-roadmap-card-done .wsi-roadmap-no {
          color: var(--wh-teal);
        }

        .wsi-roadmap-card h4 {
          color: var(--wh-ink);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 0.7rem;
        }

        .wsi-roadmap-card:not(.wsi-roadmap-card-done) h4 {
          color: var(--wh-ink-soft);
        }

        .wsi-roadmap-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .wsi-roadmap-card li {
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.55;
        }

        .wsi-roadmap-legend {
          display: flex;
          justify-content: center;
          gap: 1.25rem;
          margin: 1rem 0 0;
          font-size: 0.85rem;
          color: var(--wh-ink-soft);
        }

        .wsi-roadmap-legend span {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .wsi-legend-swatch {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 3px;
          border: 2px solid var(--wh-line);
          background: #fff;
        }

        .wsi-legend-done {
          border-color: var(--wh-teal);
          background: var(--wh-teal);
        }

        .wsi-risk-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .wsi-risk-card {
          padding: 1.6rem 1.5rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wsi-risk-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(20, 107, 113, 0.1);
          color: var(--wh-teal);
          margin-bottom: 0.85rem;
        }

        .wsi-risk-card h4 {
          color: var(--wh-ink);
          font-size: 1.05rem;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }

        .wsi-risk-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.93rem;
          line-height: 1.7;
        }

        @media (max-width: 860px) {
          .wewe-stay-intro-page .wcu-section {
            padding: 3.25rem 0;
          }

          .wsi-overview-grid,
          .wsi-risk-grid {
            grid-template-columns: 1fr;
          }

          .wsi-model-card {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .wsi-journey-row {
            grid-template-columns: 1fr 1fr;
          }

          .wsi-roadmap {
            grid-template-columns: 1fr 1fr;
          }

          .wsi-intro-quote {
            padding: 1.4rem 1.4rem;
          }

          .wsi-intro-quote p {
            font-size: 1.02rem;
          }
        }

        @media (max-width: 600px) {
          .wsi-kit-card {
            grid-template-columns: 1fr;
          }

          .wsi-kit-photo {
            min-height: 160px;
          }

          .wsi-kit-body ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweStayIntroPage;
