import React from 'react';
import { CheckCircle2, Mail, ShieldCheck, UserPlus, FileText, Sparkles, AlertTriangle } from 'lucide-react';

// 가입 절차 안내 공용 컴포넌트 (2026-10-09) — WEWE(/signup…)와 WEWE STAY(/stay/signup…) 양쪽에서 씁니다.
//
// 실제 절차(코드·DB 기준):
//  - 선교사·숙소 제공자: 계정 만들기 → 프로필·서류 등록 → [이메일 인증] 메일의 링크 클릭 → [관리자 승인] → 이용
//    (인증 메일은 프로필 등록 직후 "[WEWE] 이메일 주소를 인증해주세요" 제목으로 발송, 링크 48시간 유효)
//  - 후원자: 계정 만들기 → 정보 등록 → 바로 이용 (이메일 인증·관리자 승인 없음)
//
// 이 안내는 다른 사이트 스타일(App.css / wewe-shared.css)에 기대지 않도록 자체 스타일(.sg-*)을 가집니다.

export const SIGNUP_ORIGIN_KEY = 'wewe_signup_origin';

// 가입을 시작한 사이트('wewe' | 'stay')를 기억해, 가입 완료 페이지와 "홈으로" 버튼을 그 사이트로 보냅니다.
export function rememberSignupOrigin(origin) {
  try {
    window.localStorage.setItem(SIGNUP_ORIGIN_KEY, origin === 'wewe' ? 'wewe' : 'stay');
  } catch (e) {
    // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)에서는 기본값(위위스테이)으로 진행
  }
}

export function readSignupOrigin() {
  try {
    return window.localStorage.getItem(SIGNUP_ORIGIN_KEY) === 'wewe' ? 'wewe' : 'stay';
  } catch (e) {
    return 'stay';
  }
}

const ROLE_LABEL = { missionary: '선교사', host: '숙소 제공자', supporter: '후원자' };

const REVIEW_STEPS = [
  { icon: UserPlus, title: '계정 만들기', desc: '이메일·비밀번호를 입력해 계정을 만듭니다.' },
  { icon: FileText, title: '프로필·서류 등록', desc: '이름, 소속 교회, 연락처와 신원 확인 서류를 제출합니다.' },
  {
    icon: Mail,
    title: '이메일 인증',
    desc: '메일함에서 "[WEWE] 이메일 주소를 인증해주세요" 메일을 열고 "이메일 인증하고 시작하기" 버튼을 눌러주세요.',
    key: true,
  },
  {
    icon: ShieldCheck,
    title: '관리자 승인',
    desc: '관리자가 제출하신 정보와 서류를 확인한 뒤 승인합니다. 승인되면 사이트 알림으로 알려드립니다.',
    key: true,
  },
  { icon: Sparkles, title: '이용 시작', desc: '이메일 인증과 관리자 승인이 모두 끝나면 모든 서비스를 이용하실 수 있습니다.' },
];

const SUPPORTER_STEPS = [
  { icon: UserPlus, title: '계정 만들기', desc: '이메일·비밀번호를 입력해 계정을 만듭니다.' },
  { icon: FileText, title: '정보 등록', desc: '이름과 연락처를 등록합니다. 서류 제출은 필요 없습니다.' },
  { icon: Sparkles, title: '바로 이용', desc: '이메일 인증이나 관리자 승인 없이 가입 즉시 이용하실 수 있습니다.' },
];

// 가입 시작 화면용 — 회원 유형별 절차를 짧게 보여줍니다.
// roles: 보여줄 유형 목록 (예: ['missionary', 'host', 'supporter'] 또는 ['missionary', 'host'])
export function SignupProcessOverview({ roles = ['missionary', 'host', 'supporter'], compact = false }) {
  const showReview = roles.includes('missionary') || roles.includes('host');
  const showSupporter = roles.includes('supporter');
  const reviewLabel = ['missionary', 'host'].filter((r) => roles.includes(r)).map((r) => ROLE_LABEL[r]).join(' · ');

  return (
    <div className={`sg-overview${compact ? ' sg-overview-compact' : ''}`}>
      <h3 className="sg-overview-title">가입 절차 안내</h3>
      {showReview && (
        <div className="sg-flow">
          <span className="sg-flow-role">{reviewLabel}</span>
          <ol className="sg-flow-steps">
            {REVIEW_STEPS.map((s, idx) => (
              <li key={s.title} className={s.key ? 'sg-flow-key' : ''}>
                <span className="sg-flow-no">{idx + 1}</span>
                {s.title}
              </li>
            ))}
          </ol>
          <p className="sg-flow-note">
            <AlertTriangle size={15} />
            <span><strong>이메일 인증</strong>과 <strong>관리자 승인</strong>이 모두 끝나야 서비스를 이용하실 수 있습니다.</span>
          </p>
        </div>
      )}
      {showSupporter && (
        <div className="sg-flow sg-flow-supporter">
          <span className="sg-flow-role">후원자</span>
          <ol className="sg-flow-steps">
            {SUPPORTER_STEPS.map((s, idx) => (
              <li key={s.title}>
                <span className="sg-flow-no">{idx + 1}</span>
                {s.title}
              </li>
            ))}
          </ol>
          <p className="sg-flow-note sg-flow-note-ok">
            <CheckCircle2 size={15} />
            <span>서류 심사·관리자 승인 없이 가입 즉시 이용하실 수 있습니다.</span>
          </p>
        </div>
      )}
      <SignupGuideStyles />
    </div>
  );
}

