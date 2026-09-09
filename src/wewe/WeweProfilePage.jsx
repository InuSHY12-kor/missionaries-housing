import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import { User, Phone, Building2, Save, Bell } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import { formatPhoneNumber } from '../utils/phone';
import './wewe-shared.css';

// WEWE 프로필 페이지 (/profile, 2026-09-09 추가).
// 위위 스테이(/stay)의 Profile.jsx와 동일한 구조(기본 정보 / 프로필 수정 / 비밀번호 변경 /
// 알림 설정)를 그대로 따르되, 이 페이지는 WeweSite 라우터(별도 BrowserRouter) 안에서
// 마운트되어 userProfile을 prop으로 받지 못하므로 여기서 직접 supabase 세션과 users
// 테이블을 조회합니다.
//
// 알림 설정만 위위 스테이와 다르게, 두 서비스의 알림을 각각 독립적으로 켜고 끌 수
// 있도록 두 개의 토글로 분리했습니다: notification_email(위위 스테이 알림, 기존 컬럼) /
// notification_email_wewe(위위 알림, 신규 컬럼).
function roleLabel(profile) {
  if (profile?.role === 'admin') {
    return profile?.is_super_admin ? '최고 관리자' : '관리자';
  }
  if (profile?.role === 'missionary') return '선교사';
  if (profile?.role === 'host') return '숙소 제공자';
  if (profile?.role === 'supporter') return '후원자';
  return '알 수 없음';
}

