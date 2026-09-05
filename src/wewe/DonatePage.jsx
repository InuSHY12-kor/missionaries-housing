import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Copy, Mail } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import './wewe-shared.css';

// 후원(도네이션) 안내 페이지 (/donate, Phase 5).
// 확정된 1차 범위: "안내 콘텐츠 + 외부 링크(계좌/문의 이메일)만 우선 제공" — 토스 온라인
// 결제 연동은 이후 단계 과제로 남겨둡니다(회원 예약 결제에 이미 쓰이는 confirm-toss-payment와는
// 무관한 별도 흐름이 될 예정). 계좌번호는 아직 실제 값이 없어 WeweFooter.jsx의 "전화 [연락처
// 입력 필요]"와 동일한 표기 관례를 따라 자리표시자로 남겨두었습니다 — 실제 후원 계좌가
// 정해지면 이 파일의 ACCOUNT_INFO만 채우면 됩니다.
const ACCOUNT_INFO = {
  bank: '[입력 필요]',
  number: '[입력 필요]',
  holder: '비영리단체 WEWE(위로자의 위로자)',
};

const IMPACT_ITEMS = [
  {
    title: 'WEWE 스테이',
    desc: '한국에 돌아온 선교사님이 안심하고 머물 수 있는 공유 숙소 네트워크를 넓혀갑니다.',
  },
  {
    title: '레위인의 모빌리티',
    desc: '단기 귀국한 선교사님의 병원 진료, 사역지 방문을 위한 차량 쉐어링을 지원합니다.',
  },
  {
    title: 'Poiema 돌봄',
    desc: '선교사님이 하나님의 작품(Poiema)으로 다시 세워지는 전인적 회복 프로그램·힐링캠프를 엽니다.',
  },
  {
    title: 'WE+WE 커넥트',
    desc: '후원자와 선교사, 선교사와 선교사를 잇는 멤버십 프로그램으로 고립감을 해소합니다.',
  },
];

