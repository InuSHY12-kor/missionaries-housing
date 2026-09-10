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
// 가입 당시 입력한 이메일·전화번호·이름이 모두 일치하는지 RPC(verify_reset_identity)로
// 먼저 확인한 뒤에만 비밀번호 재설정 메일을 보냅니다. 재설정 링크는 위위 스테이 안에서만
// 이어지도록 redirectTo를 "/stay/reset-password"로 지정합니다 — 위위 홈페이지 쪽 비밀번호
// 찾기(src/wewe/ForgotPasswordPage.jsx)는 "/reset-password"로 별도로 보냅니다.
function ForgotPassword() {
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
        redirectTo: `${window.location.origin}/stay/reset-password`,
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
    <>
      <PageHero
        images={FORGOT_PASSWORD_HERO_IMAGES}
        eyebrow="RESET PASSWORD"
        title="비밀번호 찾기"
        subtitle="가입 당시 입력한 정보로 본인을 확인해주세요"
      />
      <div className="signup-container">
        <div className="container">
          <div className="signup-form">
            {sent ? (
              <div className="fp-sent">
                <CheckCircle2 size={40} />
                <h1>재설정 링크를 보내드렸습니다</h1>
                <p className="subtitle">
                  <strong>{formData.email}</strong>로 비밀번호 재설정 링크를 보내드렸어요. 메일함(스팸함 포함)을 확인한 뒤
                  링크를 눌러 새 비밀번호를 설정해주세요.
                </p>
                <Link to="/login" className="btn btn-secondary">로그인 페이지로 돌아가기</Link>
              </div>
            ) : (
              <>
                <h1>비밀번호 찾기</h1>
                <p className="subtitle">이메일, 전화번호, 이름을 입력해주세요</p>

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

                  <div className="form-group">
                    <label>전화번호 *</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="가입 시 입력한 전화번호"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>이름 *</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '확인 중...' : '비밀번호 재설정 링크 받기'}
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
