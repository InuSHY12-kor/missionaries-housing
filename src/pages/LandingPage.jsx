import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { Home, Lock, Users, CheckCircle, Heart, ChevronDown, Send } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: '위위 스테이는 어떻게 시작되었나요?',
    a: "'위로자의 위로자'라는 소중한 고백을 담은 비영리 단체 WEWE입니다. 사역을 위해 십수 년을 타국에서 헌신하신 선교사님들이 고국에서조차 낯설어하시는 모습에 저희는 깊은 울림을 느꼈습니다. 선교사님들이 비로소 긴장을 풀고 편히 쉬실 수 있는 정갈하고 안온한 보금자리를 마련해 드리고 싶어 정성을 다해 이 공간을 준비했습니다."
  },
  {
    q: '평안한 쉼을 위해 숙소는 어떻게 예약할 수 있나요?',
    a: '회원 승인을 받으신 선교사님은 위위 스테이에서 원하시는 지역과 날짜, 함께 머무실 인원을 자유롭게 선택해 검색하실 수 있어요. 편안한 안식처를 찾으셨다면 플랫폼을 통해 예약 신청을 보내주세요. 그 후 호스트님과 다정한 대화를 나누며 세부 일정을 맞추시면 됩니다.'
  },
  {
    q: '숙소 제공자께서 WEWE STAY로 선교사님을 모시려면 어떻게 하나요?',
    a: '호스트님은 가입 후 숙소를 정성껏 등록해 주세요. 공간의 안전과 서로의 신뢰를 위해 2단계 승인 절차를 진행하며, 검증 완료 후 선교사님과 연결됩니다. 이는 모두가 안심하고 따뜻한 위로를 나눌 수 있는 건강한 커뮤니티를 만들기 위한 필수적인 과정이니 기쁜 마음으로 함께해 주시길 부탁드립니다.'
  },
  {
    q: '2단계 승인 절차가 필요한 이유는 무엇일까요?',
    a: '선교사님께는 따뜻한 보금자리를, 호스트님께는 평안한 나눔을 약속드리고자 2단계 승인을 진행합니다. 예약 후 체크인 안내까지 세심하게 도와드리고 있어 처음이셔도 전혀 어렵지 않으니, 서로를 향한 믿음의 공동체 안에서 머무시는 내내 마음 편히 안식하시길 바랍니다.'
  },
  {
    q: '예약이 모두 완료된 뒤에는 언제부터 머무를 수 있을까요?',
    a: '예약 승인 후에는 호스트님과 자유롭게 대화하며 체크인 시간을 맞추실 수 있어요. 현재는 주로 한국 내 안식처를 연결해 드리고 있지만, 더 많은 곳에서 쉼을 누리실 수 있게 사역의 지경을 넓혀가는 중이니 언제든 편히 문의해 주세요.'
  }
];

// Unsplash 무료 이미지 (숙소/게스트하우스 분위기) — 각 사진작가 크레딧은 하단 참고
const IMAGES = {
  aboutLeft: 'https://images.unsplash.com/photo-1763616828336-e7fcd02086f5?auto=format&fit=crop&w=700&q=80', // Rochelle Lee
  aboutCenter: 'https://images.unsplash.com/photo-1749703810919-1f979a9a3982?auto=format&fit=crop&w=800&q=80', // Kailun Zhang
  aboutRight: 'https://images.unsplash.com/photo-1769366316790-dfcb6a546f05?auto=format&fit=crop&w=700&q=80', // Oriol Pascual
  hands: 'https://images.unsplash.com/photo-1604881991575-dfb1003d8811?auto=format&fit=crop&w=900&q=80' // Priscilla Du Preez
};

// 히어로 슬라이드쇼 (약 3초마다 전환)
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1726090401458-7abb00f7450c?auto=format&fit=crop&w=1800&q=80', // Clay Banks
  'https://images.unsplash.com/photo-1662514121891-8f3a97e5a2ea?auto=format&fit=crop&w=1800&q=80', // Photos of Korea - 한옥
  'https://images.unsplash.com/photo-1632518741173-9c2d8e962704?auto=format&fit=crop&w=1800&q=80', // Tom Jur - 창밖 산 풍경
  'https://images.unsplash.com/photo-1782952438288-7528ca318935?auto=format&fit=crop&w=1800&q=80' // Rebecca Winter - 여행자
];