function WeweProfilePage() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    church_name: '',
    church_address: '',
    bio: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [notifWewe, setNotifWewe] = useState(true);
  const [notifStay, setNotifStay] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        if (mounted) navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error('프로필 로드 오류:', error);
      } else if (data) {
        setUserProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          church_name: data.church_name || '',
          church_address: data.church_address || '',
          bio: data.bio || '',
        });
        setNotifWewe(data.notification_email_wewe ?? true);
        setNotifStay(data.notification_email ?? true);
      }
      setLoadingProfile(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneNumber(value) : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update(formData).eq('id', userProfile.id);
      if (error) throw error;
      alert('프로필이 수정되었습니다!');
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      alert('비밀번호가 변경되었습니다!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotifSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_email_wewe: notifWewe, notification_email: notifStay })
        .eq('id', userProfile.id);
      if (error) throw error;
      alert('알림 설정이 저장되었습니다.');
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setNotifSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="wewe-page wewe-profile-page">
        <WeweHeader />
        <div className="wprof-loading">불러오는 중...</div>
        <WeweFooter />
      </div>
    );
  }

  return (
    <div className="wewe-page wewe-profile-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="MY PROFILE"
        title="나의 정보를 관리하세요"
        subtitle="위위(WEWE)와 위위 스테이 계정 정보를 각각 관리할 수 있습니다."
        images={HERO_IMAGE_SETS.login}
      />

      <section className="wprof-section">
        <div className="wh-container">
          <div className="wprof-grid">
            <div className="wprof-col">
              <Reveal as="div" className="wprof-card">
                <h2>
                  <User size={22} />
                  기본 정보
                </h2>

                <div className="wprof-info">
                  <div className="wprof-info-item">
                    <label>이메일</label>
                    <p>{userProfile?.email}</p>
                  </div>
                  <div className="wprof-info-item">
                    <label>역할</label>
                    <p>{roleLabel(userProfile)}</p>
                  </div>
                  <div className="wprof-info-item">
                    <label>가입일</label>
                    <p>{userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
              </Reveal>

              <Reveal as="div" className="wprof-card" delay={80}>
                <h2>프로필 수정</h2>
                <form onSubmit={handleUpdateProfile}>
                  <div className="wprof-field">
                    <label>성명</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                  </div>

                  <div className="wprof-field">
                    <label>
                      <Phone size={16} />
                      전화번호
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={13}
                    />
                  </div>

                  <div className="wprof-field">
                    <label>
                      <Building2 size={16} />
                      소속 교회
                    </label>
                    <input type="text" name="church_name" value={formData.church_name} onChange={handleInputChange} />
                  </div>

                  <div className="wprof-field">
                    <label>교회 주소</label>
                    <input
                      type="text"
                      name="church_address"
                      value={formData.church_address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="wprof-field">
                    <label>소개</label>
                    <textarea name="bio" rows="4" value={formData.bio} onChange={handleInputChange} placeholder="자기소개를 입력해주세요..." />
                  </div>

                  <button type="submit" className="wh-btn wh-btn-primary" disabled={loading}>
                    <Save size={16} />
                    {loading ? '저장 중...' : '저장'}
                  </button>
                </form>
              </Reveal>
            </div>

            <div className="wprof-col">
              <Reveal as="div" className="wprof-card" delay={40}>
                <h2>비밀번호 변경</h2>
                <form onSubmit={handleChangePassword}>
                  <div className="wprof-field">
                    <label>새 비밀번호</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="8자 이상"
                    />
                  </div>
                  <div className="wprof-field">
                    <label>비밀번호 확인</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="비밀번호 재입력"
                    />
                  </div>
                  <button type="submit" className="wh-btn wh-btn-primary" disabled={loading}>
                    {loading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
              </Reveal>

              <Reveal as="div" className="wprof-card" delay={120}>
                <h2>
                  <Bell size={22} />
                  알림 설정
                </h2>
                <p className="wprof-notif-lead">
                  위위(WEWE)와 위위 스테이 알림을 각각 따로 켜고 끌 수 있습니다.
                </p>

                <div className="wprof-notif-list">
                  <div className="wprof-notif-row">
                    <div className="wprof-notif-info">
                      <span className="wprof-notif-label">위위(WEWE) 알림</span>
                      <span className="wprof-notif-desc">
                        사역 소식, 후원 안내 등 위위 홈페이지 소식을 이메일로 받습니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`wprof-toggle${notifWewe ? ' on' : ''}`}
                      onClick={() => setNotifWewe((v) => !v)}
                      aria-pressed={notifWewe}
                    >
                      <span className="wprof-toggle-knob" />
                    </button>
                  </div>

                  <div className="wprof-notif-row">
                    <div className="wprof-notif-info">
                      <span className="wprof-notif-label">위위 스테이 알림</span>
                      <span className="wprof-notif-desc">
                        예약, 승인, 메시지 등 위위 스테이 이용 관련 알림을 이메일로 받습니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`wprof-toggle${notifStay ? ' on' : ''}`}
                      onClick={() => setNotifStay((v) => !v)}
                      aria-pressed={notifStay}
                    >
                      <span className="wprof-toggle-knob" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="wh-btn wh-btn-primary"
                  style={{ marginTop: '1.5rem' }}
                  onClick={handleSaveNotifications}
                  disabled={notifSaving}
                >
                  <Save size={16} />
                  {notifSaving ? '저장 중...' : '알림 설정 저장'}
                </button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wprof-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 0;
          color: var(--wh-stone, #8c8880);
        }

        .wprof-section {
          flex: 1;
          padding: 4rem 0 6rem;
          background: var(--wh-bg-soft);
        }

        .wprof-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .wprof-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .wprof-card {
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          padding: 2rem;
        }

        .wprof-card h2 {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--wh-ink);
          font-size: 1.1rem;
          margin: 0 0 1.5rem;
        }

        .wprof-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .wprof-info-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .wprof-info-item label {
          font-weight: 700;
          color: var(--wh-stone);
          font-size: 0.85rem;
        }

        .wprof-info-item p {
          color: var(--wh-ink);
          margin: 0;
        }

        .wprof-field {
          margin-bottom: 1.25rem;
        }

        .wprof-field label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: var(--wh-ink);
          font-size: 0.9rem;
        }

        .wprof-field input,
        .wprof-field textarea {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border: 1px solid var(--wh-line);
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.95rem;
          background: var(--wh-bg);
          color: var(--wh-ink);
        }

        .wprof-field input:focus,
        .wprof-field textarea:focus {
          outline: none;
          border-color: var(--wh-orange);
          box-shadow: 0 0 0 3px rgba(217, 123, 63, 0.15);
        }

        .wprof-notif-lead {
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          margin: -0.75rem 0 1.25rem;
        }

        .wprof-notif-list {
          display: flex;
          flex-direction: column;
        }

        .wprof-notif-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--wh-line);
        }

        .wprof-notif-row:last-child {
          border-bottom: none;
        }

        .wprof-notif-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .wprof-notif-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--wh-ink);
        }

        .wprof-notif-desc {
          font-size: 0.8rem;
          color: var(--wh-stone);
          line-height: 1.5;
        }

        .wprof-toggle {
          flex-shrink: 0;
          width: 44px;
          height: 24px;
          border-radius: 12px;
          border: none;
          background: #dde0e3;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
          padding: 0;
        }

        .wprof-toggle.on {
          background: var(--wh-orange);
        }

        .wprof-toggle-knob {
          display: block;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: left 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .wprof-toggle.on .wprof-toggle-knob {
          left: 23px;
        }

        @media (max-width: 860px) {
          .wprof-grid {
            grid-template-columns: 1fr;
          }

          .wprof-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweProfilePage;
