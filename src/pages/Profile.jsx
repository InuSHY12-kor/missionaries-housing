import React, { useState } from 'react';
import { supabase } from '../App';
import { User, Phone, Building2, Save } from 'lucide-react';

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
                  <p>{userProfile?.role === 'missionary' ? '선교사' : '호스트'}</p>
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

            {/* 계정 통계 */}
            <div className="section-card">
              <h2>계정 활동</h2>

              <div className="stats">
                <div className="stat">
                  <p className="stat-label">호스트 등급</p>
                  <p className="stat-value">★★★★★</p>
                </div>
                <div className="stat">
                  <p className="stat-label">총 예약 수</p>
                  <p className="stat-value">12</p>
                </div>
                <div className="stat">
                  <p className="stat-label">리뷰 평점</p>
                  <p className="stat-value">4.8</p>
                </div>
              </div>
            </div>

            {/* 위험 구역 */}
            <div className="section-card danger">
              <h2>위험 구역</h2>

              <div className="danger-section">
                <p>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
                <button type="button" className="btn btn-danger">
                  계정 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        .section-card.danger {
          border-left: 4px solid #e74c3c;
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
          border-color: #667eea;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .stat {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .stat-label {
          color: #7f8c8d;
          font-size: 0.85rem;
          margin: 0;
        }

        .stat-value {
          color: #667eea;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.5rem 0 0;
        }

        .danger-section {
          background: #fadbd8;
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
        }

        .danger-section p {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .danger-section button {
          width: 100%;
        }

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