// 옆으로 흘러가는 여행/숙소 사진 스트립
const MARQUEE_IMAGES = [
  'https://images.unsplash.com/photo-1763616828336-e7fcd02086f5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1749703810919-1f979a9a3982?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1769366316790-dfcb6a546f05?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1618237600880-fb9d72e98393?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1781781490292-b3897966361c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1786255454548-b0b71597f9c0?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1771970574223-24e53a0c5a24?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1650476524542-c5cc53306700?auto=format&fit=crop&w=900&q=80'
];

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  // 히어로 슬라이드쇼: 약 3초마다 다음 이미지로 자동 전환
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setSubmitError('이름, 이메일, 전화번호는 필수 입력입니다.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // 비로그인 사용자가 제출하는 문의라 inquiries에는 SELECT 정책이 없습니다(관리자만 열람 가능).
      // insert().select()를 쓰면 삽입 직후 되읽기 단계에서 RLS에 막히므로, id를 미리 만들어 함께 저장합니다.
      const inquiryId = window.crypto.randomUUID();
      const { error } = await supabase.from('inquiries').insert({
        id: inquiryId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || null
      });

      if (error) throw error;

      // 관리자에게 문의 접수 이메일 발송 (실패해도 사용자 경험에는 영향 없도록 best-effort로 처리)
      supabase.functions
        .invoke('send-email', { body: { type: 'inquiry', inquiryId } })
        .catch((emailErr) => console.error('문의 이메일 발송 오류:', emailErr));

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setSubmitError('오류가 발생했습니다: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      {/* 히어로 섹션 — 3초마다 자동 전환되는 슬라이드쇼 */}
      <section className="hero">
        {HERO_IMAGES.map((src, idx) => (
          <div
            key={idx}
            className={`hero-slide ${idx === heroSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}

        <div className="hero-content">
          <span className="hero-eyebrow">MISSIONARY REST &amp; STAY</span>
          <h1>선교사의 신뢰의 숙소</h1>
          <p>
            WEWE STAY는 선교사가 안전하고 신뢰할 수 있는 숙소를 찾을 수 있도록 전문적인 연결을 제공합니다.
            <br />
            2단계 승인 시스템을 통해 선교사와 숙소 제공자 사이의 신뢰를 확보합니다.
          </p>
          <Link to="/signup" className="link-cta">지금 시작하기</Link>
        </div>

        <div className="hero-progress">
          {HERO_IMAGES.map((_, idx) => (
            <div className="hero-dot-wrap" key={idx}>
              <svg className="hero-ring" viewBox="0 0 36 36">
                <circle className="hero-ring-track" cx="18" cy="18" r="15.5" />
                {idx === heroSlide && (
                  <circle
                    key={`fill-${heroSlide}`}
                    className="hero-ring-fill"
                    cx="18"
                    cy="18"
                    r="15.5"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>
      </section>

      {/* 우리의 이야기 섹션 */}
      <section className="story">
        <div className="container">
          <span className="eyebrow center">OUR STORY</span>
          <h2>우리의 이야기: 위로자의 위로자</h2>

          <blockquote className="verse">
            “너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서 먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라”
            <cite>(신명기 14:29)</cite>
          </blockquote>

          <p>
            WEWE는 '위로자의 위로자'라는 뜻으로, 성경의 가르침을 따라 목회자와 선교사님들이 사역 현장에서 겪는 고단함을 보듬기 위해 시작된 비영리 단체입니다.
            우리는 그분들이 다시 일어설 수 있도록 곁에서 묵묵히 지원하며 기도의 손길을 더합니다.
          </p>

          <p>
            그중 WEWE STAY는 선교사님들이 10~15년 만에 고국으로 돌아온 한국에서도 편안하게 머물 수 있는 '생존 인프라 지원' 신뢰의 공유 숙소 플랫폼입니다.
            쉼이 필요한 이들에게 안전하고 따뜻한 보금자리를 연결하는 것이 우리의 사명입니다.
          </p>

          <div className="about-gallery">
            <div className="side left" style={{ backgroundImage: `url(${IMAGES.aboutLeft})` }} />
            <div className="arch" style={{ backgroundImage: `url(${IMAGES.aboutCenter})` }} />
            <div className="side right" style={{ backgroundImage: `url(${IMAGES.aboutRight})` }} />
          </div>

          <div className="brand-symbol">
            <div
              className="brand-symbol-visual"
              style={{ backgroundImage: `url(${IMAGES.hands})` }}
              role="img"
              aria-label="함께 맞잡은 손"
            />
            <div className="brand-symbol-text">
              <h3>함께 잡는 손, 브랜드 심볼 'W'의 의미</h3>
              <p>
                브랜드 심볼 'W'는 출애굽기에서 모세의 팔이 내려가지 않도록 곁에서 받쳐준 아론과 훌의 손을 상징합니다.
                먼저 아파본 위로자가 지금 아픈 위로자의 손을 잡아준다는 사랑의 약속을 담고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="features">
        <div className="container">
          <span className="eyebrow center">WHY WEWE STAY</span>
          <h2>왜 우리를 선택해야 할까요?</h2>

          <div className="grid grid-3">
            {/* 카드 1 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Lock size={32} />
              </div>
              <h3>신뢰할 수 있는 검증</h3>
              <p>모든 회원이 관리자의 승인 과정을 거치기 때문에 안전하고 신뢰할 수 있습니다.</p>
            </div>

            {/* 카드 2 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3>커뮤니티 중심</h3>
              <p>선교사 커뮤니티의 일원들만 접근할 수 있는 비공개 플랫폼입니다.</p>
            </div>

            {/* 카드 3 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Heart size={32} />
              </div>
              <h3>함께하는 경험</h3>
              <p>같은 신앙을 가진 사람들과 의미 있는 연결을 만들어보세요.</p>
            </div>

            {/* 카드 4 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <CheckCircle size={32} />
              </div>
              <h3>숙소 품질 보증</h3>
              <p>숙소도 관리자의 검증을 거치므로 일정한 품질을 유지합니다.</p>
            </div>

            {/* 카드 5 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Home size={32} />
              </div>
              <h3>쉬운 예약</h3>
              <p>간단한 예약 시스템으로 편하게 숙소를 예약하세요.</p>
            </div>

            {/* 카드 6 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3>호스트 지원</h3>
              <p>숙소를 공유하고 싶은 분들도 안전한 환경에서 시작할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 프로세스 섹션 */}
      <section className="process">
        <div className="container">
          <span className="eyebrow center">HOW IT WORKS</span>
          <h2>시작하는 방법</h2>

          <div className="process-list">
            <div className="process-row">
              <div className="process-num">01</div>
              <div className="process-body">
                <h3>가입하기</h3>
                <p>선교사 또는 호스트로 회원가입하고 검증 문서를 제출하세요.</p>
              </div>
            </div>

            <div className="process-row">
              <div className="process-num">02</div>
              <div className="process-body">
                <h3>승인 대기</h3>
                <p>관리자가 정보를 검토하고 확인합니다. (1-2일 소요)</p>
              </div>
            </div>

            <div className="process-row">
              <div className="process-num">03</div>
              <div className="process-body">
                <h3>승인 완료</h3>
                <p>승인 후 플랫폼의 모든 기능을 이용할 수 있습니다.</p>
              </div>
            </div>

            <div className="process-row">
              <div className="process-num">04</div>
              <div className="process-body">
                <h3>숙소 검색/공유</h3>
                <p>숙소를 검색하거나 등록하여 커뮤니티를 활용하세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="faq">
        <div className="container">
          <span className="eyebrow center">FAQ</span>
          <h2>자주 묻는 질문</h2>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={20} className="faq-chevron" />
                </button>
                {openFaq === idx && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 문의 섹션 — 바로 위에 여행/숙소 사진이 흘러가는 스트립을 포함 */}
      <section className="contact">
        <div className="container">
          <div className="contact-marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, idx) => (
                <div key={idx} className="marquee-item" style={{ backgroundImage: `url(${src})` }} />
              ))}
            </div>
          </div>

          <div className="contact-grid">
          <div className="contact-intro">
            <span className="eyebrow">CONTACT</span>
            <h2>궁금한 점이 있으신가요?</h2>
            <p className="contact-lead">위위 스테이에 대해 무엇이든 편하게 문의해 주세요.</p>
            <p>
              숙소 이용이나 등록 방법, 승인 절차 등 궁금하신 내용을 남겨주시면 위위 스테이 팀이 확인 후 빠르게 안내해 드리겠습니다.
              정식으로 선교사 또는 숙소 제공자로 가입하시려면 상단의 '가입하기' 메뉴를 이용해 주세요.
            </p>
          </div>

          <div className="contact-form-wrap">
            {submitted ? (
              <div className="contact-success">
                <CheckCircle size={40} />
                <h3>문의가 접수되었습니다</h3>
                <p>남겨주신 연락처로 위위 스테이 팀이 곧 안내해 드리겠습니다. 감사합니다.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleInquirySubmit}>
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="성함을 입력해주세요"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>이메일 *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="이메일 주소를 입력해주세요"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>전화번호 *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="연락 가능한 전화번호를 입력해주세요"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>메시지</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleFormChange}
                    rows="4"
                    placeholder="궁금하신 점이나 남기고 싶은 말씀을 자유롭게 적어주세요"
                  />
                </div>

                {submitError && <p className="form-error">{submitError}</p>}

                <button type="submit" className="link-cta link-cta-dark link-cta-block" disabled={submitting}>
                  <Send size={18} />
                  {submitting ? '접수 중...' : '문의하기'}
                </button>
              </form>
            )}
          </div>
          </div>
        </div>
      </section>

      {/* 하단 푸터 — 전화번호만 확인 후 추가 필요 */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">WEWE<b>STAY</b></span>
            <p>위로자의 위로자 — 선교사와 숙소 제공자를 잇는 신뢰의 플랫폼</p>
          </div>

          <div className="footer-info">
            <p>비영리단체 WEWE · 대표 홍현지</p>
            <p>사업자(고유번호) 501-82-75164</p>
            <p>주소 서울특별시 종로구 대학로12길 61, 5층 501-176A호(동승동, 계우빌딩)</p>
            <p>전화 [연락처 입력 필요] · 이메일 wewe@wewestay.com</p>
          </div>

          <div className="footer-copy">
            <p>&copy; {new Date().getFullYear()} WEWE. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        :root {
          /* 이 페이지 안에서만 쓰는 에디토리얼 톤(디자인 3) 변수 */
        }

        .landing-page {
          flex: 1;
          --ink: #1c1c1a;
          --ink-soft: #4a4a46;
          --stone: #8c8880;
          --line: #e5e2da;
          --lp-bg: #ffffff;
          --lp-bg-soft: #faf9f6;
          --accent: #9c8058;
        }

        .eyebrow {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: var(--accent);
          margin-bottom: 0.85rem;
        }

        .eyebrow.center {
          display: block;
          text-align: center;
        }

        /* 히어로 섹션 — 슬라이드쇼 */
        .hero {
          position: relative;
          min-height: 720px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 6rem 2rem;
          background-color: #1c1c1a;
          overflow: hidden;
          animation: fadeIn 0.8s ease;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1.4s ease;
        }

        .hero-slide.active {
          opacity: 1;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(15,15,13,0.55) 0%, rgba(15,15,13,0.45) 45%, rgba(15,15,13,0.85) 100%);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
        }

        /* 슬라이드 진행 표시 — 원형 링이 3초 동안 채워지는 형태 */
        .hero-progress {
          position: absolute;
          left: 50%;
          bottom: 2rem;
          transform: translateX(-50%);
          z-index: 2;
          display: flex;
          gap: 0.85rem;
        }

        .hero-dot-wrap {
          width: 20px;
          height: 20px;
        }

        .hero-ring {
          width: 20px;
          height: 20px;
          transform: rotate(-90deg);
        }

        .hero-ring-track {
          fill: none;
          stroke: rgba(255, 255, 255, 0.35);
          stroke-width: 2.5;
        }

        .hero-ring-fill {
          fill: none;
          stroke: #ffffff;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-dasharray: 97.4;
          stroke-dashoffset: 97.4;
          animation: heroRingFill 3s linear forwards;
        }

        @keyframes heroRingFill {
          from { stroke-dashoffset: 97.4; }
          to { stroke-dashoffset: 0; }
        }

        /* 사진이 옆으로 흘러가는 마퀴 스트립 — CONTACT 섹션 안, 문의 폼과 같은 폭으로 좁혀서 배치 */
        .contact-marquee {
          overflow: hidden;
          margin-bottom: 2.5rem;
          border-radius: 6px;
        }

        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 38s linear infinite;
        }

        .marquee-item {
          flex: 0 0 auto;
          width: 220px;
          height: 140px;
          margin-right: 1rem;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          background-color: var(--lp-bg-soft);
        }

        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* 밑줄 링크 스타일 CTA 버튼 — 히어로(흰색) / 문의 폼(진한 청록, 흰 배경용) */
        .link-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 0.4rem;
          font-size: 1.05rem;
          font-weight: 700;
          font-family: inherit;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 3px solid rgba(255, 255, 255, 0.7);
          transition: color 0.3s ease, border-color 0.3s ease;
        }

        .link-cta:hover {
          color: #ffffff;
          border-bottom-color: #ffffff;
        }

        .link-cta-dark {
          color: rgba(28, 28, 26, 0.55);
          border-bottom-color: rgba(28, 28, 26, 0.55);
        }

        .link-cta-dark:hover {
          color: #1c1c1a;
          border-bottom-color: #1c1c1a;
        }

        .link-cta-block {
          width: 100%;
          justify-content: center;
        }

        .link-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .hero-eyebrow {
          display: inline-block;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: #e7dcc4;
          margin-bottom: 1.1rem;
        }

        .hero h1 {
          color: white;
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .hero p {
          color: rgba(255, 255, 255, 0.92);
          font-size: 1.15rem;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 우리의 이야기 섹션 */
        .story {
          padding: 5rem 0;
          background: var(--lp-bg);
        }

        .story .container {
          max-width: 760px;
        }

        .story h2 {
          text-align: center;
          margin-bottom: 2.5rem;
          color: var(--ink);
          font-weight: 700;
        }

        .story p {
          color: var(--ink-soft);
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        .verse {
          margin: 0 0 2rem;
          padding: 1.5rem 1.75rem;
          background: var(--lp-bg-soft);
          border-left: 3px solid var(--accent);
          color: var(--ink);
          font-weight: 600;
          line-height: 1.8;
          font-style: italic;
        }

        .verse cite {
          display: block;
          margin-top: 0.75rem;
          color: var(--accent);
          font-style: normal;
          font-weight: 700;
          font-size: 0.9rem;
        }

        /* 어바웃 갤러리 (3분할 이미지, 가운데 아치형) */
        .about-gallery {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1fr;
          align-items: end;
          gap: 1rem;
          margin: 3rem 0 1rem;
        }

        .about-gallery .side,
        .about-gallery .arch {
          background-size: cover;
          background-position: center;
          background-color: var(--lp-bg-soft);
        }

        .about-gallery .side {
          height: 220px;
          border-radius: 6px;
        }

        .about-gallery .arch {
          height: 300px;
          border-radius: 200px 200px 6px 6px;
        }

        /* 브랜드 심볼 섹션 (손 이미지 + 설명) */
        .brand-symbol {
          margin-top: 2.5rem;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 1.75rem;
          align-items: center;
          padding: 1.75rem;
          background: var(--lp-bg-soft);
          border: 1px solid var(--line);
          border-radius: 10px;
        }

        .brand-symbol-visual {
          width: 100%;
          height: 220px;
          border-radius: 130px 130px 8px 8px;
          background-size: cover;
          background-position: center;
        }

        .brand-symbol h3 {
          color: var(--ink);
          margin-bottom: 0.75rem;
        }

        .brand-symbol p {
          margin: 0;
          color: var(--ink-soft);
        }

        /* 특징 섹션 */
        .features {
          padding: 5rem 0;
          background: var(--lp-bg-soft);
        }

        .features h2 {
          text-align: center;
          margin-bottom: 3rem;
          color: var(--ink);
        }

        .feature-card {
          text-align: center;
          padding: 2rem 1.5rem;
          background: var(--lp-bg);
          border: 1px solid var(--line);
          border-radius: 4px;
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          border: 1px solid var(--line);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          color: var(--accent);
        }

        .feature-card h3 {
          color: var(--ink);
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          color: var(--stone);
        }

        /* 프로세스 섹션 - 에디토리얼 넘버 리스트 */
        .process {
          padding: 5rem 0;
          background: var(--lp-bg);
        }

        .process h2 {
          text-align: center;
          margin-bottom: 3rem;
          color: var(--ink);
        }

        .process-list {
          max-width: 640px;
          margin: 0 auto;
          border-top: 1px solid var(--line);
        }

        .process-row {
          display: grid;
          grid-template-columns: 90px 1fr;
          align-items: center;
          gap: 1.5rem;
          padding: 1.75rem 0;
          border-bottom: 1px solid var(--line);
        }

        .process-num {
          font-size: 2rem;
          font-weight: 200;
          color: var(--accent);
        }

        .process-body h3 {
          color: var(--ink);
          margin-bottom: 0.35rem;
        }

        .process-body p {
          color: var(--stone);
          margin: 0;
        }

        /* FAQ 섹션 */
        .faq {
          padding: 5rem 0;
          background: var(--lp-bg-soft);
        }

        .faq .container {
          max-width: 760px;
        }

        .faq h2 {
          text-align: center;
          margin-bottom: 2.5rem;
          color: var(--ink);
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .faq-item {
          border: 1px solid var(--line);
          border-radius: 4px;
          overflow: hidden;
          background: var(--lp-bg);
          transition: border-color 0.3s;
        }

        .faq-item.open {
          border-color: var(--accent);
        }

        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: transparent;
          border: none;
          text-align: left;
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
        }

        .faq-chevron {
          flex-shrink: 0;
          color: var(--accent);
          transition: transform 0.3s;
        }

        .faq-item.open .faq-chevron {
          transform: rotate(180deg);
        }

        .faq-answer {
          padding: 0 1.5rem 1.5rem;
        }

        .faq-answer p {
          margin: 0;
          color: var(--ink-soft);
          line-height: 1.8;
        }

        /* 문의 섹션 */
        .contact {
          padding: 5rem 2rem;
          background: var(--ink);
        }

        .contact .container {
          max-width: 980px;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .contact-intro h2 {
          color: white;
          margin-bottom: 0.5rem;
        }

        .contact-lead {
          color: #e7dcc4;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }

        .contact-intro p {
          color: rgba(255,255,255,0.72);
          line-height: 1.8;
        }

        .contact-form-wrap {
          background: white;
          border-radius: 6px;
          padding: 2.25rem;
        }

        .contact-form .form-group {
          margin-bottom: 1.25rem;
        }

        .contact-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--ink);
        }

        .contact-form input,
        .contact-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--line);
          border-radius: 4px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .contact-form input:focus,
        .contact-form textarea:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-error {
          color: #e74c3c;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .btn-block {
          width: 100%;
          justify-content: center;
        }

        .contact-success {
          text-align: center;
          padding: 2rem 1rem;
        }

        .contact-success svg {
          color: var(--accent);
          margin-bottom: 1rem;
        }

        .contact-success h3 {
          color: var(--ink);
          margin-bottom: 0.5rem;
        }

        .contact-success p {
          color: var(--stone);
        }

        /* 하단 푸터 */
        .site-footer {
          background: #141412;
          padding: 2.5rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-inner {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 2rem;
          padding: 0 1rem;
        }

        .footer-logo {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
        }

        .footer-brand p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          margin-top: 0.5rem;
          max-width: 280px;
          line-height: 1.6;
        }

        .footer-info p {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.85rem;
          margin: 0.2rem 0;
          line-height: 1.6;
        }

        .footer-copy {
          display: flex;
          align-items: flex-end;
        }

        .footer-copy p {
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.8rem;
        }

        /* ===== 모바일 대응 ===== */
        @media (max-width: 768px) {
          .hero {
            min-height: 560px;
            /* 로그인한 사용자(특히 관리자)는 상단바가 여러 줄로 늘어날 수 있어, 상단바의
               실제 렌더링 높이(--navbar-height, Navigation.jsx에서 계속 갱신)만큼 위쪽
               여백을 확보해 제목 글씨가 상단바와 겹치지 않도록 합니다. */
            padding-top: calc(var(--navbar-height, 72px) + 1rem);
            padding-bottom: 4.5rem;
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }

          .hero-eyebrow {
            font-size: 0.85rem;
            letter-spacing: 0.14em;
            margin-bottom: 0.85rem;
          }

          .marquee-item {
            width: 180px;
            height: 120px;
          }

          .footer-inner {
            flex-direction: column;
            gap: 1.5rem;
          }

          .footer-brand p {
            max-width: 100%;
          }

          .hero h1 {
            font-size: 1.75rem;
          }

          .hero p {
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }

          /* 히어로 슬라이드 진행 표시가 좁은 화면에서 서로 겹치지 않도록 간격/크기 축소 */
          .hero-progress {
            bottom: 1.25rem;
            gap: 0.6rem;
          }

          .hero-dot-wrap,
          .hero-ring {
            width: 16px;
            height: 16px;
          }

          /* 히어로/문의 CTA 버튼은 밑줄 텍스트 스타일이라 탭 영역이 좁으므로
             상하 여백을 늘려 터치하기 편하도록 보정 */
          .hero .link-cta {
            padding: 0.4rem 0 0.55rem;
          }

          .link-cta-block {
            padding-top: 0.9rem;
            padding-bottom: 1.1rem;
            font-size: 1rem;
          }

          .eyebrow {
            font-size: 0.7rem;
          }

          .story {
            padding: 4rem 0;
          }

          .story h2 {
            margin-bottom: 1.75rem;
          }

          .story p {
            font-size: 0.95rem;
            line-height: 1.75;
          }

          .verse {
            padding: 1.15rem 1.25rem;
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
          }

          .about-gallery {
            grid-template-columns: 1fr;
            margin: 2rem 0 1rem;
          }

          .about-gallery .side {
            display: none;
          }

          .about-gallery .arch {
            height: 260px;
            border-radius: 160px 160px 8px 8px;
          }

          .brand-symbol {
            grid-template-columns: 1fr;
            padding: 1.25rem;
            gap: 1.25rem;
          }

          .brand-symbol-visual {
            height: 180px;
          }

          .brand-symbol h3 {
            font-size: 1.1rem;
          }

          .brand-symbol p {
            font-size: 0.95rem;
          }

          .features {
            padding: 4rem 0;
          }

          .features h2 {
            margin-bottom: 2rem;
          }

          .feature-card {
            padding: 1.75rem 1.25rem;
          }

          .feature-icon {
            width: 56px;
            height: 56px;
            margin-bottom: 1rem;
          }

          .feature-card h3 {
            font-size: 1.1rem;
          }

          .feature-card p {
            font-size: 0.95rem;
          }

          .process {
            padding: 4rem 0;
          }

          .process h2 {
            margin-bottom: 2rem;
          }

          .process-row {
            grid-template-columns: 50px 1fr;
            padding: 1.35rem 0;
            gap: 1rem;
          }

          .process-num {
            font-size: 1.5rem;
          }

          .process-body h3 {
            font-size: 1.1rem;
          }

          .process-body p {
            font-size: 0.95rem;
          }

          .faq {
            padding: 4rem 0;
          }

          .faq h2 {
            margin-bottom: 1.75rem;
          }

          .faq-question {
            padding: 1rem 1.1rem;
            font-size: 0.95rem;
            gap: 0.75rem;
          }

          .faq-answer {
            padding: 0 1.1rem 1.1rem;
          }

          .faq-answer p {
            font-size: 0.9rem;
            line-height: 1.7;
          }

          .contact-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .contact-intro h2 {
            font-size: 1.4rem;
          }

          .contact-lead {
            font-size: 1rem;
          }

          .contact-intro p {
            font-size: 0.9rem;
          }

          .contact-form-wrap {
            padding: 1.5rem;
          }

          .contact-form .form-group {
            margin-bottom: 1rem;
          }

          .site-footer {
            padding: 2rem 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .hero {
            min-height: 480px;
            padding-top: calc(var(--navbar-height, 56px) + 0.75rem);
            padding-bottom: 3.5rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .hero-eyebrow {
            font-size: 0.75rem;
          }

          .hero h1 {
            font-size: 1.5rem;
          }

          .hero p {
            font-size: 0.9rem;
          }

          .hero-progress {
            bottom: 1rem;
            gap: 0.5rem;
          }

          .story,
          .features,
          .process,
          .faq {
            padding: 3.5rem 0;
          }

          .story p,
          .brand-symbol p {
            font-size: 0.9rem;
          }

          .verse {
            padding: 1rem;
            font-size: 0.9rem;
          }

          .about-gallery .arch {
            height: 200px;
            border-radius: 120px 120px 8px 8px;
          }

          .brand-symbol {
            padding: 1rem;
          }

          .brand-symbol-visual {
            height: 150px;
          }

          .feature-card {
            padding: 1.5rem 1rem;
          }

          .marquee-item {
            width: 140px;
            height: 100px;
            margin-right: 0.75rem;
          }

          .contact {
            padding: 3.5rem 1.25rem;
          }

          .contact-form-wrap {
            padding: 1.25rem;
          }

          .site-footer {
            padding: 1.75rem 1rem;
          }

          .footer-info p {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
