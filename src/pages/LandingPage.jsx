import React, { useState } from 'react';
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

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

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
      const { data, error } = await supabase.from('inquiries').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || null
      }).select().single();

      if (error) throw error;

      // 관리자에게 문의 접수 이메일 발송 (실패해도 사용자 경험에는 영향 없도록 best-effort로 처리)
      if (data?.id) {
        supabase.functions
          .invoke('send-email', { body: { type: 'inquiry', inquiryId: data.id } })
          .catch((emailErr) => console.error('문의 이메일 발송 오류:', emailErr));
      }

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
      {/* 히어로 섹션 */}
      <section className="hero">
        <div className="hero-content">
          <h1>선교사의 신뢰의 숙소</h1>
          <p>WEWE STAY는 선교사가 안전하고 신뢰할 수 있는 숙소를 찾을 수 있도록 전문적인 연결을 제공합니다. 2단계 승인 시스템을 통해 선교사와 숙소 제공자 사이의 신뢰를 확보합니다.</p>
          <Link to="/signup" className="btn btn-primary">지금 시작하기</Link>
        </div>
      </section>

      {/* 우리의 이야기 섹션 */}
      <section className="story">
        <div className="container">
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

          <div className="brand-symbol">
            <h3>함께 잡는 손, 브랜드 심볼 'W'의 의미</h3>
            <p>
              브랜드 심볼 'W'는 출애굽기에서 모세의 팔이 내려가지 않도록 곁에서 받쳐준 아론과 훌의 손을 상징합니다.
              먼저 아파본 위로자가 지금 아픈 위로자의 손을 잡아준다는 사랑의 약속을 담고 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="features">
        <div className="container">
          <h2>왜 우리를 선택해야 할까요?</h2>

          <div className="grid grid-3">
            {/* 카드 1 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Lock size={40} />
              </div>
              <h3>신뢰할 수 있는 검증</h3>
              <p>모든 회원이 관리자의 승인 과정을 거치기 때문에 안전하고 신뢰할 수 있습니다.</p>
            </div>

            {/* 카드 2 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Users size={40} />
              </div>
              <h3>커뮤니티 중심</h3>
              <p>선교사 커뮤니티의 일원들만 접근할 수 있는 비공개 플랫폼입니다.</p>
            </div>

            {/* 카드 3 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Heart size={40} />
              </div>
              <h3>함께하는 경험</h3>
              <p>같은 신앙을 가진 사람들과 의미 있는 연결을 만들어보세요.</p>
            </div>

            {/* 카드 4 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <CheckCircle size={40} />
              </div>
              <h3>숙소 품질 보증</h3>
              <p>숙소도 관리자의 검증을 거치므로 일정한 품질을 유지합니다.</p>
            </div>

            {/* 카드 5 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Home size={40} />
              </div>
              <h3>쉬운 예약</h3>
              <p>간단한 예약 시스템으로 편하게 숙소를 예약하세요.</p>
            </div>

            {/* 카드 6 */}
            <div className="card feature-card">
              <div className="feature-icon">
                <Users size={40} />
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
          <h2>시작하는 방법</h2>

          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>가입하기</h3>
              <p>선교사 또는 호스트로 회원가입하고 검증 문서를 제출하세요.</p>
            </div>

            <div className="step-connector">→</div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>승인 대기</h3>
              <p>관리자가 정보를 검토하고 확인합니다. (1-2일 소요)</p>
            </div>

            <div className="step-connector">→</div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>승인 완료</h3>
              <p>승인 후 플랫폼의 모든 기능을 이용할 수 있습니다.</p>
            </div>

            <div className="step-connector">→</div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>숙소 검색/공유</h3>
              <p>숙소를 검색하거나 등록하여 커뮤니티를 활용하세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section className="faq">
        <div className="container">
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

      {/* 문의 섹션 */}
      <section className="contact">
        <div className="container">
          <div className="contact-intro">
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

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  <Send size={18} />
                  {submitting ? '접수 중...' : '문의하기'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .landing-page {
          flex: 1;
        }

        .hero {
          background: linear-gradient(135deg, #16808E 0%, #8ABFC6 100%);
          color: white;
          padding: 5rem 2rem;
          text-align: center;
          animation: fadeIn 0.8s ease;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero h1 {
          color: white;
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }

        .hero p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.2rem;
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

        .story {
          padding: 4rem 0;
          background: white;
        }

        .story .container {
          max-width: 760px;
        }

        .story h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #2c3e50;
        }

        .story p {
          color: #555;
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        .verse {
          margin: 0 0 2rem;
          padding: 1.5rem 1.75rem;
          background: #f7f5f0;
          border-left: 4px solid #16808E;
          border-radius: 6px;
          color: #2c3e50;
          font-weight: 600;
          line-height: 1.8;
          font-style: italic;
        }

        .verse cite {
          display: block;
          margin-top: 0.75rem;
          color: #16808E;
          font-style: normal;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .brand-symbol {
          margin-top: 2rem;
          padding: 1.75rem;
          background: linear-gradient(135deg, rgba(22,128,142,0.08) 0%, rgba(138,191,198,0.15) 100%);
          border: 1px solid #8ABFC6;
          border-radius: 10px;
        }

        .brand-symbol h3 {
          color: #16808E;
          margin-bottom: 0.75rem;
        }

        .brand-symbol p {
          margin: 0;
          color: #555;
        }

        .features {
          padding: 4rem 0;
          background: white;
        }

        .features h2 {
          text-align: center;
          margin-bottom: 3rem;
        }

        .feature-card {
          text-align: center;
          padding: 2rem;
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #16808E 0%, #8ABFC6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: white;
        }

        .feature-card h3 {
          color: #2c3e50;
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          color: #7f8c8d;
        }

        .process {
          padding: 4rem 0;
          background: linear-gradient(135deg, #f7f5f0 0%, #eee8dc 100%);
        }

        .process h2 {
          text-align: center;
          margin-bottom: 3rem;
        }

        .process-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .step {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          min-width: 200px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .step-number {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #16808E 0%, #8ABFC6 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0 auto 1rem;
        }

        .step-connector {
          color: #16808E;
          font-size: 2rem;
          font-weight: bold;
        }

        .faq {
          padding: 4rem 0;
          background: white;
        }

        .faq .container {
          max-width: 760px;
        }

        .faq h2 {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .faq-item {
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.3s;
        }

        .faq-item.open {
          border-color: #16808E;
        }

        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: white;
          border: none;
          text-align: left;
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e50;
          cursor: pointer;
        }

        .faq-chevron {
          flex-shrink: 0;
          color: #16808E;
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
          color: #555;
          line-height: 1.8;
        }

        .contact {
          padding: 4rem 2rem;
          background: linear-gradient(135deg, #f7f5f0 0%, #eee8dc 100%);
        }

        .contact .container {
          max-width: 700px;
        }

        .contact-intro {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .contact-intro h2 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .contact-lead {
          color: #16808E;
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }

        .contact-intro p {
          color: #7f8c8d;
          line-height: 1.8;
        }

        .contact-form-wrap {
          background: white;
          border-radius: 10px;
          padding: 2.5rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .contact-form .form-group {
          margin-bottom: 1.25rem;
        }

        .contact-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .contact-form input,
        .contact-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .contact-form input:focus,
        .contact-form textarea:focus {
          outline: none;
          border-color: #16808E;
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
          color: #16808E;
          margin-bottom: 1rem;
        }

        .contact-success h3 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .contact-success p {
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .process-steps {
            flex-direction: column;
          }

          .step-connector {
            transform: rotate(90deg);
          }

          .hero h1 {
            font-size: 2rem;
          }

          .hero p {
            font-size: 1rem;
          }

          .contact-form-wrap {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
