import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import './wewe-shared.css';

// 위위 비밀번호 찾기 (/forgot-password, 2026-09-10 추가).
// (2026-10-13) 이메일만 입력받아 재설정 메일을 요청합니다 — 이름·전화 대조(회원 존재 여부가
// 드러나던 방식)는 없앴습니다. 가입 여부와 관계없이 같은 안내를 보여줍니다.
// 재설정 링크는 위위 안에서만 이어지도록 redirectTo를 "/reset-password"(WeweSite 안의
// 경로)로 지정합니다 — 위위스테이 쪽 비밀번호 찾기(src/pages/ForgotPassword.jsx)는
// "/stay/reset-password"로 별도로 보냅니다.
function ForgotPasswordPage() {
  const [formData, setFormData] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email) {
        throw new Error('이메일을 입력해주세요.');
      }

      // (2026-10-13 보안) 이름·전화번호 대조(회원 존재 여부가 드러나던 방식)를 없앴습니다.
      // 가입 여부와 관계없이 같은 안내를 보여주고, 재설정 링크는 가입된 이메일에만 실제로 도착합니다.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        if (/rate|seconds|too many/i.test(resetError.message)) {
          throw new Error('잠시 후 다시 시도해주세요. 재설정 메일은 짧은 시간에 여러 번 보낼 수 없습니다.');
        }
        throw resetError;
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wewe-page wewe-forgot-password-page">
      <WeweHeader />

      <WevePageHero
        compact
        eyebrow="RESET PASSWORD"
        title="비밀번호 찾기"
        subtitle="가입한 이메일로 재설정 링크를 보내드립니다"
        images={HERO_IMAGE_SETS.login}
      />

      <section className="wl-section">
        <div className="wh-container wh-container-narrow">
          <Reveal className="wl-card">
            {sent ? (
              <div className="wfp-sent">
                <CheckCircle2 size={40} />
                <h3>재설정 메일을 요청했습니다</h3>
                <p>
                  <strong>{formData.email}</strong> 주소가 가입된 이메일이라면 비밀번호 재설정 링크가 도착합니다. 메일함(스팸함 포함)을 확인한 뒤
                  링크를 눌러 새 비밀번호를 설정해주세요. 메일이 오지 않으면 가입한 이메일 주소가 맞는지 확인해주세요.
                </p>
                <Link to="/login" className="wh-btn wh-btn-outline">로그인 페이지로 돌아가기</Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="wl-alert">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="wl-form">
                  <div className="wl-field">
                    <label htmlFor="wfp-email">이메일 *</label>
                    <input id="wfp-email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <button type="submit" className="wh-btn wh-btn-primary wl-submit" disabled={loading}>
                    {loading ? '요청 중...' : '비밀번호 재설정 링크 받기'}
                  </button>
                </form>

                <p className="wl-links">
                  <Link to="/login">로그인으로 돌아가기</Link>
                </p>
              </>
            )}
          </Reveal>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wfp-sent {
          text-align: center;
          padding: 1rem 0;
          color: var(--wh-ink);
        }

        .wfp-sent svg {
          color: var(--wh-teal);
          margin-bottom: 1rem;
        }

        .wfp-sent h3 {
          font-size: 1.2rem;
          margin: 0 0 0.75rem;
        }

        .wfp-sent p {
          color: var(--wh-ink-soft);
          line-height: 1.7;
          margin: 0 0 1.75rem;
        }
      `}</style>
    </div>
  );
}

export default ForgotPasswordPage;
