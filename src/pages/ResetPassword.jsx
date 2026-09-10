import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../App';
import PageHero from '../components/PageHero';

const RESET_PASSWORD_HERO_IMAGES = [
  'https://images.pexels.com/photos/38466430/pexels-photo-38466430.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/31372128/pexels-photo-31372128.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 위위 스테이 새 비밀번호 설정 (/stay/reset-password, 2026-09-10 추가).
// 이메일의 재설정 링크를 눌러 들어오면 supabase-js가 URL의 복구 토큰을 읽어 "복구용"
// 세션을 만듭니다(onAuthStateChange의 PASSWORD_RECOVERY 이벤트). 그 세션이 있어야만 새
// 비밀번호를 입력할 수 있습니다.
function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data?.session) setReady(true);
      if (mounted) setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('비밀번호는 6자 이상 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setError('입력하신 두 비밀번호가 서로 다릅니다. 다시 확인해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      navigate('/login', { state: { passwordResetDone: true } });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        images={RESET_PASSWORD_HERO_IMAGES}
        eyebrow="RESET PASSWORD"
        title="새 비밀번호 설정"
        subtitle="새로 사용하실 비밀번호를 입력해주세요"
      />
      <div className="signup-container">
        <div className="container">
          <div className="signup-form">
            {checking ? (
              <p className="subtitle">확인 중...</p>
            ) : !ready ? (
              <div className="fp-sent">
                <AlertCircle size={36} color="#c0392b" />
                <h1>유효하지 않거나 만료된 링크입니다</h1>
                <p className="subtitle">비밀번호 찾기를 다시 시도해주세요.</p>
                <Link to="/forgot-password" className="btn btn-secondary">비밀번호 찾기로 이동</Link>
              </div>
            ) : (
              <>
                <h1>새 비밀번호 설정</h1>

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>새 비밀번호 *</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                  </div>

                  <div className="form-group">
                    <label>새 비밀번호 확인 *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
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
            margin-bottom: 1rem;
          }

          .fp-sent p {
            margin: 0.75rem 0 1.75rem;
          }
        `}</style>
      </div>
    </>
  );
}

export default ResetPassword;
