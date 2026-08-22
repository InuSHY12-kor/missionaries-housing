import React, { useState } from 'react';
import { supabase } from '../App';
import { User, Phone, Building2, Save } from 'lucide-react';
import PageHero from '../components/PageHero';

// 프로필 페이지 상단 슬라이드 배너 사진
const PROFILE_HERO_IMAGES = [
  'https://images.pexels.com/photos/164645/pexels-photo-164645.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/7235804/pexels-photo-7235804.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/2305123/pexels-photo-2305123.jpeg?auto=compress&cs=tinysrgb&w=1600'
];

const DELETION_GRACE_PERIOD_DAYS = 15;

function roleLabel(profile) {
  if (profile?.role === 'admin') {
    return profile?.is_super_admin ? '최고 관리자' : '관리자';
  }
  if (profile?.role === 'missionary') return '선교사';
  if (profile?.role === 'host') return '호스트';
  return '알 수 없음';
}

function Profile({ userProfile }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
    church_name: userProfile?.church_name || '',
    church_address: userProfile?.church_address || '',
    bio: userProfile?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 계정 삭제 요청(유예기간) 상태 — null이면 삭제 요청 없음.
  const [deletionRequestedAt, setDeletionRequestedAt] = useState(
    userProfile?.deletion_requested_at || null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionBusy, setDeletionBusy] = useState(false);

  const deletionScheduledFor = deletionRequestedAt
    ? new Date(
        new Date(deletionRequestedAt).getTime() +
          DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      )
    : null;

  const requestAccountDeletion = async () => {
    setDeletionBusy(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('users')
        .update({ deletion_requested_at: nowIso })
        .eq('id', userProfile.id);

      if (error) throw error;
      setDeletionRequestedAt(nowIso);
      setShowDeleteModal(false);
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setDeletionBusy(false);
    }
  };

  const cancelAccountDeletion = async () => {
    setDeletionBusy(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ deletion_requested_at: null })
        .eq('id', userProfile.id);

      if (error) throw error;
      setDeletionRequestedAt(null);
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setDeletionBusy(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update(formData)
        .eq('id', userProfile.id);

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
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      alert('비밀번호가 변경되었습니다!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <PageHero
        images={PROFILE_HERO_IMAGES}
        eyebrow="MY PROFILE"
        title="나의 정보를 관리하세요"
        subtitle="계정 정보를 최신 상태로 유지해주세요."
      />
      <div className="container">
        <h1>프로필</h1>

        <div className="profile-grid">
          {/* 왼쪽: 기본 정보 */}
          <div className="profile-section">
            <div className="section-card">
              <h2>
                <User size={24} />
                기본 정보
              </h2>

              <div className="profile-info">
                <div className="info-item">
                  <label>이메일</label>
                  <p>{userProfile?.email}</p>
                </div>

                <div className="info-item">
                  <label>역할</label>
                  <p>{roleLabel(userProfile)}</p>
                </div>

                <div className="info-item">
                  <label>가입일</label>
                  <p>{new Date(userProfile?.created_at).toLocaleDateString()}</p>
                </div>

                <div className="info-item">
                  <label>상태</label>
                  <div className="status-badge" style={{
                    background: userProfile?.status === 'approved' ? '#27ae60' :
                               userProfile?.status === 'pending' ? '#f39c12' : '#e74c3c',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    display: 'inline-block',
                    fontSize: '0.85rem'
                  }}>
                    {userProfile?.status === 'approved' ? '승인됨' :
                     userProfile?.status === 'pending' ? '검토 중' : '거절됨'}
                  </div>
                </div>
              </div>
            </div>

            {/* 프로필 수정 */}
            <div className="section-card">
              <h2>프로필 수정</h2>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>성명</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={18} />
                    전화번호
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Building2 size={18} />
                    소속 교회
                  </label>
                  <input
                    type="text"
                    name="church_name"
                    value={formData.church_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>교회 주소</label>
                  <input
                    type="text"
                    name="church_address"
                    value={formData.church_address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>소개</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="자기소개를 입력해주세요..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={18} />
                  {loading ? '저장 중...' : '저장'}
                </button>
              </form>
            </div>
          </div>

          {/* 오른쪽: 보안 설정 */}
          <div className="profile-section">
            <div className="section-card">
              <h2>비밀번호 변경</h2>

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="8자 이상"
                  />
                </div>

                <div className="form-group">
                  <label>비밀번호 확인</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="비밀번호 재입력"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* 계정 삭제 — 눈에 띄지 않도록 페이지 가장 하단에 작게 배치 */}
        <div className="account-deletion-footer">
          {deletionRequestedAt ? (
            <p>
              계정 삭제가 예정되어 있습니다 ({deletionScheduledFor.toLocaleDateString()}에 자동 삭제,
              또는 관리자 승인 시 그 전에 삭제될 수 있습니다).{' '}
              <button
                type="button"
                className="link-button"
                onClick={cancelAccountDeletion}
                disabled={deletionBusy}
              >
                {deletionBusy ? '처리 중...' : '삭제 취소'}
              </button>
            </p>
          ) : (
            <button
              type="button"
              className="link-button"
              onClick={() => setShowDeleteModal(true)}
            >
              계정 삭제
            </button>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>계정 삭제를 요청하시겠어요?</h2>
            </div>
            <p>
              삭제를 요청하면 오늘로부터 {DELETION_GRACE_PERIOD_DAYS}일 후 계정과 관련된 모든 데이터가
              자동으로 영구 삭제됩니다(관리자가 먼저 승인하면 그 전에 삭제될 수도 있습니다). 그 전까지는
              계정을 정상적으로 계속 이용할 수 있고, 언제든지 이 페이지에서 삭제 요청을 취소할 수 있습니다.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={requestAccountDeletion}
                disabled={deletionBusy}
              >
                {deletionBusy ? '요청 중...' : '삭제 요청'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletionBusy}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page {
          flex: 1;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }

        .profile-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-card h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #2c3e50;
          margin-bottom: 1.5rem;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-item label {
          font-weight: 600;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .info-item p {
          color: #2c3e50;
          margin: 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #d97b3f;
        }

        .account-deletion-footer {
          margin-top: 3rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
          text-align: center;
        }

        .account-deletion-footer p {
          font-size: 0.8rem;
          color: #adb5bd;
          margin: 0;
        }

        .link-button {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.8rem;
          color: #adb5bd;
          text-decoration: underline;
          cursor: pointer;
        }

        .link-button:hover {
          color: #e74c3c;
        }

        .link-button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .modal p {
          color: #555;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
