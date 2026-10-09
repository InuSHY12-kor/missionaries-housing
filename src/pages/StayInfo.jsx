import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Search, CalendarCheck, Landmark, DoorOpen, Send, Mail, Phone, MapPin } from 'lucide-react';
import PageHero from '../components/PageHero';
import { ORG_INFO } from '../data/orgInfo';
import { MISSIONARY_TERMS, HOST_TERMS, TERMS_EFFECTIVE_DATE } from '../data/termsOfService';

// WEWE STAY 공개 안내 페이지 묶음 (2026-10-10).
// 결제대행사(페이플) 심사와 이용자 안내를 위해 로그인 없이 볼 수 있습니다.
//   /stay/guide          서비스 안내 (서비스 소개 · 운영 단체 정보 · 연락처)
//   /stay/how-it-works   이용 흐름 (예약 → 입금 → 입실 → 지급)
//   /stay/terms          이용약관 (가입 화면과 같은 문구, data/termsOfService.js)
//   /stay/privacy        개인정보처리방침
//   /stay/refund-policy  취소·환불 규정 (RefundPolicy.jsx)

const INFO_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1766431066492-9bec8410a57b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1771354959667-96360bf59eab?auto=format&fit=crop&w=1800&q=80',
];

export const STAY_INFO_TABS = [
  { to: '/guide', label: '서비스 안내' },
  { to: '/how-it-works', label: '이용 흐름' },
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
  { to: '/refund-policy', label: '취소·환불 규정' },
];

export function StayInfoLayout({ active, eyebrow, title, subtitle, children }) {
  return (
    <div className="stay-info-page">
      <PageHero images={INFO_HERO_IMAGES} eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="container si-container">
        <nav className="si-tabs" aria-label="WEWE STAY 안내">
          {STAY_INFO_TABS.map((tab) => (
            <Link key={tab.to} to={tab.to} className={tab.to === active ? 'active' : ''}>
              {tab.label}
            </Link>
          ))}
        </nav>
        {children}
        <OrgInfoBox />
      </div>
      <style>{STAY_INFO_CSS}</style>
    </div>
  );
}

export function OrgInfoBox() {
  return (
    <section className="si-card si-org">
      <h2>운영 단체 정보</h2>
      <dl>
        <dt>서비스명</dt><dd>{ORG_INFO.serviceName}</dd>
        <dt>운영 단체</dt><dd>{ORG_INFO.orgName}</dd>
        <dt>대표자</dt><dd>{ORG_INFO.representative}</dd>
        <dt>{ORG_INFO.registrationLabel}</dt><dd>{ORG_INFO.registrationNo}</dd>
        <dt>주소</dt><dd>{ORG_INFO.address}</dd>
        <dt>전화</dt><dd><a href={`tel:${ORG_INFO.phone.replace(/-/g, '')}`}>{ORG_INFO.phone}</a></dd>
        <dt>이메일</dt><dd><a href={`mailto:${ORG_INFO.email}`}>{ORG_INFO.email}</a></dd>
        <dt>문의 시간</dt><dd>{ORG_INFO.hours}</dd>
      </dl>
    </section>
  );
}

