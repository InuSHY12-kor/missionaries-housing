import React, { useState, useEffect } from 'react';
import { supabase } from '../App';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setUsers(data || []);
      } else {
        const { data } = await supabase
          .from('accommodations')
          .select('*, users(full_name, church_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setAccommodations(data || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', userId);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const rejectUser = async (userId) => {
    if (!rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', userId);
      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      setSelectedItem(null);
      setRejectionReason('');
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const approveAccommodation = async (accommodationId) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ status: 'approved' })
        .eq('id', accommodationId);
      if (error) throw error;
      setAccommodations(accommodations.filter(a => a.id !== accommodationId));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const rejectAccommodation = async (accommodationId) => {
    if (!rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', accommodationId);
      if (error) throw error;
      setAccommodations(accommodations.filter(a => a.id !== accommodationId));
      setSelectedItem(null);
      setRejectionReason('');
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>관리자 대시보드</h1>

        {/* 탭 */}
        <div className="admin-tabs">
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            승인 대기 사용자 ({users.length})
          </button>
          <button
            className={`tab ${activeTab === 'accommodations' ? 'active' : ''}`}
            onClick={() => setActiveTab('accommodations')}
          >
            승인 대기 숙소 ({accommodations.length})
          </button>
        </div>

        {/* 사용자 검토 */}
        {activeTab === 'users' && (
          <div className="review-section">
            {loading ? (
              <p>로드 중...</p>
            ) : users.length === 0 ? (
              <p className="empty-message">검토 대기 중인 사용자가 없습니다.</p>
            ) : (
              <div className="grid grid-2">
                {users.map(user => (
                  <div key={user.id} className="card user-card">
                    <div className="card-header">
                      <h3>{user.full_name}</h3>
                      <span className="badge badge-warning">검토 중</span>
                    </div>
                    <div className="user-info">
                      <p><strong>이메일:</strong> {user.email}</p>
                      <p><strong>교회:</strong> {user.church_name}</p>
                      <p><strong>주소:</strong> {user.church_address || '미입력'}</p>
                      <p><strong>전화:</strong> {user.phone}</p>
                      <p><strong>역할:</strong> {user.role === 'missionary' ? '선교사' : '호스트'}</p>
                      <p><strong>가입일:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>

                    {user.verification_docs && (
                      <div className="verification-docs">
                        <h4>검증 문서:</h4>
                        <button className="btn btn-secondary" onClick={() => setSelectedItem(user)}>
                          <Eye size={16} />
                          문서 보기
                        </button>
                      </div>
                    )}

                    <div className="action-buttons">
                      <button
                        className="btn btn-success"
                        onClick={() => approveUser(user.id)}
                      >
                        <CheckCircle size={16} />
                        승인
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setSelectedItem(user)}
                      >
                        <XCircle size={16} />
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 숙소 검토 */}
        {activeTab === 'accommodations' && (
          <div className="review-section">
            {loading ? (
              <p>로드 중...</p>
            ) : accommodations.length === 0 ? (
              <p className="empty-message">검토 대기 중인 숙소가 없습니다.</p>
            ) : (
              <div className="grid grid-2">
                {accommodations.map(acc => (
                  <div key={acc.id} className="card accommodation-card">
                    <div className="card-header">
                      <h3>{acc.title}</h3>
                      <span className="badge badge-warning">검토 중</span>
                    </div>
                    <div className="accommodation-info">
                      <p><strong>호스트:</strong> {acc.users?.full_name}</p>
                      <p><strong>위치:</strong> {acc.location}</p>
                      <p><strong>가격:</strong> ₩{acc.price?.toLocaleString()}/일</p>
                      <p><strong>설명:</strong> {acc.description?.substring(0, 100)}...</p>
                      <p><strong>수용인원:</strong> {acc.capacity}명</p>
                      <p><strong>편의시설:</strong> {acc.amenities?.join(', ')}</p>
                    </div>

                    <div className="action-buttons">
                      <button
                        className="btn btn-success"
                        onClick={() => approveAccommodation(acc.id)}
                      >
                        <CheckCircle size={16} />
                        승인
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setSelectedItem(acc)}
                      >
                        <XCircle size={16} />
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 거절 모달 */}
        {selectedItem && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>거절 사유 입력</h2>
              </div>
              <div className="form-group">
                <label>거절 사유 *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="거절 사유를 자세히 입력해주세요..."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (activeTab === 'users') {
                      rejectUser(selectedItem.id);
                    } else {
                      rejectAccommodation(selectedItem.id);
                    }
                  }}
                >
                  거절
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedItem(null);
                    setRejectionReason('');
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-dashboard {
          flex: 1;
        }

        .admin-tabs {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
          border-bottom: 2px solid #ecf0f1;
        }

        .tab {
          background: none;
          border: none;
          padding: 1rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          color: #7f8c8d;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .review-section {
          margin-top: 2rem;
        }

        .user-card, .accommodation-card {
          display: flex;
          flex-direction: column;
        }

        .user-info, .accommodation-info {
          flex: 1;
          padding: 1rem 0;
          border-top: 1px solid #ecf0f1;
          border-bottom: 1px solid #ecf0f1;
        }

        .user-info p, .accommodation-info p {
          margin: 0.5rem 0;
          font-size: 0.95rem;
        }

        .verification-docs {
          padding: 1rem 0;
          border-bottom: 1px solid #ecf0f1;
        }

        .verification-docs h4 {
          margin-bottom: 0.75rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .action-buttons button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .modal-actions button {
          flex: 0 1 auto;
          min-width: 100px;
        }

        @media (max-width: 768px) {
          .admin-tabs {
            flex-wrap: wrap;
          }

          .tab {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
