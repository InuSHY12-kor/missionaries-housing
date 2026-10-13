import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../App';
import PageHero from '../components/PageHero';

const FORGOT_PASSWORD_HERO_IMAGES = [
  'https://images.pexels.com/photos/38466430/pexels-photo-38466430.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/31372128/pexels-photo-31372128.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 위위 스테이 비밀번호 찾기 (/stay/forgot-password, 2026-09-10 추가).
// (2026-10-13) 이메일만 입력받아 재설정 메일을 요청합니다(이름·전화 대조 제거 — 회원 존재 여부 노출 방지). 재설정 링크는 위위 스테이 안에서만
// 이어지도록 redirectTo를 "/stay/reset-password"로 지정합니다 — 위위 홈페이지 쪽 비밀번호
// 찾기(src/wewe/ForgotPasswordPage.jsx)는 "/reset-password"로 별도로 보냅니다.
function ForgotPassword() {
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
        redirectTo: `${window.location.origin}/stay/reset-password`,
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
    <>
      <PageHero
        images={FORGOT_PASSWORD_HERO_IMAGES}
        eyebrow="RESET PASSWORD"
        title="비밀번호 찾기"
        subtitle="가입한 이메일로 재설정 링크를 보내드립니다"
      />
      <div className="signup-container">
        <div className="container">
          <div className="signup-form">
            {sent ? (
              <div className="fp-sent">
                <CheckCircle2 size={40} />
                <h1>재설정 메일을 요청했습니다</h1>
                <p className="subtitle">
                  <strong>{formData.email}</strong> 주소가 가입된 이메일이라면 비밀번호 재설정 링크가 도착합니다. 메일함(스팸함 포함)을 확인한 뒤
                  링크를 눌러 새 비밀번호를 설정해주세요. 메일이 오지 않으면 가입한 이메일 주소가 맞는지 확인해주세요.
                </p>
                <Link to="/login" className="btn btn-secondary">로그인 페이지로 돌아가기</Link>
              </div>
            ) : (
              <>
                <h1>비밀번호 찾기</h1>
                <p className="subtitle">가입할 때 사용한 이메일을 입력해주세요</p>

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>이메일 *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '요청 중...' : '비밀번호 재설정 링크 받기'}
                  </button>
                </form>

                <p className="subtitle" style={{ marginTop: '1rem' }}>
                  <Link to="/login">로그인으로 돌아가기</Link>
                </p>
              </>
            )}
          </div>
        </div>

        <style>{`
          .fp-sent {
            text-align: center;
            padding: 1rem 0;
          }

          .fp-sent svg {
            color: #2f8f7a;
            margin-bottom: 1rem;
          }

          .fp-sent p {
            margin: 0.75rem 0 1.75rem;
            line-height: 1.7;
          }
        `}</style>
      </div>
    </>
  );
}

export default ForgotPassword;
