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
// 가입 당시 입력한 이메일·전화번호·이름이 모두 일치하는지 먼저 서버(RPC
// verify_reset_identity, SECURITY DEFINER)에 확인한 뒤에만 비밀번호 재설정 메일을
// 보냅니다 — anon 키로 회원 목록을 직접 조회하지 않고도 본인 확인을 할 수 있습니다.
// 재설정 링크는 위위 안에서만 이어지도록 redirectTo를 "/reset-password"(WeweSite 안의
// 경로)로 지정합니다 — 위위스테이 쪽 비밀번호 찾기(src/pages/ForgotPassword.jsx)는
// "/stay/reset-password"로 별도로 보냅니다.
function ForgotPasswordPage() {
  const [formData, setFormData] = useState({ email: '', phone: '', fullName: '' });
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
      if (!formData.email || !formData.phone || !formData.fullName) {
        throw new Error('이메일, 전화번호, 이름을 모두 입력해주세요.');
      }

      const { data: matched, error: rpcError } = await supabase.rpc('verify_reset_identity', {
        p_email: formData.email,
        p_phone: formData.phone,
        p_full_name: formData.fullName,
      });
      if (rpcError) throw rpcError;

      if (!matched) {
        throw new Error('입력하신 정보와 일치하는 계정을 찾을 수 없습니다. 이메일, 전화번호, 이름을 다시 확인해주세요.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;

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
        eyebrow="RESET PASSWORD"
        title="비밀번호 찾기"
        subtitle="가입 당시 입력한 정보로 본인을 확인해주세요"
        images={HERO_IMAGE_SETS.login}
      />

      <section className="wl-section">
        <div className="wh-container wh-container-narrow">
          <Reveal className="wl-card">
            {sent ? (
              <div className="wfp-sent">
                <CheckCircle2 size={40} />
                <h3>재설정 링크를 보내드렸습니다</h3>
                <p>
                  <strong>{formData.email}</strong>로 비밀번호 재설정 링크를 보내드렸어요. 메일함(스팸함 포함)을 확인한 뒤
                  링크를 눌러 새 비밀번호를 설정해주세요.
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

                  <div className="wl-field">
                    <label htmlFor="wfp-phone">전화번호 *</label>
                    <input
                      id="wfp-phone"
                      type="tel"
                      name="phone"
                      placeholder="가입 시 입력한 전화번호"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="wl-field">
                    <label htmlFor="wfp-name">이름 *</label>
                    <input id="wfp-name" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                  </div>

                  <button type="submit" className="wh-btn wh-btn-primary wl-submit" disabled={loading}>
                    {loading ? '확인 중...' : '비밀번호 재설정 링크 받기'}
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
