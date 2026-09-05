import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import './wewe-shared.css';

// WEWE 전체 로그인 페이지 (/login, Phase 6).
// 로그인 성공 후에는 항상 /stay로 이동합니다 — 로그인 이후 무엇을 보여줄지(승인
// 대기 화면, 관리자 대시보드, 후원자 전용 안내 등)는 이미 App.jsx가 회원 상태(role,
// status, email_verified_at)에 따라 전부 분기하고 있으므로, 여기서 다시 판단할
// 필요가 없습니다. WeweSite와 /stay는 서로 다른 라우터(BrowserRouter)이므로
// react-router의 navigate가 아닌 전체 페이지 이동을 사용합니다.
function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      window.location.href = '/stay';
    } catch (err) {
      if (err.message === 'Email not confirmed') {
        setError('이메일 인증이 아직 완료되지 않았습니다. 가입 시 받으신 인증 메일의 링크를 먼저 클릭해주세요.');
      } else if (err.message === 'Invalid login credentials') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="wewe-page wewe-login-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="WELCOME BACK"
        title="다시 만나 반가워요"
        subtitle="로그인하고 위위와 함께 이어가세요"
      />

      <section className="wl-section">
        <div className="wh-container wh-container-narrow">
          <div className="wl-card">
            {error && (
              <div className="wl-alert">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="wl-form">
              <div className="wl-field">
                <label htmlFor="wl-email">이메일 *</label>
                <input
                  id="wl-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="wl-field">
                <label htmlFor="wl-password">비밀번호 *</label>
                <input
                  id="wl-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button type="submit" className="wh-btn wh-btn-primary wl-submit" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <p className="wl-links">
              계정이 없으신가요? <Link to="/signup">가입하기</Link>
            </p>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wl-section {
          flex: 1;
          padding: 4rem 0 5rem;
          background: var(--wh-bg-soft);
        }

        .wl-card {
          max-width: 440px;
          margin: 0 auto;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          padding: 2.5rem;
        }

        .wl-alert {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.9rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.92rem;
          line-height: 1.6;
          background: #fdecea;
          color: #b8452e;
          border: 1px solid #f3c5bb;
        }

        .wl-field {
          margin-bottom: 1.5rem;
        }

        .wl-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: var(--wh-ink);
          font-size: 0.92rem;
        }

        .wl-field input {
          width: 100%;
          padding: 0.75rem 0.9rem;
          border: 1px solid var(--wh-line);
          border-radius: 6px;
          font-size: 1rem;
          background: var(--wh-bg);
          color: var(--wh-ink);
        }

        .wl-field input:focus {
          outline: none;
          border-color: var(--wh-orange);
          box-shadow: 0 0 0 3px rgba(217, 123, 63, 0.15);
        }

        .wl-submit {
          width: 100%;
          justify-content: center;
          border: none;
        }

        .wl-links {
          text-align: center;
          margin: 1.5rem 0 0;
          color: var(--wh-stone);
          font-size: 0.92rem;
        }

        .wl-links a {
          color: var(--wh-orange-deep);
          text-decoration: none;
          font-weight: 700;
        }

        @media (max-width: 860px) {
          .wl-card {
            padding: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