// 가입 완료 화면용 — 지금 어디까지 끝났고, 다음에 무엇을 해야 하는지 단계별로 자세히 보여줍니다.
export function SignupCompleteGuide({ role }) {
  const isSupporter = role === 'supporter';
  const steps = isSupporter ? SUPPORTER_STEPS : REVIEW_STEPS;
  // 가입 완료 시점: 선교사·숙소 제공자는 1~2단계 완료, 3단계(이메일 인증)가 지금 할 일.
  const doneCount = isSupporter ? 3 : 2;

  return (
    <div className="sg-complete">
      {!isSupporter && (
        <div className="sg-alert" role="alert">
          <div className="sg-alert-head">
            <AlertTriangle size={22} />
            <strong>아직 끝나지 않았어요! 아래 두 가지가 꼭 필요합니다</strong>
          </div>
          <ol className="sg-alert-list">
            <li>
              <span className="sg-alert-badge">1</span>
              <div>
                <b>이메일 인증 — 지금 바로 해주세요</b>
                <p>
                  가입하신 이메일로 <em>&ldquo;[WEWE] 이메일 주소를 인증해주세요&rdquo;</em> 메일을 보내드렸습니다.
                  메일 안의 <em>&ldquo;이메일 인증하고 시작하기&rdquo;</em> 버튼을 눌러주세요.
                </p>
                <ul>
                  <li>메일이 보이지 않으면 <b>스팸함·프로모션함</b>을 확인해주세요.</li>
                  <li>인증 링크는 <b>48시간 동안</b>만 유효합니다.</li>
                  <li>메일을 받지 못하셨다면 로그인 후 안내 화면에서 <b>인증 메일 다시 받기</b>를 누르실 수 있습니다.</li>
                </ul>
              </div>
            </li>
            <li>
              <span className="sg-alert-badge">2</span>
              <div>
                <b>관리자 승인 — 승인을 기다려주세요</b>
                <p>
                  이메일 인증이 끝나면 관리자가 제출하신 정보와 서류를 확인한 뒤 승인합니다.
                  승인이 완료되면 사이트 알림으로 알려드리며, 그때부터 모든 서비스를 이용하실 수 있습니다.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}

      <h3 className="sg-steps-title">
        {isSupporter ? '후원자 가입 절차' : `${ROLE_LABEL[role] || '회원'} 가입 절차`} — 현재 진행 상황
      </h3>
      <ol className="sg-steps">
        {steps.map((s, idx) => {
          const state = idx < doneCount ? 'done' : idx === doneCount ? 'now' : 'wait';
          const Icon = s.icon;
          return (
            <li key={s.title} className={`sg-step sg-step-${state}`}>
              <span className="sg-step-icon">{state === 'done' ? <CheckCircle2 size={20} /> : <Icon size={20} />}</span>
              <div className="sg-step-body">
                <span className="sg-step-state">
                  {state === 'done' ? '완료' : state === 'now' ? '지금 해주세요' : '대기'}
                </span>
                <b>{idx + 1}. {s.title}</b>
                <p>{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <SignupGuideStyles />
    </div>
  );
}

function SignupGuideStyles() {
  return (
    <style>{`
      .sg-overview,
      .sg-complete {
        --sg-ink: #1c1c1a;
        --sg-ink-soft: #4a4a46;
        --sg-line: #e5e2da;
        --sg-teal: #146b71;
        --sg-orange: #d97b3f;
        --sg-orange-deep: #b8622c;
        text-align: left;
        word-break: keep-all;
        overflow-wrap: break-word;
      }

      /* 가입 시작 화면용 개요 */
      .sg-overview {
        margin: 0 0 2rem;
        padding: 1.5rem 1.6rem;
        border: 1px solid var(--sg-line);
        border-radius: 14px;
        background: #fff;
      }

      .sg-overview-title {
        margin: 0 0 1rem;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--sg-ink);
      }

      .sg-flow + .sg-flow {
        margin-top: 1.1rem;
        padding-top: 1.1rem;
        border-top: 1px dashed var(--sg-line);
      }

      .sg-flow-role {
        display: inline-block;
        margin-bottom: 0.6rem;
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        background: rgba(217, 123, 63, 0.12);
        color: var(--sg-orange-deep);
        font-size: 0.82rem;
        font-weight: 800;
      }

      .sg-flow-supporter .sg-flow-role {
        background: rgba(20, 107, 113, 0.1);
        color: var(--sg-teal);
      }

      .sg-flow-steps {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem 0.4rem;
        align-items: center;
      }

      .sg-flow-steps li {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.75rem;
        border-radius: 8px;
        background: #f6f4ef;
        color: var(--sg-ink);
        font-size: 0.93rem;
        font-weight: 700;
      }

      .sg-flow-steps li:not(:last-child)::after {
        content: '→';
        margin-left: 0.35rem;
        color: #a8a397;
        font-weight: 400;
      }

      .sg-flow-steps li.sg-flow-key {
        background: #fff1e4;
        color: var(--sg-orange-deep);
        box-shadow: inset 0 0 0 1.5px rgba(217, 123, 63, 0.55);
      }

      .sg-flow-no {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--sg-ink);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 800;
      }

      .sg-flow-key .sg-flow-no {
        background: var(--sg-orange);
      }

      .sg-flow-note {
        display: flex;
        align-items: flex-start;
        gap: 0.45rem;
        margin: 0.75rem 0 0;
        color: var(--sg-orange-deep);
        font-size: 0.92rem;
        line-height: 1.6;
        font-weight: 600;
      }

      .sg-flow-note svg {
        flex-shrink: 0;
        margin-top: 0.2rem;
      }

      .sg-flow-note-ok {
        color: var(--sg-teal);
      }

      /* 가입 완료 화면용 */
      .sg-alert {
        margin: 0 0 2rem;
        padding: 1.4rem 1.5rem;
        border-radius: 14px;
        background: #fff4e8;
        border: 2px solid var(--sg-orange);
      }

      .sg-alert-head {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        color: var(--sg-orange-deep);
        font-size: 1.12rem;
        margin-bottom: 1rem;
      }

      .sg-alert-head strong {
        font-weight: 800;
      }

      .sg-alert-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .sg-alert-list > li {
        display: grid;
        grid-template-columns: 30px 1fr;
        gap: 0.75rem;
        align-items: start;
      }

      .sg-alert-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--sg-orange);
        color: #fff;
        font-weight: 800;
      }

      .sg-alert-list b {
        display: block;
        color: var(--sg-ink);
        font-size: 1.05rem;
        margin-bottom: 0.3rem;
      }

      .sg-alert-list p {
        margin: 0;
        color: var(--sg-ink);
        font-size: 0.97rem;
        line-height: 1.7;
      }

      .sg-alert-list em {
        font-style: normal;
        font-weight: 800;
        color: var(--sg-orange-deep);
      }

      .sg-alert-list ul {
        margin: 0.5rem 0 0;
        padding-left: 1.1rem;
        color: var(--sg-ink-soft);
        font-size: 0.92rem;
        line-height: 1.7;
      }

      .sg-alert-list ul b {
        display: inline;
        font-size: inherit;
        margin: 0;
      }

      .sg-steps-title {
        margin: 0 0 0.9rem;
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--sg-ink);
      }

      .sg-steps {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .sg-step {
        display: grid;
        grid-template-columns: 40px 1fr;
        gap: 0.8rem;
        align-items: start;
        padding: 0.9rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--sg-line);
        background: #fff;
      }

      .sg-step-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f1efe9;
        color: #8c8880;
      }

      .sg-step-done .sg-step-icon {
        background: rgba(20, 107, 113, 0.12);
        color: var(--sg-teal);
      }

      .sg-step-now {
        border: 2px solid var(--sg-orange);
        background: #fffaf4;
      }

      .sg-step-now .sg-step-icon {
        background: var(--sg-orange);
        color: #fff;
      }

      .sg-step-state {
        display: inline-block;
        margin-bottom: 0.2rem;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #8c8880;
      }

      .sg-step-done .sg-step-state {
        color: var(--sg-teal);
      }

      .sg-step-now .sg-step-state {
        color: var(--sg-orange-deep);
      }

      .sg-step-body b {
        display: block;
        color: var(--sg-ink);
        font-size: 1rem;
      }

      .sg-step-wait .sg-step-body b {
        color: var(--sg-ink-soft);
      }

      .sg-step-body p {
        margin: 0.2rem 0 0;
        color: var(--sg-ink-soft);
        font-size: 0.92rem;
        line-height: 1.65;
      }

      @media (max-width: 560px) {
        .sg-overview {
          padding: 1.2rem 1.1rem;
        }

        .sg-flow-steps li {
          font-size: 0.88rem;
        }

        .sg-alert {
          padding: 1.15rem 1.05rem;
        }

        .sg-alert-head {
          font-size: 1.02rem;
          align-items: flex-start;
        }
      }
    `}</style>
  );
}
