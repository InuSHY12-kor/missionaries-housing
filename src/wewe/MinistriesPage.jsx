import React from 'react';
import { ArrowRight, Home as HomeIcon, Car, HeartHandshake, Users2 } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import './wewe-shared.css';

// "소개" > "사역 소개" 페이지 (/about/ministries).
// Phase 2에서는 홈페이지 안의 #ministries 섹션에 두 프로젝트를 간략히만 소개했는데,
// Phase 3에서 claude/wewe-brand-content-2026-09-05.md의 상세 내용(배경 및 필요성,
// 사업 목표, 핵심 프로그램, 기대 효과)을 담아 실제 하위 페이지로 분리했습니다.
function MinistriesPage() {
  return (
    <div className="wewe-page wewe-ministries-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="OUR MINISTRIES"
        title="우리가 하는 일"
        subtitle="Blessed Blessing, 하나님의 영광을 위해 사람을 세웁니다."
      >
        <AboutSubNav active="/about/ministries" />
      </WevePageHero>

      {/* PROJECT 1 — 목회자 */}
      <section className="wm-project wm-project-teal">
        <div className="wh-container wh-container-narrow">
          <span className="wm-tag">PROJECT 1 · 목회자</span>
          <h2>Refresh Pastor Academy</h2>
          <p className="wm-subtitle">레위인의 회복 — 성도의 위로가 되어온 목회자님이, 이제는 위로받으실 시간입니다.</p>

          <blockquote className="wm-prologue">
            하나님이 아파하시는 시선을 바라보고 싶었습니다. 처음 우리의 시선은 고아와 과부, 나그네에 머물렀습니다.
            그러던 중 성경의 말씀을 발견하게 되었습니다. 하나님께서 돌보라 말씀하신 이들 앞에는 레위인들이
            있었다는 것이었습니다. 하나님의 일꾼, 하나님은 이들을 보시기에 자랑스럽고 대견하기도 하시지만
            한편으론 상처받고 지쳐 아파하는 이들을 보며 아프시지 않을지요. 하나님이 머무시는 시선에 우리의
            시선이 머물고, 그들이 다시 작품으로 세워지는 꿈을 꿉니다.
          </blockquote>

          <h3 className="wm-h3">배경 및 필요성</h3>
          <p className="wm-lead-quote">
            &ldquo;우리는 그동안 목사님의 설교에 은혜받고, 목사님의 기도로 위로를 얻었습니다. 하지만, 정작
            목사님은 누구에게 위로받고 계신지 물어보지 못했습니다.&rdquo;
          </p>

          <div className="wm-stat-grid">
            <div className="wm-stat-card">
              <span className="wm-stat-num">74%</span>
              <p>목회자 4명 중 3명은 돌봄을 받고 싶다고 답했습니다. (한국교회 트렌드 2026)</p>
            </div>
            <div className="wm-stat-card">
              <span className="wm-stat-num">55%</span>
              <p>스스로를 돌보는 상담·코칭이 가장 필요하다고 답했습니다. (한국교회 트렌드 2026)</p>
            </div>
            <div className="wm-stat-card">
              <span className="wm-stat-num">1/3</span>
              <p>미국 전직 목회자 3명 중 1명이 45세 이전에 사역을 떠났고, 가장 큰 이유는 소명의 변화였습니다.
                (라이프웨이 리서치, 2025.08)</p>
            </div>
          </div>

          <p>
            목회자는 &ldquo;하나님이 다 책임지시니 걱정할 것이 없다&rdquo;고 하기엔, 하나님은 사람을 통해
            일하십니다. 지금까지 한국 교회는 열매를 향해 달려왔지만, 이제 뿌리가 타들어 가는 신호가 곳곳에서
            들려옵니다. 목회자의 소진은 개인의 문제가 아니라 교회 전체의 위기입니다. 이제 우리는
            &lsquo;소모&rsquo;하는 방법이 아니라, 함께 &lsquo;성장&rsquo;하는 방법으로 목회자들의 위로자가
            되어야 합니다.
          </p>

          <ul className="wm-issue-list">
            <li><strong>재교육의 부재</strong> — 신학대학원 졸업 후, 급변하는 시대적 요구에 대응할 체계적인
              재교육 기회가 부족합니다.</li>
            <li><strong>사역의 고립감</strong> — 1인 다역을 수행하는 현장에서 목회자는 멘토 없이 늘 치열한
              현장에 고립됩니다.</li>
            <li><strong>소진의 위기</strong> — 감정노동의 최전선에서 성도들의 어려움을 공감하며 대리외상을
              겪고, 영적 침체와 우울감을 경험합니다.</li>
          </ul>

          <h3 className="wm-h3">사업 목표</h3>
          <p className="wm-goal-caption">Blessed Blessing, 하나님의 영광을 위해 사람을 세우다.</p>
          <div className="wm-goal-grid">
            <div className="wm-goal-card">
              <h4>전인적 회복</h4>
              <p>사역 현장에서 벗어난 완전한 멈춤, 심리적 안정감, Giver에서 Taker로 영적 자기효능감 회복,
                회복탄력성 강화</p>
            </div>
            <div className="wm-goal-card">
              <h4>연결</h4>
              <p>초교파적 동료의 지지 기반, 시니어-주니어 목회자 멘토링, 지역별 목회자 자조모임</p>
            </div>
          </div>

          <h3 className="wm-h3">핵심 프로그램</h3>
          <div className="wm-program-grid">
            <div className="wm-program-card">
              <h4>목회자 아카데미</h4>
              <p>심포지엄 · 목회자 세미나 · 목회자 소진관리 프로그램</p>
            </div>
            <div className="wm-program-card">
              <h4>개별 지원</h4>
              <p>연간 N명의 대상자 선정, 목회자 자기탐색(심리상담 프로그램), 개별 지원(전투복 지원·재정 등),
                목회자 양성 장학사업</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT 2 — 선교사 */}
      <section className="wm-project wm-project-orange">
        <div className="wh-container wh-container-narrow">
          <span className="wm-tag">PROJECT 2 · 선교사</span>
          <h2>Missionary Care</h2>
          <p className="wm-subtitle">선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록.</p>

          <blockquote className="wm-prologue">
            오늘날 이 땅에서 가장 &lsquo;나그네&rsquo;다운 삶을 사는 이는 누구일까요? 우리는 열방을 향해
            삶의 터전을 옮긴 선교사님들을 떠올렸습니다. 그들은 복음을 위해 고국의 안정을 포기하고 떠난
            이들이지만, 잠시 돌아온 고국에서 도리어 &lsquo;이방인&rsquo;이 됩니다. 쉴 수 있는 집도, 이동할
            수 있는 차도 없이, 가장 익숙해야 할 땅에서 가장 낯선 하루를 견뎌내곤 합니다. 지친 발을 씻기고
            평안한 안식을 제공하는 것, 그것은 단순한 지원을 넘어 그들이 하나님의 &lsquo;걸작품(Poiema)&rsquo;
            으로 다시 세워지는 여정의 시작입니다.
          </blockquote>

          <h3 className="wm-h3">배경 및 필요성</h3>
          <div className="wm-quote-grid">
            <blockquote>&ldquo;이제 선교지로 나간 지 10~15년이 지나니 모교회에 와도 낯설어요&rdquo;<cite>선교사 A</cite></blockquote>
            <blockquote>&ldquo;파송교회 장로님이 자녀들 선교지에 잘 있는지 물어보시네요… 이럴 때는 참 외롭습니다&rdquo;<cite>선교사 B</cite></blockquote>
            <blockquote>&ldquo;가까운 선교사님들이 한국에 들어오면 머물 곳이 없어서 친척집, 지인집에 머물러요&rdquo;<cite>선교 후원자</cite></blockquote>
          </div>

          <ul className="wm-issue-list">
            <li><strong>생존 인프라의 부재</strong> — 가장 기본적인 권리인 &lsquo;머물 곳&rsquo;과
              &lsquo;이동할 권리&rsquo;의 부재, 선교지와 한국 물가 사이의 격차.</li>
            <li><strong>사역의 고립감</strong> — 우리(WE)가 아닌 혼자(I)인 위로자, 파송교회·후원자와의
              유대와 공감 부재. 사역보고는 있으나 교제가 부족합니다.</li>
            <li><strong>소진의 위기</strong> — 끊임없이 주는 삶에 익숙한 정서적 고갈 상태, 하나님의
              걸작품이 아닌 소모품으로 전락하는 위기.</li>
          </ul>

          <h3 className="wm-h3">사업 목표</h3>
          <p className="wm-goal-caption">Blessed Blessing, 하나님의 영광을 위해 사람을 세우다.</p>
          <div className="wm-goal-grid">
            <div className="wm-goal-card">
              <h4>생존 인프라 지원</h4>
              <p>WEWE 스테이 설립, 전국의 선교관·스테이·유휴숙소 네트워크 구축, 필수 활동을 위한 차량 공유</p>
            </div>
            <div className="wm-goal-card">
              <h4>환대와 회복</h4>
              <p>완전한 회복을 위한 리트릿 프로그램, 소진관리를 통한 심리·정서적 회복, 귀국 시 건강검진 지원</p>
            </div>
          </div>

          <h3 className="wm-h3">핵심 프로그램</h3>
          <div className="wm-program-grid wm-program-grid-icons">
            <div className="wm-program-card wm-program-live">
              <span className="wm-program-icon"><HomeIcon size={20} /></span>
              <div>
                <h4>WEWE 스테이 <span className="wh-live-badge">이용 가능</span></h4>
                <p>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼 — 지금 바로 이용하실 수 있습니다.</p>
                <a href="/stay" className="wh-ministry-link">바로가기 <ArrowRight size={14} /></a>
              </div>
            </div>
            <div className="wm-program-card">
              <span className="wm-program-icon"><Car size={20} /></span>
              <div>
                <h4>레위인의 모빌리티</h4>
                <p>단기 귀국 선교사를 위한 차량 쉐어링</p>
              </div>
            </div>
            <div className="wm-program-card">
              <span className="wm-program-icon"><HeartHandshake size={20} /></span>
              <div>
                <h4>Poiema 돌봄</h4>
                <p>선교사 정체성 회복을 위한 전인적 힐링캠프</p>
              </div>
            </div>
            <div className="wm-program-card">
              <span className="wm-program-icon"><Users2 size={20} /></span>
              <div>
                <h4>WE+WE 커넥트</h4>
                <p>후원자·선교사, 선교사·선교사를 이어주는 멤버십 프로그램</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기대 효과 */}
      <section className="wm-outcome">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">EXPECTED OUTCOME</span>
          <h2 className="wh-h2-center">기대되는 변화</h2>
          <div className="wm-outcome-grid">
            <div className="wm-outcome-card">
              <h4>목회자가 경험하는 변화</h4>
              <ul>
                <li>사역의 전문성 강화 — 최신 목회 동향 등 전문성 개발</li>
                <li>지지그룹 확보 — 동료그룹과 멘토그룹을 통한 지지체계</li>
                <li>회복탄력성 강화 — 소진관리를 통한 회복으로 사역 지속</li>
                <li>지속 가능한 사역동력 — 지속적인 사후 프로그램과 피드백</li>
              </ul>
            </div>
            <div className="wm-outcome-card">
              <h4>교회가 경험하는 변화</h4>
              <ul>
                <li>리더 리스크 관리 — 사역의 연속성 확보</li>
                <li>공동체의 영적·정서적 건강도 상승 — 강단의 생명력 강화</li>
                <li>교회의 현대화 — 디지털 사역 정착, 최신 사역 기획</li>
                <li>건강한 동력 모델 구축 — 평신도 섬김, 외부 네트워크 자산화</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wm-project {
          padding: 4.5rem 0;
        }

        .wm-project-teal {
          background: var(--wh-bg);
        }

        .wm-project-orange {
          background: var(--wh-bg-soft);
        }

        .wm-tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.9rem;
        }

        .wm-project-teal .wm-tag {
          color: var(--wh-teal);
          background: rgba(20, 107, 113, 0.1);
        }

        .wm-project-orange .wm-tag {
          color: var(--wh-orange-deep);
          background: rgba(217, 123, 63, 0.1);
        }

        .wm-project h2 {
          color: var(--wh-ink);
          font-size: 1.9rem;
          margin-bottom: 0.5rem;
        }

        .wm-subtitle {
          color: var(--wh-ink-soft);
          font-size: 1.02rem;
          margin-bottom: 2rem;
          line-height: 1.7;
        }

        .wm-prologue {
          margin: 0 0 2.25rem;
          padding: 1.5rem 1.75rem;
          background: rgba(0, 0, 0, 0.025);
          border-left: 3px solid var(--wh-line);
          color: var(--wh-ink-soft);
          font-style: italic;
          line-height: 1.85;
          font-size: 0.95rem;
        }

        .wm-h3 {
          color: var(--wh-ink);
          font-size: 1.2rem;
          margin: 2.5rem 0 1rem;
        }

        .wm-project p {
          color: var(--wh-ink-soft);
          line-height: 1.85;
          font-size: 0.98rem;
          margin-bottom: 1.1rem;
        }

        .wm-lead-quote {
          font-weight: 700;
          color: var(--wh-ink);
          font-style: italic;
        }

        .wm-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.75rem;
        }

        .wm-stat-card {
          padding: 1.25rem 1.1rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-align: center;
        }

        .wm-project-orange .wm-stat-card {
          background: var(--wh-bg);
        }

        .wm-stat-num {
          display: block;
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--wh-teal);
          margin-bottom: 0.5rem;
        }

        .wm-stat-card p {
          margin: 0;
          font-size: 0.82rem;
          color: var(--wh-ink-soft);
          line-height: 1.5;
        }

        .wm-quote-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.75rem;
        }

        .wm-quote-grid blockquote {
          margin: 0;
          padding: 1.1rem 1.1rem 1rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          font-size: 0.85rem;
          font-style: italic;
          color: var(--wh-ink-soft);
          line-height: 1.6;
        }

        .wm-quote-grid cite {
          display: block;
          margin-top: 0.65rem;
          font-style: normal;
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--wh-orange-deep);
        }

        .wm-issue-list {
          list-style: none;
          margin: 0 0 1.75rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .wm-issue-list li {
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        .wm-issue-list strong {
          color: var(--wh-ink);
        }

        .wm-goal-caption {
          font-weight: 700;
          color: var(--wh-ink);
          margin-top: -0.5rem;
        }

        .wm-goal-grid,
        .wm-program-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .wm-goal-card,
        .wm-program-card {
          padding: 1.4rem 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wm-project-orange .wm-goal-card,
        .wm-project-orange .wm-program-card {
          background: var(--wh-bg-soft);
        }

        .wm-goal-card h4,
        .wm-program-card h4 {
          color: var(--wh-ink);
          font-size: 1rem;
          margin-bottom: 0.4rem;
        }

        .wm-goal-card p,
        .wm-program-card p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.65;
        }

        .wm-program-grid-icons .wm-program-card {
          display: flex;
          gap: 0.9rem;
          align-items: flex-start;
        }

        .wm-program-icon {
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

        .wm-program-live {
          border-color: var(--wh-teal);
        }

        .wh-live-badge {
          display: inline-block;
          margin-left: 0.4rem;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: var(--wh-teal);
          color: #fff;
          vertical-align: middle;
        }

        .wh-ministry-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          margin-top: 0.4rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--wh-orange-deep);
          text-decoration: none;
        }

        .wh-ministry-link:hover {
          text-decoration: underline;
        }

        .wm-outcome {
          padding: 5rem 0;
          background: var(--wh-bg);
        }

        .wm-outcome-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .wm-outcome-card {
          padding: 1.75rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wm-outcome-card h4 {
          color: var(--wh-ink);
          margin-bottom: 0.9rem;
        }

        .wm-outcome-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .wm-outcome-card li {
          color: var(--wh-ink-soft);
          font-size: 0.9rem;
          line-height: 1.6;
          padding-left: 1rem;
          position: relative;
        }

        .wm-outcome-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.55rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        @media (max-width: 860px) {
          .wm-stat-grid,
          .wm-quote-grid,
          .wm-goal-grid,
          .wm-program-grid,
          .wm-outcome-grid {
            grid-template-columns: 1fr;
          }

          .wm-project {
            padding: 3.5rem 0;
          }
        }
      `}</style>
    </div>
  );
}

export default MinistriesPage;
