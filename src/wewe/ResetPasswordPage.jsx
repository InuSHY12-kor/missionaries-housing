import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import './wewe-shared.css';

// 위위 새 비밀번호 설정 (/reset-password, 2026-09-10 추가).
// 이메일의 재설정 링크를 눌러 들어오면 supabase-js가 URL의 복구 토큰을 자동으로 읽어
// "복구용" 세션을 만듭니다(onAuthStateChange의 PASSWORD_RECOVERY 이벤트). 그 세션이
// 있어야만 새 비밀번호를 입력할 수 있고, 링크가 없거나 만료된 채로 이 주소에 바로
// 들어오면 안내 화면을 보여줍니다.
function ResetPasswordPage() {
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
    <div className="wewe-page wewe-reset-password-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="RESET PASSWORD"
        title="새 비밀번호 설정"
        subtitle="새로 사용하실 비밀번호를 입력해주세요"
        images={HERO_IMAGE_SETS.login}
      />

      <section className="wl-section">
        <div className="wh-container wh-container-narrow">
          <Reveal className="wl-card">
            {checking ? (
              <p className="wl-links">확인 중...</p>
            ) : !ready ? (
              <div className="wfp-sent">
                <AlertCircle size={36} />
                <h3>유효하지 않거나 만료된 링크입니다</h3>
                <p>비밀번호 찾기를 다시 시도해주세요.</p>
                <Link to="/forgot-password" className="wh-btn wh-btn-outline">비밀번호 찾기로 이동</Link>
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
                    <label htmlFor="wrp-password">새 비밀번호 *</label>
                    <input
                      id="wrp-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="wl-field">
                    <label htmlFor="wrp-password-confirm">새 비밀번호 확인 *</label>
                    <input
                      id="wrp-password-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>

                  <button type="submit" className="wh-btn wh-btn-primary wl-submit" disabled={loading}>
                    {loading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
              </>
            )}
          </Reveal>
        </div>
      </section>

      <WeweFooter />
    </div>
  );
}

export default ResetPasswordPage;