// ───────────────────────── 서비스 안내 ─────────────────────────
export function ServiceGuidePage() {
  return (
    <StayInfoLayout
      active="/guide"
      eyebrow="ABOUT WEWE STAY"
      title="서비스 안내"
      subtitle="선교사님과 숙소 제공자를 잇는 비영리 숙소 연결 서비스입니다"
    >
      <section className="si-card">
        <h2>WEWE STAY는 어떤 서비스인가요?</h2>
        <p>
          WEWE STAY는 비영리단체 {ORG_INFO.orgShortName}가 운영하는 선교사 숙소 연결 서비스입니다.
          안식년·휴가·사역 방문 등으로 국내에 머무를 곳이 필요한 선교사님과, 빈 방이나 집을 선교사님께
          내어드리고 싶은 숙소 제공자(교회·성도·기관)를 안전하게 연결합니다.
        </p>
        <ul>
          <li><b>검증된 회원만</b> — 선교사님은 선교사증·추천서 등, 숙소 제공자는 신분·숙소 권한 자료를 확인한 뒤 승인합니다.</li>
          <li><b>검증된 숙소만</b> — 숙소 정보와 사진을 관리자가 확인한 뒤 공개합니다.</li>
          <li><b>실비 수준의 비용</b> — 숙박 비용은 숙소 제공자가 관리비·청소비 등 최소한의 실비로 정하며, 무료 제공도 가능합니다.</li>
          <li><b>중개 수수료 없음</b> — WEWE는 플랫폼 이용에 대해 별도의 중개 수수료를 받지 않습니다.</li>
        </ul>
      </section>

      <section className="si-card">
        <h2>제공하는 기능</h2>
        <div className="si-grid">
          <div><Search size={22} /><h3>숙소 검색·예약</h3><p>지역·날짜·인원으로 숙소를 찾고 예약을 요청합니다.</p></div>
          <div><CalendarCheck size={22} /><h3>예약 확정·관리</h3><p>숙소 제공자가 예약을 확정하고 날짜를 관리합니다.</p></div>
          <div><Landmark size={22} /><h3>실비 입금·지급</h3><p>계좌이체(가상계좌)로 입금하고, 입실 후 숙소 제공자에게 지급됩니다.</p></div>
          <div><Mail size={22} /><h3>메시지·알림</h3><p>예약 관련 문의를 주고받고 이메일 알림을 받습니다.</p></div>
        </div>
      </section>

      <section className="si-card">
        <h2>숙박 실비 결제 방식</h2>
        <p>
          숙박 실비는 <b>계좌이체로만</b> 받습니다(신용카드 결제 없음). 예약이 확정되면 결제대행사
          {' '}{ORG_INFO.paymentPartner}가 예약마다 발급하는 <b>가상계좌</b>가 안내되고, 입금은 WEWE의 운영 계좌가
          아닌 이 가상계좌로 합니다. 입금된 실비는 선교사님의 <b>입실이 확인된 뒤</b> {ORG_INFO.paymentPartner}
          {' '}정산지급대행을 통해 숙소 제공자의 계좌로 지급됩니다.
        </p>
        <p>
          자세한 순서는 <Link to="/how-it-works">이용 흐름</Link>, 취소 시 환불 기준은
          {' '}<Link to="/refund-policy">취소·환불 규정</Link>을 확인해주세요.
        </p>
      </section>

      <section className="si-card">
        <h2>문의하기</h2>
        <div className="si-contact">
          <p><Phone size={18} /> 전화 <a href={`tel:${ORG_INFO.phone.replace(/-/g, '')}`}>{ORG_INFO.phone}</a> ({ORG_INFO.hours})</p>
          <p><Mail size={18} /> 이메일 <a href={`mailto:${ORG_INFO.email}`}>{ORG_INFO.email}</a></p>
          <p><MapPin size={18} /> {ORG_INFO.address}</p>
        </div>
        <div className="si-actions">
          <Link to="/signup" className="btn btn-primary">회원가입</Link>
          <Link to="/how-it-works" className="btn btn-secondary">이용 흐름 보기</Link>
        </div>
      </section>
    </StayInfoLayout>
  );
}

