import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { CheckCircle, XCircle, Eye, Mail, FileText, Trash2, Shield, ChevronDown, ChevronUp, MailWarning } from 'lucide-react';

// 계정 삭제 유예기간(일). Profile.jsx의 DELETION_GRACE_PERIOD_DAYS와 동일한 값이어야 함.
const DELETION_GRACE_PERIOD_DAYS = 15;

const ROLE_LABEL = { admin: '관리자', host: '호스트', missionary: '선교사' };
const BOOKING_STATUS_LABEL = { pending: '예약됨', confirmed: '예약 확정됨', cancelled: '취소됨' };
const BOOKING_STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-danger' };
const MEMBER_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'missionary', label: '선교사' },
  { key: 'host', label: '호스트' },
  { key: 'admin', label: '관리자' }
];

function AdminDashboard({ userProfile }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('all');
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [roleChangeBusyId, setRoleChangeBusyId] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [bookingStatusBusyId, setBookingStatusBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  // 탭 버튼에 표시되는 "항목 (숫자)" 배지용 카운트. 각 탭의 실제 데이터(users, accommodations 등)는
  // 해당 탭을 클릭했을 때만 불러오지만, 배지 숫자는 처음 페이지에 들어오자마자 전체 탭에 대해
  // 한 번에 조회해서 보여줘야 "클릭하기 전엔 0으로 보이는" 문제가 생기지 않습니다.
  const [counts, setCounts] = useState({
    users: 0,
    accommodations: 0,
    inquiries: 0,
    deletions: 0,
    members: 0,
    bookings: 0
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [docLoadingPath, setDocLoadingPath] = useState(null);
  const [deletionBusyId, setDeletionBusyId] = useState(null);
  const [resendBusyId, setResendBusyId] = useState(null);
  const [resendResult, setResendResult] = useState({}); // { [userId]: 'success' | 'error' }

  const isSuperAdmin = !!userProfile?.is_super_admin;

  // 검증 문서 파일명 추출 (저장 경로: {userId}/{timestamp}_{인덱스 또는 원본파일명}.{확장자})
  const getDocFileName = (path) => path.split('/').pop();

  // 비공개 버킷(verification-docs)의 문서를 서명된 URL로 열람
  const viewDocument = async (path) => {
    setDocLoadingPath(path);
    try {
      const { data, error } = await supabase.storage
        .from('verification-docs')
        .createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert('문서를 불러올 수 없습니다: ' + error.message);
    } finally {
      setDocLoadingPath(null);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 페이지에 처음 들어올 때 모든 탭의 배지 숫자를 한 번에 조회합니다.
  useEffect(() => {
    fetchAllCounts();
  }, []);

  const fetchAllCounts = async () => {
    try {
      const [usersRes, accRes, inqRes, delRes, memRes, bookRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('accommodations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).not('deletion_requested_at', 'is', null),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true })
      ]);
      setCounts({
        users: usersRes.count || 0,
        accommodations: accRes.count || 0,
        inquiries: inqRes.count || 0,
        deletions: delRes.count || 0,
        members: memRes.count || 0,
        bookings: bookRes.count || 0
      });
    } catch (error) {
      console.error('카운트 로드 오류:', error);
    }
  };

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
        setCounts(prev => ({ ...prev, users: (data || []).length }));
      } else if (activeTab === 'accommodations') {
        const { data } = await supabase
          .from('accommodations')
          .select('*, users(full_name, church_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setAccommodations(data || []);
        setCounts(prev => ({ ...prev, accommodations: (data || []).length }));
      } else if (activeTab === 'inquiries') {
        const { data } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });
        setInquiries(data || []);
        setCounts(prev => ({ ...prev, inquiries: (data || []).length }));
      } else if (activeTab === 'deletions') {
        const { data } = await supabase
          .from('users')
          .select('*')
          .not('deletion_requested_at', 'is', null)
          .order('deletion_requested_at', { ascending: true });
        setDeletionRequests(data || []);
        setCounts(prev => ({ ...prev, deletions: (data || []).length }));
      } else if (activeTab === 'members') {
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('role', { ascending: true })
          .order('full_name', { ascending: true });
        setMembers(data || []);
        setCounts(prev => ({ ...prev, members: (data || []).length }));
      } else if (activeTab === 'bookings') {
        // 문제가 생겼을 때 관리자가 직접 확인/조정할 수 있도록 모든 예약을 조회.
        const { data } = await supabase
          .from('bookings')
          .select('*, accommodations(id, title, location, host_id, users(full_name, email)), users(full_name, phone, church_name)')
          .order('created_at', { ascending: false });
        setAllBookings(data || []);
        setCounts(prev => ({ ...prev, bookings: (data || []).length }));
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const markInquiryContacted = async (inquiryId) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: 'contacted' })
        .eq('id', inquiryId);
      if (error) throw error;
      setInquiries(inquiries.map(i => i.id === inquiryId ? { ...i, status: 'contacted' } : i));
    } catch (error) {
      alert('오류: ' + error.message);
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
      setCounts(prev => ({ ...prev, users: Math.max(0, prev.users - 1) }));
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
      setCounts(prev => ({ ...prev, users: Math.max(0, prev.users - 1) }));
      setSelectedItem(null);
      setRejectionReason('');
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  // 이메일 인증이 오래 지연되는 가입자에게 관리자가 직접 인증 메일을 재발송
  const resendVerificationEmail = async (user) => {
    setResendBusyId(user.id);
    setResendResult(prev => ({ ...prev, [user.id]: null }));
    try {
      const { data: token, error: tokenError } = await supabase.rpc('create_email_verification_token', {
        p_user_id: user.id
      });
      if (tokenError) throw tokenError;

      const link = `${window.location.origin}/verify-email?token=${token}`;
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: { type: 'email_verification', userId: user.id, link }
      });
      if (emailError) throw emailError;

      setResendResult(prev => ({ ...prev, [user.id]: 'success' }));
    } catch (error) {
      console.error('인증 메일 재발송 오류:', error);
      setResendResult(prev => ({ ...prev, [user.id]: 'error' }));
    } finally {
      setResendBusyId(null);
    }
  };

  // 계정 삭제 요청을 즉시 승인 — 15일을 기다리지 않고 지금 바로 계정과 관련 데이터를 영구 삭제합니다.
  const approveAccountDeletion = async (user) => {
    if (!window.confirm(`${user.full_name}(${user.email}) 계정을 지금 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setDeletionBusyId(user.id);
    try {
      const { error } = await supabase.rpc('admin_delete_user_account', {
        target_user_id: user.id
      });
      if (error) throw error;
      setDeletionRequests(deletionRequests.filter(u => u.id !== user.id));
      setMembers(members.filter(m => m.id !== user.id));
      setCounts(prev => ({
        ...prev,
        deletions: Math.max(0, prev.deletions - 1),
        members: Math.max(0, prev.members - 1)
      }));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setDeletionBusyId(null);
    }
  };

  // 회원 역할 변경(관리자 권한 부여/해제 포함) — DB 트리거가 최고 관리자만 role을
  // 'admin'으로/에서 변경할 수 있도록 강제하므로, 최고 관리자가 아닌 계정이 시도하면
  // 서버에서 거부되고 그 에러 메시지가 그대로 alert로 노출됩니다.
  const changeMemberRole = async (member, newRole) => {
    if (newRole === member.role) return;
    if (!window.confirm(`${member.full_name}(${member.email})님의 역할을 '${ROLE_LABEL[newRole]}'(으)로 변경하시겠습니까?`)) {
      return;
    }
    setRoleChangeBusyId(member.id);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', member.id);
      if (error) throw error;
      setMembers(members.map(m => (m.id === member.id ? { ...m, role: newRole } : m)));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setRoleChangeBusyId(null);
    }
  };

  const visibleMembers = members.filter(m => memberFilter === 'all' || m.role === memberFilter);

  // 관리자가 문제가 생긴 예약을 직접 확정/취소/되돌리기 할 수 있도록 하는 조정 기능.
  const changeBookingStatus = async (booking, newStatus) => {
    if (newStatus === booking.status) return;
    if (!window.confirm(`이 예약의 상태를 '${BOOKING_STATUS_LABEL[newStatus]}'(으)로 변경하시겠습니까?`)) return;
    setBookingStatusBusyId(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);
      if (error) throw error;
      setAllBookings(allBookings.map(b => (b.id === booking.id ? { ...b, status: newStatus } : b)));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setBookingStatusBusyId(null);
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
            승인 대기 사용자 ({counts.users})
          </button>
          <button
            className={`tab ${activeTab === 'accommodations' ? 'active' : ''}`}
            onClick={() => setActiveTab('accommodations')}
          >
            승인 대기 숙소 ({counts.accommodations})
          </button>
          <button
            className={`tab ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            문의 ({counts.inquiries})
          </button>
          <button
            className={`tab ${activeTab === 'deletions' ? 'active' : ''}`}
            onClick={() => setActiveTab('deletions')}
          >
            계정 삭제 요청 ({counts.deletions})
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            전체 회원 ({counts.members})
          </button>
          <button
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            전체 예약 ({counts.bookings})
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
                      <div className="header-badges">
                        <span className="badge badge-warning">검토 중</span>
                        <span className={`badge ${user.email_verified_at ? 'badge-success' : 'badge-danger'}`}>
                          {user.email_verified_at ? '이메일 인증됨' : '이메일 미인증'}
                        </span>
                      </div>
                    </div>
                    <div className="user-info">
                      <p><strong>이메일:</strong> {user.email}</p>
                      <p><strong>교회:</strong> {user.church_name}</p>
                      <p><strong>주소:</strong> {user.church_address || '미입력'}</p>
                      <p><strong>전화:</strong> {user.phone}</p>
                                            <p><strong>역할:</strong> {user.role === 'admin' ? '관리자' : user.role === 'missionary' ? '선교사' : '숙소 제공자'}</p>
                      <p><strong>가입일:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>

                    {user.verification_docs && user.verification_docs.length > 0 && (
                      <div className="verification-docs">
                        <h4>검증 문서 ({user.verification_docs.length}개):</h4>
                        <ul className="doc-list">
                          {user.verification_docs.map((docPath) => (
                            <li key={docPath}>
                              <button
                                type="button"
                                className="doc-link"
                                onClick={() => viewDocument(docPath)}
                                disabled={docLoadingPath === docPath}
                              >
                                <FileText size={15} />
                                <span>{docLoadingPath === docPath ? '여는 중...' : getDocFileName(docPath)}</span>
                                <Eye size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!user.email_verified_at && (
                      <div className="resend-row">
                        <button
                          type="button"
                          className="btn btn-secondary resend-btn"
                          onClick={() => resendVerificationEmail(user)}
                          disabled={resendBusyId === user.id}
                        >
                          <MailWarning size={16} />
                          {resendBusyId === user.id ? '발송 중...' : '인증 메일 재발송'}
                        </button>
                        {resendResult[user.id] === 'success' && (
                          <span className="resend-success">인증 안내 메일을 다시 보냈습니다.</span>
                        )}
                        {resendResult[user.id] === 'error' && (
                          <span className="resend-error">발송에 실패했습니다. 잠시 후 다시 시도해주세요.</span>
                        )}
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
                      <p><strong>사진:</strong> {acc.images?.length || 0}장</p>
                      <p><strong>편의시설:</strong> {acc.amenities?.join(', ')}</p>
                    </div>

                    <div className="action-buttons">
                      <Link to={`/accommodations/${acc.id}`} className="btn btn-primary">
                        <Eye size={16} />
                        실제 페이지에서 검토하기
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 랜딩 페이지 문의 */}
        {activeTab === 'inquiries' && (
          <div className="review-section">
            {loading ? (
              <p>로드 중...</p>
            ) : inquiries.length === 0 ? (
              <p className="empty-message">접수된 문의가 없습니다.</p>
            ) : (
              <div className="grid grid-2">
                {inquiries.map(inquiry => (
                  <div key={inquiry.id} className="card inquiry-card">
                    <div className="card-header">
                      <h3>{inquiry.name}</h3>
                      <span className={`badge ${inquiry.status === 'contacted' ? 'badge-info' : 'badge-warning'}`}>
                        {inquiry.status === 'contacted' ? '연락함' : '신규 문의'}
                      </span>
                    </div>
                    <div className="user-info">
                      <p><strong>이메일:</strong> {inquiry.email}</p>
                      <p><strong>전화:</strong> {inquiry.phone}</p>
                      {inquiry.message && <p><strong>메시지:</strong> {inquiry.message}</p>}
                      <p><strong>접수일:</strong> {new Date(inquiry.created_at).toLocaleDateString()}</p>
                    </div>

                    {inquiry.status !== 'contacted' && (
                      <div className="action-buttons">
                        <button
                          className="btn btn-success"
                          onClick={() => markInquiryContacted(inquiry.id)}
                        >
                          <Mail size={16} />
                          연락 완료로 표시
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 계정 삭제 요청 */}
        {activeTab === 'deletions' && (
          <div className="review-section">
            {loading ? (
              <p>로드 중...</p>
            ) : deletionRequests.length === 0 ? (
              <p className="empty-message">대기 중인 계정 삭제 요청이 없습니다.</p>
            ) : (
              <div className="grid grid-2">
                {deletionRequests.map(user => {
                  const requestedAt = new Date(user.deletion_requested_at);
                  const scheduledFor = new Date(
                    requestedAt.getTime() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
                  );
                  return (
                    <div key={user.id} className="card user-card">
                      <div className="card-header">
                        <h3>{user.full_name}</h3>
                        <span className="badge badge-danger">삭제 예정</span>
                      </div>
                      <div className="user-info">
                        <p><strong>이메일:</strong> {user.email}</p>
                        <p><strong>역할:</strong> {user.role === 'admin' ? '관리자' : user.role === 'missionary' ? '선교사' : '숙소 제공자'}</p>
                        <p><strong>삭제 요청일:</strong> {requestedAt.toLocaleDateString()}</p>
                        <p><strong>자동 삭제 예정일:</strong> {scheduledFor.toLocaleDateString()}</p>
                      </div>

                      <div className="action-buttons">
                        <button
                          className="btn btn-danger"
                          onClick={() => approveAccountDeletion(user)}
                          disabled={deletionBusyId === user.id}
                        >
                          <Trash2 size={16} />
                          {deletionBusyId === user.id ? '삭제 중...' : '지금 삭제 승인'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 전체 회원 관리 */}
        {activeTab === 'members' && (
          <div className="review-section">
            <div className="member-filters">
              {MEMBER_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`member-filter ${memberFilter === f.key ? 'active' : ''}`}
                  onClick={() => setMemberFilter(f.key)}
                >
                  {f.label} ({f.key === 'all' ? members.length : members.filter(m => m.role === f.key).length})
                </button>
              ))}
            </div>

            {!isSuperAdmin && (
              <p className="member-notice">
                관리자 권한 부여/해제는 최고 관리자만 할 수 있습니다. 회원 정보 열람은 가능합니다.
              </p>
            )}

            {loading ? (
              <p>로드 중...</p>
            ) : visibleMembers.length === 0 ? (
              <p className="empty-message">해당하는 회원이 없습니다.</p>
            ) : (
              <div className="member-list">
                {visibleMembers.map(member => {
                  const expanded = expandedMemberId === member.id;
                  const isSelf = member.id === userProfile?.id;
                  return (
                    <div key={member.id} className="card member-card">
                      <div
                        className="member-card-header"
                        onClick={() => setExpandedMemberId(expanded ? null : member.id)}
                      >
                        <div className="member-basic">
                          <h3>{member.full_name}</h3>
                          <span className="member-email">{member.email}</span>
                        </div>
                        <div className="member-badges">
                          {member.is_super_admin && (
                            <span className="badge badge-super-admin">
                              <Shield size={13} /> 최고 관리자
                            </span>
                          )}
                          <span className={`badge role-badge role-${member.role}`}>
                            {ROLE_LABEL[member.role] || member.role}
                          </span>
                          <span className={`badge ${
                            member.status === 'approved' ? 'badge-success' :
                            member.status === 'pending' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {member.status === 'approved' ? '승인됨' : member.status === 'pending' ? '검토 중' : '거절됨'}
                          </span>
                          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {expanded && (
                        <div className="member-detail">
                          <div className="user-info">
                            <p><strong>교회:</strong> {member.church_name || '미입력'}</p>
                            <p><strong>교회 주소:</strong> {member.church_address || '미입력'}</p>
                            <p><strong>전화:</strong> {member.phone || '미입력'}</p>
                            <p><strong>소개:</strong> {member.bio || '미입력'}</p>
                            <p><strong>가입일:</strong> {new Date(member.created_at).toLocaleDateString()}</p>
                            {member.deletion_requested_at && (
                              <p className="member-deletion-notice">
                                <strong>⚠️ 계정 삭제 요청됨:</strong> {new Date(member.deletion_requested_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {member.verification_docs && member.verification_docs.length > 0 && (
                            <div className="verification-docs">
                              <h4>검증 문서 ({member.verification_docs.length}개):</h4>
                              <ul className="doc-list">
                                {member.verification_docs.map((docPath) => (
                                  <li key={docPath}>
                                    <button
                                      type="button"
                                      className="doc-link"
                                      onClick={() => viewDocument(docPath)}
                                      disabled={docLoadingPath === docPath}
                                    >
                                      <FileText size={15} />
                                      <span>{docLoadingPath === docPath ? '여는 중...' : getDocFileName(docPath)}</span>
                                      <Eye size={14} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {isSuperAdmin && !member.is_super_admin && (
                            <div className="role-change-row">
                              <label>역할 변경:</label>
                              <select
                                value={member.role}
                                disabled={roleChangeBusyId === member.id}
                                onChange={(e) => changeMemberRole(member, e.target.value)}
                              >
                                <option value="missionary">선교사</option>
                                <option value="host">호스트</option>
                                <option value="admin">관리자</option>
                              </select>
                              {roleChangeBusyId === member.id && <span className="role-change-busy">변경 중...</span>}
                            </div>
                          )}
                          {member.is_super_admin && (
                            <p className="member-notice">최고 관리자 본인 계정의 역할은 이 화면에서 변경할 수 없습니다.</p>
                          )}
                          {isSelf && !member.is_super_admin && (
                            <p className="member-notice">본인 계정입니다.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 전체 예약 관리 (문제 발생 시 관리자가 직접 확정/취소/조정) */}
        {activeTab === 'bookings' && (
          <div className="review-section">
            <p className="member-notice">
              모든 호스트의 예약을 확인하고, 문제가 있을 때 상태를 직접 조정할 수 있습니다.
            </p>
            {loading ? (
              <p>로드 중...</p>
            ) : allBookings.length === 0 ? (
              <p className="empty-message">등록된 예약이 없습니다.</p>
            ) : (
              <div className="grid grid-2">
                {allBookings.map(booking => (
                  <div key={booking.id} className="card booking-admin-card">
                    <div className="card-header">
                      <h3>{booking.accommodations?.title || '삭제된 숙소'}</h3>
                      <span className={`badge ${BOOKING_STATUS_BADGE[booking.status] || 'badge-info'}`}>
                        {BOOKING_STATUS_LABEL[booking.status] || booking.status}
                      </span>
                    </div>
                    <div className="user-info">
                      <p><strong>위치:</strong> {booking.accommodations?.location || '-'}</p>
                      <p><strong>호스트:</strong> {booking.accommodations?.users?.full_name || '알 수 없음'}</p>
                      <p><strong>예약자:</strong> {booking.users?.full_name || '알 수 없음'} {booking.users?.phone ? `(${booking.users.phone})` : ''}</p>
                      <p><strong>일정:</strong> {booking.check_in} ~ {booking.check_out}</p>
                      <p><strong>금액:</strong> ₩{booking.total_price?.toLocaleString()}</p>
                    </div>
                    <div className="role-change-row">
                      <label>상태 조정:</label>
                      <select
                        value={booking.status}
                        disabled={bookingStatusBusyId === booking.id}
                        onChange={(e) => changeBookingStatus(booking, e.target.value)}
                      >
                        <option value="pending">예약됨</option>
                        <option value="confirmed">예약 확정됨</option>
                        <option value="cancelled">취소됨</option>
                      </select>
                      {bookingStatusBusyId === booking.id && <span className="role-change-busy">변경 중...</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 숙소 상세 검토 모달 — 승인 전에 전체 내용/사진을 확인합니다 */}
        {/* 거절 모달 (사용자 승인 거절용) */}
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
                  onClick={() => rejectUser(selectedItem.id)}
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
          color: #16808E;
          border-bottom-color: #16808E;
        }

        .review-section {
          margin-top: 2rem;
        }

        .user-card, .accommodation-card, .inquiry-card, .booking-admin-card {
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

        .doc-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .doc-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          background: #f0f9fa;
          border: 1px solid #cceaec;
          color: #106570;
          padding: 0.6rem 0.9rem;
          border-radius: 6px;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .doc-link span {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-decoration: underline;
        }

        .doc-link:hover {
          background: #e6f4f5;
          border-color: #16808E;
        }

        .doc-link:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .header-badges {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .resend-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
        }

        .resend-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .resend-success {
          color: #1e8a4c;
          font-size: 0.85rem;
        }

        .resend-error {
          color: #e74c3c;
          font-size: 0.85rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .action-buttons button,
        .action-buttons a {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-decoration: none;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .member-filters {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }

        .member-filter {
          background: white;
          border: 1px solid #dfe6e9;
          border-radius: 20px;
          padding: 0.5rem 1.1rem;
          font-size: 0.88rem;
          color: #7f8c8d;
          cursor: pointer;
          transition: all 0.2s;
        }

        .member-filter:hover {
          border-color: #16808E;
          color: #16808E;
        }

        .member-filter.active {
          background: #16808E;
          border-color: #16808E;
          color: white;
        }

        .member-notice {
          background: #fff8e6;
          color: #8a6d1f;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .member-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .member-card {
          padding: 0;
          overflow: hidden;
        }

        .member-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          flex-wrap: wrap;
        }

        .member-basic h3 {
          margin: 0 0 0.25rem;
          color: #2c3e50;
        }

        .member-email {
          color: #7f8c8d;
          font-size: 0.85rem;
        }

        .member-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .badge-super-admin {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #2c3e50;
          color: white;
        }

        .role-badge.role-admin {
          background: #106570;
          color: white;
        }

        .role-badge.role-host {
          background: #16808E;
          color: white;
        }

        .role-badge.role-missionary {
          background: #d97b3f;
          color: white;
        }

        .member-detail {
          padding: 0 1.5rem 1.5rem;
          border-top: 1px solid #ecf0f1;
        }

        .member-deletion-notice {
          color: #e74c3c;
        }

        .role-change-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
        }

        .role-change-row label {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .role-change-row select {
          padding: 0.4rem 0.75rem;
          border: 1px solid #dfe6e9;
          border-radius: 6px;
        }

        .role-change-busy {
          font-size: 0.85rem;
          color: #7f8c8d;
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
