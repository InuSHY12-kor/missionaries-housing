import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../App';
import { SUPPORTER_TERMS } from '../data/termsOfService';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import './wewe-shared.css';

// 후원자(supporter) 가입 페이지 (/signup/supporter, Phase 6).
// 선교사/호스트(/stay/signup/*)와 달리 증빙 서류 제출이나 관리자 승인 절차 없이,
// 이메일 인증만 마치면 바로 이용 가능한 계정입니다 — 사용자가 명시적으로 선택한
// 정책("즉시 가입/자동 승인")을 따릅니다. 실제 프로필(성명 등) 등록과 계정 활성화는
// 이메일 인증 링크를 클릭한 뒤 /stay/complete-profile 에서 마무리됩니다(기존
// 선교사/호스트 가입과 동일한 리다이렉트 대상을 재사용해, Supabase 인증 리다이렉트
// 허용 목록을 새로 등록할 필요가 없도록 했습니다).
function SupporterSignup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }
      if (formData.password !== formData.passwordConfirm) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
      if (formData.password.length < 8) {
        throw new Error('비밀번호는 8자 이상이어야 합니다.');
      }
      if (!agreed) {
        throw new Error('이용약관에 동의해주세요.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/stay/complete-profile`,
          data: { role: 'supporter' },
        },
      });

      if (authError) throw authError;

      if (authData.session) {
        // 이메일 인증이 꺼져 있는 등, 가입과 동시에 로그인 세션이 생성된 경우 →
        // 바로 다음 단계(프로필 등록)로 이동. WeweSite와 /stay는 서로 다른 라우터이므로
        // 전체 페이지 이동으로 넘어갑니다.
        window.location.href = '/stay/complete-profile';
        return;
      }

      setSuccess(
        `${formData.email} 주소로 인증 메일을 보내드렸습니다. 메일함(스팸함 포함)을 확인하고 인증 링크를 클릭해주세요. 인증 후 자동으로 다음 단계(정보 등록)로 이동하며, 별도의 승인 절차 없이 바로 이용하실 수 있습니다.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wewe-page wewe-supporter-signup-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="SUPPORT WEWE"
        title="후원자로 가입하기"
        subtitle="서류 심사 없이 이메일 인증만으로 바로 가입이 완료됩니다."
      />

      <section className="ss-section">
        <div className="wh-container wh-container-narrow">
          <div className="ss-card">
            <p className="ss-lead">
              후원자 계정은 숙소 예약·제공 기능을 사용하지 않는, WEWE의 소식과 사역을 계속 확인하기
              위한 가벼운 계정입니다. 선교사·호스트 가입과 달리 별도의 증빙 서류나 관리자 승인 없이
              이메일 인증만 마치면 바로 이용하실 수 있습니다.
            </p>

            {error && (
              <div className="ss-alert ss-alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {success && <div className="ss-alert ss-alert-success">{success}</div>}

            {!success && (
              <form onSubmit={handleSubmit} className="ss-form">
                <div className="ss-field">
                  <label htmlFor="ss-email">이메일 *</label>
                  <input
                    id="ss-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="ss-field">
                  <label htmlFor="ss-password">비밀번호 *</label>
                  <input
                    id="ss-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="8자 이상"
                    required
                  />
                </div>

                <div className="ss-field">
                  <label htmlFor="ss-password-confirm">비밀번호 확인 *</label>
                  <input
                    id="ss-password-confirm"
                    type="password"
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleInputChange}
                    placeholder="비밀번호 재입력"
                    required
                  />
                </div>

                <div className="ss-field">
                  <label>이용약관 *</label>
                  <div className="ss-terms-box" tabIndex={0}>
                    {SUPPORTER_TERMS}
                  </div>
                  <label className="ss-checkbox">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                    />
                    <span>위 이용약관에 동의합니다</span>
                  </label>
                </div>

                <button type="submit" className="wh-btn wh-btn-primary ss-submit" disabled={loading}>
                  {loading ? '가입 중...' : '후원자로 가입하기'}
                </button>
              </form>
            )}

            <div className="ss-links">
              <Link to="/signup">← 가입 유형 다시 선택하기</Link>
              <span className="ss-links-divider">|</span>
              이미 계정이 있으신가요? <Link to="/login">로그인</Link>
            </div>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .ss-section {
          flex: 1;
          padding: 4rem 0 5rem;
          background: var(--wh-bg-soft);
        }

        .ss-card {
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          padding: 2.5rem;
        }

        .ss-lead {
          color: var(--wh-ink-soft);
          line-height: 1.8;
          margin: 0 0 2rem;
        }

        .ss-alert {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.9rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .ss-alert-error {
          background: #fdecea;
          color: #b8452e;
          border: 1px solid #f3c5bb;
        }

        .ss-alert-success {
          background: #eaf5ee;
          color: #1f6b3d;
          border: 1px solid #bfe2cc;
        }

        .ss-field {
          margin-bottom: 1.5rem;
        }

        .ss-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: var(--wh-ink);
          font-size: 0.92rem;
        }

        .ss-field input[type='email'],
        .ss-field input[type='password'] {
          width: 100%;
          padding: 0.75rem 0.9rem;
          border: 1px solid var(--wh-line);
          border-radius: 6px;
          font-size: 1rem;
          background: var(--wh-bg);
          color: var(--wh-ink);
        }

        .ss-field input:focus {
          outline: none;
          border-color: var(--wh-orange);
          box-shadow: 0 0 0 3px rgba(217, 123, 63, 0.15);
        }

        .ss-terms-box {
          height: 160px;
          overflow-y: auto;
          border: 1px solid var(--wh-line);
          border-radius: 6px;
          padding: 1rem;
          background: var(--wh-bg-soft);
          color: var(--wh-ink-soft);
          font-size: 0.85rem;
          line-height: 1.7;
          white-space: pre-wrap;
          margin-bottom: 0.75rem;
        }

        .ss-checkbox {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          cursor: pointer;
          font-weight: 500;
          color: var(--wh-ink);
        }

        .ss-checkbox input {
          width: auto;
          flex-shrink: 0;
          cursor: pointer;
        }

        .ss-submit {
          width: 100%;
          justify-content: center;
          border: none;
        }

        .ss-links {
          text-align: center;
          margin-top: 1.75rem;
          color: var(--wh-stone);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .ss-links a {
          color: var(--wh-orange-deep);
          text-decoration: none;
          font-weight: 700;
        }

        .ss-links-divider {
          color: var(--wh-line);
        }

        @media (max-width: 860px) {
          .ss-card {
            padding: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default SupporterSignup;