// ───────────────────────── 이용 흐름 ─────────────────────────
const FLOW_STEPS = [
  { icon: UserCheck, title: '1. 회원가입·승인', who: '선교사 · 숙소 제공자', body: '가입 후 증빙 자료를 제출하면 WEWE가 확인하고 승인합니다. 숙소 제공자는 실비를 받을 지급 계좌도 등록합니다.' },
  { icon: Search, title: '2. 숙소 찾기·예약 요청', who: '선교사', body: '승인된 숙소 중 원하는 곳을 골라 날짜를 정해 예약을 요청합니다. 실비(1박 기준 또는 숙박 1회 정액)가 미리 표시됩니다.' },
  { icon: CalendarCheck, title: '3. 예약 확정', who: '숙소 제공자', body: '숙소 제공자가 예약 요청을 확인하고 확정합니다. 확정 전에는 언제든 비용 없이 취소할 수 있습니다.' },
  { icon: Landmark, title: '4. 실비 입금 (계좌이체)', who: '선교사', body: `예약이 확정되면 ${ORG_INFO.paymentPartner}가 발급한 예약 전용 가상계좌가 안내됩니다. 안내된 기한까지 계좌이체로 입금하면, 선교사님·숙소 제공자·WEWE 모두 "입금 완료"를 확인할 수 있습니다.` },
  { icon: DoorOpen, title: '5. 입실 확인', who: '숙소 제공자 · 선교사', body: '입실일에 선교사님이 숙소에 들어가면 입실을 확인합니다. 입실 전에 취소하면 취소·환불 규정에 따라 환불됩니다.' },
  { icon: Send, title: '6. 숙소 제공자에게 지급', who: 'WEWE · 페이플', body: `입실이 확인되면 ${ORG_INFO.paymentPartner} 정산지급대행으로 숙소 제공자가 등록한 계좌에 실비가 지급됩니다. 지급 전에 예금주가 맞는지 계좌조회로 확인합니다.` },
];

