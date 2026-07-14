import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Lock, Users, CheckCircle, Heart } from 'lucide-react';

function LandingPage() {
  return (
    <div className="landing-page">
      {/* 히어로 섹션 */}
      <section className="hero">
        <div className="hero-content">
                    <h1>WEWE STAY</h1>
          <p>믿음의 공동체 속에서 안전하고 신뢰할 수 있는 숙소를 찾으세요</p>
          <Link to="/signup" className="btn btn-primary">지금 시작하기</Link>
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

      {/* CTA 섹션 */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>지금 바로 시작하세요</h2>
            <p>선교사 커뮤니티와 함께 안전하고 신뢰할 수 있는 숙소 공유를 경험하세요.</p>
            <Link to="/signup" className="btn btn-primary btn-large">가입하기</Link>
          </div>
        </div>
      </section>

      <style>{`
        .landing-page {
          flex: 1;
        }

        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          color: #667eea;
          font-size: 2rem;
          font-weight: bold;
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
        }

        .cta {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 2rem;
          text-align: center;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .cta h2 {
          color: white;
          margin-bottom: 1rem;
        }

        .cta p {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