function DonatePage() {
  const [copied, setCopied] = React.useState(false);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT_INFO.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근이 막힌 환경에서는 조용히 무시(계좌번호는 화면에 이미 표시되어 있음)
    }
  };

  return (
    <div className="wewe-page wewe-donate-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="SUPPORT WEWE"
        title="후원으로 함께하기"
        subtitle="위로자들이 다시 일어설 수 있도록, 당신의 후원이 그 손을 붙잡아 줍니다."
      />

      <section className="wd-why">
        <div className="wh-container wh-container-narrow">
          <blockquote className="wh-verse">
            &ldquo;너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서 먹고
            배부르게 하라&rdquo;
            <cite>(신명기 14:29)</cite>
          </blockquote>

          <p>
            기업이 없어 공동체의 돌봄이 절실했던 레위인처럼, 오늘의 목회자와 선교사들도 누군가를 위로하는
            자리에서 정작 자신은 돌봄받지 못한 채 지쳐갑니다. WEWE는 이들을 지키는 그리스도의 지체들과 함께,
            평신도와 기업의 후원이 전문적인 돌봄으로, 다시 교회와 선교현장의 회복으로 이어지는 선순환을
            만들어가고 있습니다.
          </p>
          <p>
            여러분의 후원은 한 사람의 위로자가 다시 일어서는 데 그치지 않고, 그가 돌보는 공동체 전체에
            회복의 파장을 만듭니다.
          </p>
        </div>
      </section>

      <section className="wd-impact">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">WHERE IT GOES</span>
          <h2 className="wh-h2-center">후원이 만드는 변화</h2>

          <div className="wd-impact-grid">
            {IMPACT_ITEMS.map((item) => (
              <div key={item.title} className="wd-impact-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wd-how">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">HOW TO GIVE</span>
          <h2 className="wh-h2-center">후원 방법</h2>
          <p className="wd-how-lead">
            현재는 계좌이체를 통한 후원을 받고 있습니다. 온라인 결제 후원은 준비 중입니다.
          </p>

          <div className="wd-account-card">
            <div className="wd-account-row">
              <span className="wd-account-label">은행</span>
              <span className="wd-account-value">{ACCOUNT_INFO.bank}</span>
            </div>
            <div className="wd-account-row">
              <span className="wd-account-label">계좌번호</span>
              <span className="wd-account-value wd-account-number">
                {ACCOUNT_INFO.number}
                <button type="button" className="wd-copy-btn" onClick={copyAccountNumber} aria-label="계좌번호 복사">
                  <Copy size={14} />
                </button>
              </span>
            </div>
            <div className="wd-account-row">
              <span className="wd-account-label">예금주</span>
              <span className="wd-account-value">{ACCOUNT_INFO.holder}</span>
            </div>
            {copied && <p className="wd-copied-note">계좌번호가 복사되었습니다.</p>}
          </div>

          <div className="wd-contact">
            <p>후원 방법이나 정기후원 관련 문의는 이메일로 편하게 연락해주세요.</p>
            <a href="mailto:wewe@wewestay.com" className="wh-btn wh-btn-outline">
              <Mail size={16} />
              wewe@wewestay.com
            </a>
          </div>
        </div>
      </section>

      <section className="wa-cta">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>WEWE가 하는 일이 더 궁금하신가요?</h2>
            <p>후원이 이어지는 현장, 레위인의 회복(목회자)과 선교사의 회복 두 프로젝트를 소개합니다.</p>
          </div>
          <Link to="/about/ministries" className="wh-btn wh-btn-primary">
            사역 소개 보기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wd-why {
          padding: 5rem 0 1rem;
          background: var(--wh-bg);
        }

        .wd-why p {
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

        .wd-impact {
          padding: 4rem 0 5rem;
          background: var(--wh-bg-soft);
        }

        .wd-impact-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-top: 2.25rem;
        }

        .wd-impact-card {
          padding: 1.75rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wd-impact-card h3 {
          color: var(--wh-ink);
          margin-bottom: 0.6rem;
          font-size: 1.05rem;
        }

        .wd-impact-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.92rem;
          line-height: 1.7;
        }

        .wd-how {
          padding: 5rem 0;
          background: var(--wh-bg);
        }

        .wd-how-lead {
          text-align: center;
          color: var(--wh-ink-soft);
          margin: 1rem 0 2.5rem;
        }

        .wd-account-card {
          max-width: 480px;
          margin: 0 auto;
          padding: 1.75rem 2rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wd-account-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.65rem 0;
          border-bottom: 1px solid var(--wh-line);
        }

        .wd-account-row:last-of-type {
          border-bottom: none;
        }

        .wd-account-label {
          color: var(--wh-stone);
          font-size: 0.85rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .wd-account-value {
          color: var(--wh-ink);
          font-weight: 600;
          text-align: right;
        }

        .wd-account-number {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-variant-numeric: tabular-nums;
        }

        .wd-copy-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid var(--wh-line);
          background: var(--wh-bg);
          color: var(--wh-orange-deep);
          cursor: pointer;
        }

        .wd-copy-btn:hover {
          border-color: var(--wh-orange);
        }

        .wd-copied-note {
          margin: 0.9rem 0 0;
          text-align: center;
          font-size: 0.82rem;
          color: var(--wh-orange-deep);
          font-weight: 600;
        }

        .wd-contact {
          margin-top: 2.5rem;
          text-align: center;
        }

        .wd-contact p {
          color: var(--wh-ink-soft);
          margin-bottom: 1rem;
        }

        .wa-cta {
          padding: 4rem 0;
          background: var(--wh-ink);
        }

        .wa-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .wa-cta h2 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .wa-cta p {
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
        }

        @media (max-width: 860px) {
          .wd-impact-grid {
            grid-template-columns: 1fr;
          }

          .wa-cta-inner {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

export default DonatePage;