export function HowItWorksPage() {
  return (
    <StayInfoLayout
      active="/how-it-works"
      eyebrow="HOW IT WORKS"
      title="이용 흐름"
      subtitle="예약부터 입금, 입실, 숙소 제공자 지급까지 한눈에 보기"
    >
      <section className="si-card">
        <h2>돈은 이렇게 움직입니다</h2>
        <div className="si-money">
          <div><b>선교사님</b><span>계좌이체</span></div>
          <div className="si-arrow">→</div>
          <div><b>{ORG_INFO.paymentPartner} 가상계좌</b><span>입금 확인 · 입실 전까지 보관</span></div>
          <div className="si-arrow">→</div>
          <div><b>숙소 제공자 계좌</b><span>입실 확인 후 지급대행</span></div>
        </div>
        <p className="si-note">
          입금은 WEWE의 운영 계좌가 아니라 {ORG_INFO.paymentPartner}가 발급한 가상계좌로 받습니다.
          WEWE는 중개 수수료를 받지 않습니다.
        </p>
      </section>

      <section className="si-steps">
        {FLOW_STEPS.map(({ icon: Icon, title, who, body }) => (
          <div key={title} className="si-card si-step">
            <div className="si-step-icon"><Icon size={24} /></div>
            <div>
              <h3>{title}</h3>
              <p className="si-who">{who}</p>
              <p>{body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="si-card">
        <h2>취소하면 어떻게 되나요?</h2>
        <ul>
          <li>입금 전: 언제든 비용 없이 취소할 수 있습니다.</li>
          <li>입금 후 입실일 전날까지 선교사님이 취소: 입금액 <b>전액 환불</b></li>
          <li>입실일 당일부터: 직접 취소·환불 불가 (부득이한 사정은 WEWE에 문의)</li>
          <li>숙소 제공자 사정으로 취소: 시점과 관계없이 <b>전액 환불</b></li>
        </ul>
        <p>자세한 기준은 <Link to="/refund-policy">취소·환불 규정</Link>을 확인해주세요.</p>
      </section>
    </StayInfoLayout>
  );
}

// ───────────────────────── 이용약관 ─────────────────────────
export function TermsPage() {
  const [tab, setTab] = useState('missionary');
  const text = tab === 'host' ? HOST_TERMS : MISSIONARY_TERMS;
  return (
    <StayInfoLayout
      active="/terms"
      eyebrow="TERMS OF SERVICE"
      title="이용약관"
      subtitle="WEWE STAY 회원 유형별 이용약관입니다"
    >
      <section className="si-card">
        <div className="si-toggle" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'missionary'} className={tab === 'missionary' ? 'active' : ''} onClick={() => setTab('missionary')}>
            선교사 회원
          </button>
          <button type="button" role="tab" aria-selected={tab === 'host'} className={tab === 'host' ? 'active' : ''} onClick={() => setTab('host')}>
            숙소 제공자 회원
          </button>
        </div>
        <div className="si-terms">{text}</div>
        <p className="si-note">시행일: {TERMS_EFFECTIVE_DATE}</p>
      </section>
    </StayInfoLayout>
  );
}

// ───────────────────────── 개인정보처리방침 ─────────────────────────
export function PrivacyPage() {
  return (
    <StayInfoLayout
      active="/privacy"
      eyebrow="PRIVACY POLICY"
      title="개인정보처리방침"
      subtitle="WEWE STAY가 개인정보를 어떻게 수집하고 보호하는지 안내합니다"
    >
      <section className="si-card si-policy">
        <p>
          {ORG_INFO.orgName}(이하 "WEWE")는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고
          관련 고충을 신속히 처리하기 위해 다음과 같이 개인정보처리방침을 정합니다.
        </p>

        <h2>1. 처리 목적</h2>
        <ul>
          <li>회원 가입·본인 확인·회원 자격 심사(선교사·숙소 제공자 승인)</li>
          <li>숙소 등록·검색, 예약 연결, 회원 간 메시지와 알림 발송</li>
          <li>숙박 실비의 입금 확인, 환불, 숙소 제공자에 대한 지급(정산지급대행)</li>
          <li>문의·분쟁 처리, 부정 이용 방지, 법령상 의무 이행</li>
        </ul>

        <h2>2. 처리하는 개인정보 항목</h2>
        <table className="si-table">
          <thead><tr><th>구분</th><th>항목</th></tr></thead>
          <tbody>
            <tr><td>모든 회원</td><td>이메일, 비밀번호(암호화 저장), 성명, 휴대전화번호</td></tr>
            <tr><td>선교사·숙소 제공자</td><td>소속 교회명·주소, 자기소개(선택), 자격 확인용 증빙 자료(사진)</td></tr>
            <tr><td>숙소 제공자</td><td>숙소 주소·위치·사진, 지급 계좌(은행, 계좌번호, 예금주명, 예금주 구분, 예금주 생년월일 6자리 또는 사업자·고유번호)</td></tr>
            <tr><td>예약·입금</td><td>예약 일정, 가상계좌 번호, 입금자명, 입금 일시·금액, 환불 시 환불 계좌(은행, 계좌번호, 예금주명)</td></tr>
            <tr><td>후원자</td><td>이메일, 성명, 휴대전화번호(선택)</td></tr>
            <tr><td>자동 수집</td><td>접속 기록, 브라우저 종류, 로그인 유지를 위한 브라우저 저장 정보</td></tr>
          </tbody>
        </table>

        <h2>3. 보유 및 이용 기간</h2>
        <ul>
          <li>회원 정보: 회원 탈퇴(또는 삭제 처리) 완료 후 5년간 보관 후 파기 (분쟁 해결·부정 이용 방지 목적)</li>
          <li>계약·청약철회, 대금 결제 및 지급에 관한 기록: 5년 (「전자상거래 등에서의 소비자보호에 관한 법률」)</li>
          <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (같은 법)</li>
          <li>접속 기록: 3개월 (「통신비밀보호법」)</li>
        </ul>

        <h2>4. 제3자 제공</h2>
        <p>WEWE는 다음의 경우에만 개인정보를 제공합니다.</p>
        <ul>
          <li>예약이 성립하면 예약 당사자에게: 선교사 → 숙소 제공자(성명, 연락처, 소속 교회), 숙소 제공자 → 선교사(성명, 연락처, 숙소 주소). 보유 기간은 해당 숙박 종료 시까지입니다.</li>
          <li>법령에 근거가 있거나 수사기관이 적법한 절차로 요청하는 경우</li>
        </ul>

        <h2>5. 처리 위탁</h2>
        <table className="si-table">
          <thead><tr><th>수탁자</th><th>위탁 업무</th></tr></thead>
          <tbody>
            <tr><td>{ORG_INFO.paymentPartner}</td><td>가상계좌 발급, 입금 확인, 환불 이체, 정산지급대행, 계좌 예금주 확인</td></tr>
            <tr><td>Supabase Inc.</td><td>회원·예약 정보 저장, 로그인 인증, 파일 저장 (저장 위치: 대한민국 서울 리전)</td></tr>
            <tr><td>Netlify, Inc.</td><td>웹사이트 호스팅 (접속 기록 처리)</td></tr>
            <tr><td>Google LLC</td><td>알림 이메일 발송(Gmail), 지도 표시(Google Maps)</td></tr>
          </tbody>
        </table>

        <h2>6. 국외 이전</h2>
        <p>
          웹사이트 호스팅(Netlify, 미국)과 이메일 발송(Google, 미국) 과정에서 접속 기록, 이메일 주소와 성명이
          서비스 이용 시점에 네트워크를 통해 국외로 전송될 수 있습니다. 보유 기간은 각 사업자의 정책에 따르며,
          이전을 원하지 않으시면 회원 탈퇴를 요청하실 수 있습니다(이 경우 서비스 이용이 제한됩니다).
        </p>

        <h2>7. 파기 절차와 방법</h2>
        <p>
          보유 기간이 끝나거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다. 전자 파일은 복구할 수 없는
          방법으로 삭제하고, 증빙 자료 등 업로드 파일은 저장소에서 삭제합니다.
        </p>

        <h2>8. 정보주체의 권리와 행사 방법</h2>
        <p>
          이용자는 언제든 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. 프로필 화면에서 직접 수정하거나
          탈퇴를 요청할 수 있고, 이메일·전화로 요청하시면 지체 없이 처리합니다. 법정대리인이나 위임받은 사람을
          통해서도 요청할 수 있습니다.
        </p>

        <h2>9. 안전성 확보 조치</h2>
        <ul>
          <li>암호화 통신(HTTPS) 사용, 비밀번호 암호화 저장</li>
          <li>데이터베이스 행 단위 접근 제한 — 본인과 승인된 관리자만 민감 정보(증빙 자료, 지급 계좌)에 접근</li>
          <li>증빙 자료는 비공개 저장소에 보관, 관리자 계정 접근 권한 최소화</li>
        </ul>

        <h2>10. 쿠키 등 자동 수집 장치</h2>
        <p>
          로그인 상태 유지를 위해 브라우저 저장소를 사용하며, 광고·추적 목적의 쿠키는 사용하지 않습니다.
          브라우저 설정에서 저장을 거부할 수 있으나 이 경우 로그인이 유지되지 않을 수 있습니다.
        </p>

        <h2>11. 개인정보 보호책임자</h2>
        <p>
          책임자: {ORG_INFO.privacyOfficer}<br />
          연락처: {ORG_INFO.phone} · <a href={`mailto:${ORG_INFO.email}`}>{ORG_INFO.email}</a>
        </p>

        <h2>12. 권익침해 구제 방법</h2>
        <ul>
          <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번 없이 118)</li>
          <li>개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</li>
          <li>대검찰청 사이버수사과 (국번 없이 1301), 경찰청 사이버수사국 (국번 없이 182)</li>
        </ul>

        <h2>13. 시행일</h2>
        <p>이 개인정보처리방침은 {TERMS_EFFECTIVE_DATE}부터 적용됩니다.</p>
      </section>
    </StayInfoLayout>
  );
}

const STAY_INFO_CSS = `
  .si-container {
    max-width: 880px;
    padding-bottom: 4rem;
  }

  .si-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0 0 1.25rem;
  }

  .si-tabs a {
    padding: 0.5rem 0.95rem;
    border-radius: 999px;
    border: 1px solid #ddd6c8;
    background: #fff;
    color: #3a3a36;
    text-decoration: none;
    font-size: 0.92rem;
    font-weight: 600;
  }

  .si-tabs a.active {
    background: #d97b3f;
    border-color: #d97b3f;
    color: #fff;
  }

  .si-card {
    background: #fff;
    border: 1px solid #e5e2da;
    border-radius: 12px;
    padding: 1.5rem 1.6rem;
    margin-bottom: 1rem;
    word-break: keep-all;
  }

  .si-card h2 {
    font-size: 1.15rem;
    margin: 0 0 0.75rem;
    color: #1c1c1a;
  }

  .si-policy h2 {
    margin-top: 1.5rem;
  }

  .si-card h3 {
    font-size: 1.02rem;
    margin: 0.35rem 0 0.3rem;
  }

  .si-card p,
  .si-card li,
  .si-card dd {
    color: #3a3a36;
    line-height: 1.8;
    font-size: 0.98rem;
  }

  .si-card ul {
    margin: 0;
    padding-left: 1.2rem;
  }

  .si-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .si-grid > div {
    background: #faf6ef;
    border-radius: 10px;
    padding: 1rem;
    color: #d97b3f;
  }

  .si-grid p {
    margin: 0;
    font-size: 0.92rem;
  }

  .si-org dl {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 0.35rem 1rem;
    margin: 0;
  }

  .si-org dt {
    font-weight: 700;
    color: #6b665c;
    font-size: 0.92rem;
    line-height: 1.8;
  }

  .si-org dd {
    margin: 0;
  }

  .si-contact p {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0.2rem 0;
    flex-wrap: wrap;
  }

  .si-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .si-money {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .si-money > div:not(.si-arrow) {
    flex: 1 1 180px;
    background: #faf6ef;
    border-radius: 10px;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .si-money span {
    font-size: 0.88rem;
    color: #6b665c;
  }

  .si-arrow {
    align-self: center;
    font-size: 1.4rem;
    color: #d97b3f;
    font-weight: 700;
  }

  .si-step {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .si-step-icon {
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #faf0e6;
    color: #d97b3f;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .si-step p {
    margin: 0;
  }

  .si-who {
    font-size: 0.86rem !important;
    color: #d97b3f !important;
    font-weight: 700;
    margin-bottom: 0.3rem !important;
  }

  .si-note {
    font-size: 0.88rem !important;
    color: #6b665c !important;
    margin: 0.75rem 0 0;
  }

  .si-toggle {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .si-toggle button {
    flex: 1;
    padding: 0.6rem;
    border-radius: 8px;
    border: 1px solid #ddd6c8;
    background: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  .si-toggle button.active {
    background: #1c1c1a;
    border-color: #1c1c1a;
    color: #fff;
  }

  .si-terms {
    white-space: pre-wrap;
    line-height: 1.85;
    font-size: 0.95rem;
    color: #3a3a36;
  }

  .si-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.4rem 0 0.6rem;
    font-size: 0.93rem;
  }

  .si-table th,
  .si-table td {
    border: 1px solid #e5e2da;
    padding: 0.6rem 0.75rem;
    text-align: left;
    vertical-align: top;
    line-height: 1.7;
  }

  .si-table th {
    background: #faf6ef;
  }

  @media (max-width: 640px) {
    .si-card {
      padding: 1.15rem 1.05rem;
    }

    .si-grid {
      grid-template-columns: 1fr;
    }

    .si-org dl {
      grid-template-columns: 5.5rem 1fr;
    }

    .si-arrow {
      transform: rotate(90deg);
      width: 100%;
      text-align: center;
    }
  }
`;
