import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../App';
import { CheckCircle, XCircle, Eye, Mail, FileText, Trash2, Shield, ChevronDown, ChevronUp, MailWarning, Plus, Pencil } from 'lucide-react';
import PageHero from '../components/PageHero';
import AmenityIcon from '../components/AmenityIcon';
import { AMENITY_MAP } from '../utils/amenities';

const ADMIN_HERO_IMAGES = [
  'https://images.pexels.com/photos/8353764/pexels-photo-8353764.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/15616259/pexels-photo-15616259.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/8297536/pexels-photo-8297536.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 계정 삭제 유예기간(일). Profile.jsx의 DELETION_GRACE_PERIOD_DAYS와 동일한 값이어야 함.
const DELETION_GRACE_PERIOD_DAYS = 15;

const ROLE_LABEL = { admin: '관리자', host: '호스트', missionary: '선교사', supporter: '후원자' };
const BOOKING_STATUS_LABEL = { pending: '예약됨', confirmed: '예약 확정됨', cancelled: '취소됨' };
const BOOKING_STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-danger' };
// 예약이 확정(confirmed)된 후, 게스트의 숙박비 결제가 완료됐는지 여부를 관리자가 확인할 수 있는 배지.
const PAYMENT_STATUS_LABEL = { unpaid: '미결제', paid: '결제 완료', refunded: '환불됨' };
const PAYMENT_STATUS_BADGE = { unpaid: 'badge-warning', paid: 'badge-success', refunded: 'badge-info' };
const MEMBER_FILTERS = [
  { key: 'all', label: '전체', test: () => true },
  { key: 'missionary', label: '선교사', test: (m) => m.role === 'missionary' },
  { key: 'host', label: '호스트', test: (m) => m.role === 'host' },
  { key: 'supporter', label: '후원자', test: (m) => m.role === 'supporter' },
  { key: 'admin', label: '관리자', test: (m) => m.role === 'admin' },
  { key: 'withdrawn', label: '탈퇴 회원', test: (m) => m.status === 'withdrawn' },
  { key: 'deletion_pending', label: '삭제 대기', test: (m) => m.status === 'deletion_pending' }
];

// 다른 페이지(마이페이지 통계 카드 등)에서 /admin?tab=bookings 처럼 특정 탭으로 바로
// 이동할 수 있도록 지원하는 탭 키 목록.
const VALID_TABS = ['users', 'accommodations', 'inquiries', 'deletions', 'members', 'bookings', 'posts'];
const POST_STATUS_LABEL = { draft: '임시저장', published: '발행됨' };
const POST_STATUS_BADGE = { draft: 'badge-neutral', published: 'badge-success' };

function AdminDashboard({ userProfile }) {
  const [searchParams] = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'users';
  const [activeTab, setActiveTab] = useState(initialTab);
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
  const [posts, setPosts] = useState([]);
  const [postBusyId, setPostBusyId] = useState(null);
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
    bookings: 0,
    posts: 0
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [docLoadingPath, setDocLoadingPath] = useState(null);
  const [deletionBusyId, setDeletionBusyId] = useState(null);
  const [resendBusyId, setResendBusyId] = useState(null);
  const [resendResult, setResendResult] = useState({}); // { [userId]: 'success' | 'error' }
  // 관리자가 사유를 입력해 회원을 직접 삭제 처리하는 모달 상태
  const [deleteReasonMember, setDeleteReasonMember] = useState(null);
  const [deleteReasonText, setDeleteReasonText] = useState('');
  const [deleteFlagBusyId, setDeleteFlagBusyId] = useState(null);

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

  // 관리자 대시보드는 /admin 경로 하나만 사용하므로, 다른 화면(마이페이지 통계 카드 등)에서
  // 쿼리스트링(예: /admin?tab=bookings)으로 이동해 오는 경우 이미 관리자 대시보드가 마운트되어
  // 있어도(예: 같은 페이지에서 다시 이동) 요청한 탭으로 전환되도록 동기화합니다.
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchAllCounts = async () => {
    try {
      const [usersRes, accRes, inqRes, delRes, memRes, bookRes, postRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('accommodations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).not('deletion_requested_at', 'is', null).not('status', 'in', '(withdrawn,deletion_pending)'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('ministry_posts').select('*', { count: 'exact', head: true })
      ]);
      setCounts({
        users: usersRes.count || 0,
        accommodations: accRes.count || 0,
        inquiries: inqRes.count || 0,
        deletions: delRes.count || 0,
        members: memRes.count || 0,
        bookings: bookRes.count || 0,
        posts: postRes.count || 0
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
        // 아직 유예기간이 지나지 않은 "탈퇴 요청" 건만 표시합니다. 유예기간이 지나거나
        // 관리자가 승인해 이미 탈퇴(withdrawn) 처리된 회원은 "전체 회원" 탭의 '탈퇴 회원'
        // 필터에서 확인할 수 있습니다.
        const { data } = await supabase
          .from('users')
          .select('*')
          .not('deletion_requested_at', 'is', null)
          .not('status', 'in', '(withdrawn,deletion_pending)')
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
      } else if (activeTab === 'posts') {
        const { data } = await supabase
          .from('ministry_posts')
          .select('*, users(full_name)')
          .order('created_at', { ascending: false });
        setPosts(data || []);
        setCounts(prev => ({ ...prev, posts: (data || []).length }));
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

      const link = `${window.location.origin}/stay/verify-email?token=${token}`;
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

  // 계정 삭제 요청을 즉시 승인 — 15일 유예기간을 기다리지 않고 지금 바로 탈퇴(withdrawn) 처리합니다.
  // 탈퇴 처리된 계정은 즉시 삭제되지 않고, 그 시점부터 5년간 개인정보가 보관된 뒤 자동으로
  // 완전히 삭제됩니다(process_expired_account_deletions 배치가 매일 처리).
  const approveAccountDeletion = async (user) => {
    if (!window.confirm(`${user.full_name}(${user.email}) 계정을 지금 탈퇴 처리하시겠습니까? 탈퇴 처리 후에는 5년간 개인정보가 보관된 뒤 자동으로 완전히 삭제됩니다.`)) {
      return;
    }
    setDeletionBusyId(user.id);
    try {
      const { error } = await supabase.rpc('admin_delete_user_account', {
        target_user_id: user.id
      });
      if (error) throw error;
      const withdrawnAt = new Date().toISOString();
      const scheduledPurgeAt = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
      setDeletionRequests(deletionRequests.filter(u => u.id !== user.id));
      setMembers(members.map(m => (
        m.id === user.id
          ? { ...m, status: 'withdrawn', withdrawn_at: withdrawnAt, scheduled_purge_at: scheduledPurgeAt }
          : m
      )));
      setCounts(prev => ({ ...prev, deletions: Math.max(0, prev.deletions - 1) }));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setDeletionBusyId(null);
    }
  };

  // 관리자가 사유를 입력해 회원을 직접 삭제 처리 — 즉시 삭제되지는 않고 'deletion_pending'
  // 상태로 전환되며, 해당 회원이 다음 로그인 시 사유를 확인하고 동의해야 완전히 삭제됩니다.
  const flagMemberForDeletion = async () => {
    if (!deleteReasonMember) return;
    if (!deleteReasonText.trim()) {
      alert('삭제 사유를 입력해주세요.');
      return;
    }
    if (!window.confirm(`${deleteReasonMember.full_name}(${deleteReasonMember.email}) 계정을 삭제 처리하시겠습니까? 해당 회원이 다음 로그인 시 입력하신 사유를 확인하고 동의해야 계정이 완전히 삭제됩니다.`)) {
      return;
    }
    setDeleteFlagBusyId(deleteReasonMember.id);
    try {
      const { error } = await supabase.rpc('admin_flag_user_for_deletion', {
        target_user_id: deleteReasonMember.id,
        reason: deleteReasonText.trim()
      });
      if (error) throw error;
      setMembers(members.map(m => (
        m.id === deleteReasonMember.id
          ? { ...m, status: 'deletion_pending', admin_deletion_reason: deleteReasonText.trim() }
          : m
      )));
      setDeleteReasonMember(null);
      setDeleteReasonText('');
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setDeleteFlagBusyId(null);
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

  const activeMemberFilter = MEMBER_FILTERS.find(f => f.key === memberFilter) || MEMBER_FILTERS[0];
  const visibleMembers = members.filter(activeMemberFilter.test);

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

  // 사역 소식 게시글 발행/발행 취소. published로 바뀌는 순간에만 published_at을 새로 찍고,
  // 이미 한 번 발행됐던 글을 다시 임시저장으로 내려도 published_at은 그대로 남겨둡니다
  // (다음에 재발행하면 그때 다시 갱신) — 처음 공개된 날짜를 잃지 않기 위함입니다.
  const togglePostPublish = async (post) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    const label = nextStatus === 'published' ? '발행' : '임시저장으로 전환';
    if (!window.confirm(`"${post.title}" 글을 ${label}하시겠습니까?`)) return;
    setPostBusyId(post.id);
    try {
      const updates = { status: nextStatus, updated_at: new Date().toISOString() };
      if (nextStatus === 'published' && !post.published_at) {
        updates.published_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('ministry_posts')
        .update(updates)
        .eq('id', post.id);
      if (error) throw error;
      setPosts(posts.map(p => (p.id === post.id ? { ...p, ...updates } : p)));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setPostBusyId(null);
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm(`"${post.title}" 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setPostBusyId(post.id);
    try {
      const { error } = await supabase.from('ministry_posts').delete().eq('id', post.id);
      if (error) throw error;

      // 대표 이미지도 스토리지에서 함께 삭제(실패해도 게시글 삭제 자체는 이미 끝난 상태라 조용히 무시)
      if (post.cover_image_url) {
        try {
          const marker = '/ministry-post-images/';
          const idx = post.cover_image_url.indexOf(marker);
          if (idx !== -1) {
            const storagePath = post.cover_image_url.slice(idx + marker.length);
            await supabase.storage.from('ministry-post-images').remove([storagePath]);
          }
        } catch {
          // 이미지 삭제 실패는 무시
        }
      }

      setPosts(posts.filter(p => p.id !== post.id));
      setCounts(prev => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setPostBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <PageHero
        images={ADMIN_HERO_IMAGES}
        eyebrow="ADMIN"
        title="관리자 대시보드"
        subtitle="회원과 숙소, 예약 현황을 한눈에 확인하고 관리하세요"
      />
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
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            사역 소식 ({counts.posts})
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
                                            <p><strong>역할:</strong> {ROLE_LABEL[user.role] || user.role}</p>
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
                      <p className="amenity-line">
                        <strong>편의시설:</strong>{' '}
                        {acc.amenities && acc.amenities.length > 0 ? (
                          <span className="amenity-tags">
                            {acc.amenities.slice(0, 3).map(key => {
                              const item = AMENITY_MAP[key];
                              return (
                                <span key={key} className="amenity-tag">
                                  <AmenityIcon name={item?.icon} size={14} />
                                  {item?.label || key}
                                </span>
                              );
                            })}
                            {acc.amenities.length > 3 && (
                              <span className="amenity-tag-more">, ...</span>
                            )}
                          </span>
                        ) : (
                          <span className="amenity-tags-empty">없음</span>
                        )}
                      </p>
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
                        <span className="badge badge-danger">탈퇴 예정</span>
                      </div>
                      <div className="user-info">
                        <p><strong>이메일:</strong> {user.email}</p>
                        <p><strong>역할:</strong> {ROLE_LABEL[user.role] || user.role}</p>
                        <p><strong>탈퇴 요청일:</strong> {requestedAt.toLocaleDateString()}</p>
                        <p><strong>자동 탈퇴 처리 예정일:</strong> {scheduledFor.toLocaleDateString()}</p>
                        <p className="member-notice">탈퇴 처리 후에는 5년간 보관되다가 자동으로 완전히 삭제됩니다.</p>
                      </div>

                      <div className="action-buttons">
                        <button
                          className="btn btn-danger"
                          onClick={() => approveAccountDeletion(user)}
                          disabled={deletionBusyId === user.id}
                        >
                          <Trash2 size={16} />
                          {deletionBusyId === user.id ? '처리 중...' : '지금 탈퇴 승인'}
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
                  {f.label} ({members.filter(f.test).length})
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
                            member.status === 'pending' ? 'badge-warning' :
                            member.status === 'withdrawn' ? 'badge-neutral' :
                            member.status === 'deletion_pending' ? 'badge-danger' : 'badge-danger'
                          }`}>
                            {member.status === 'approved' ? '승인됨' :
                              member.status === 'pending' ? '검토 중' :
                              member.status === 'withdrawn' ? '탈퇴 회원' :
                              member.status === 'deletion_pending' ? '삭제 대기' : '거절됨'}
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
                            {member.deletion_requested_at && member.status !== 'withdrawn' && member.status !== 'deletion_pending' && (
                              <p className="member-deletion-notice">
                                <strong>⚠️ 탈퇴 요청됨(유예기간 중):</strong> {new Date(member.deletion_requested_at).toLocaleDateString()}
                              </p>
                            )}
                            {member.status === 'withdrawn' && (
                              <p className="member-deletion-notice">
                                <strong>🚪 탈퇴 처리됨:</strong>{' '}
                                {member.withdrawn_at ? new Date(member.withdrawn_at).toLocaleDateString() : '-'}
                                {member.scheduled_purge_at && (
                                  <> (완전 삭제 예정일: {new Date(member.scheduled_purge_at).toLocaleDateString()})</>
                                )}
                              </p>
                            )}
                            {member.status === 'deletion_pending' && (
                              <p className="member-deletion-notice member-deletion-notice-danger">
                                <strong>⛔ 관리자 삭제 처리 대기 중</strong> — 사유: {member.admin_deletion_reason || '미입력'}
                                <br />본인이 다음 로그인 시 사유를 확인하고 동의하면 계정이 완전히 삭제됩니다.
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
                                <option value="supporter">후원자</option>
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

                          {!isSelf && !member.is_super_admin && member.status !== 'withdrawn' && member.status !== 'deletion_pending' && (
                            <div className="member-delete-row">
                              <button
                                type="button"
                                className="btn btn-danger btn-small"
                                onClick={() => { setDeleteReasonMember(member); setDeleteReasonText(''); }}
                              >
                                <Trash2 size={14} />
                                회원 삭제 처리
                              </button>
                            </div>
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
                      <div className="booking-admin-badges">
                        <span className={`badge ${BOOKING_STATUS_BADGE[booking.status] || 'badge-info'}`}>
                          {BOOKING_STATUS_LABEL[booking.status] || booking.status}
                        </span>
                        {booking.status === 'confirmed' && (
                          <span className={`badge ${PAYMENT_STATUS_BADGE[booking.payment_status] || 'badge-info'}`}>
                            {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
                          </span>
                        )}
                      </div>
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

        {/* 사역 소식 관리 */}
        {activeTab === 'posts' && (
          <div className="review-section">
            <div className="posts-toolbar">
              <p className="member-notice">
                작성한 글은 "발행"을 눌러야 WEWE 홈페이지의 사역 소식 페이지에 공개됩니다. 발행 전에는 임시저장 상태로만 보관됩니다.
              </p>
              <Link to="/admin/posts/new" className="btn btn-primary">
                <Plus size={16} />
                새 글 작성
              </Link>
            </div>
            {loading ? (
              <p>로드 중...</p>
            ) : posts.length === 0 ? (
              <p className="empty-message">작성된 글이 없습니다.</p>
            ) : (
              <div className="grid grid-2">
                {posts.map(post => (
                  <div key={post.id} className="card post-admin-card">
                    <div className="card-header">
                      <h3>{post.title}</h3>
                      <span className={`badge ${POST_STATUS_BADGE[post.status] || 'badge-neutral'}`}>
                        {POST_STATUS_LABEL[post.status] || post.status}
                      </span>
                    </div>
                    <div className="user-info">
                      <p><strong>작성자:</strong> {post.users?.full_name || '알 수 없음'}</p>
                      <p><strong>작성일:</strong> {new Date(post.created_at).toLocaleDateString()}</p>
                      {post.published_at && (
                        <p><strong>발행일:</strong> {new Date(post.published_at).toLocaleDateString()}</p>
                      )}
                      {post.excerpt && <p className="post-admin-excerpt">{post.excerpt}</p>}
                    </div>
                    <div className="action-buttons">
                      <Link to={`/admin/posts/${post.id}/edit`} className="btn btn-secondary">
                        <Pencil size={16} />
                        수정
                      </Link>
                      <button
                        className={post.status === 'published' ? 'btn btn-warning' : 'btn btn-success'}
                        disabled={postBusyId === post.id}
                        onClick={() => togglePostPublish(post)}
                      >
                        {post.status === 'published' ? '발행 취소' : '발행하기'}
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={postBusyId === post.id}
                        onClick={() => deletePost(post)}
                      >
                        <Trash2 size={16} />
                        삭제
                      </button>
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

        {/* 관리자 회원 삭제 처리 모달 — 입력한 사유는 해당 회원이 다음 로그인 시 확인해야 함 */}
        {deleteReasonMember && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>회원 삭제 처리</h2>
              </div>
              <p className="member-notice">
                {deleteReasonMember.full_name}({deleteReasonMember.email}) 계정을 삭제 처리합니다. 즉시
                삭제되지는 않으며, 입력하신 사유가 해당 회원의 다음 로그인 시 안내되고, 본인이 확인 후
                동의해야 계정과 모든 데이터가 완전히 영구 삭제됩니다.
              </p>
              <div className="form-group">
                <label>삭제 사유 *</label>
                <textarea
                  value={deleteReasonText}
                  onChange={(e) => setDeleteReasonText(e.target.value)}
                  placeholder="회원에게 안내될 삭제 사유를 자세히 입력해주세요..."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-danger"
                  onClick={flagMemberForDeletion}
                  disabled={deleteFlagBusyId === deleteReasonMember.id}
                >
                  {deleteFlagBusyId === deleteReasonMember.id ? '처리 중...' : '삭제 처리'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setDeleteReasonMember(null);
                    setDeleteReasonText('');
                  }}
                  disabled={deleteFlagBusyId === deleteReasonMember.id}
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
          color: #b8622c;
          border-bottom-color: #b8622c;
        }

        .review-section {
          margin-top: 2rem;
        }

        .user-card, .accommodation-card, .inquiry-card, .booking-admin-card, .post-admin-card {
          display: flex;
          flex-direction: column;
        }

        .booking-admin-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.5rem;
        }

        .posts-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .posts-toolbar .member-notice {
          margin: 0;
          flex: 1;
          min-width: 240px;
        }

        .posts-toolbar .btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .post-admin-excerpt {
          color: #888 !important;
          font-style: italic;
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

        .amenity-tags {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          vertical-align: middle;
        }

        .amenity-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #fdf8f1;
          border: 1px solid #f0dcc0;
          color: #b8622c;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .amenity-tag-more {
          color: #95a5a6;
          font-size: 0.85rem;
          align-self: center;
        }

        .amenity-tags-empty {
          color: #95a5a6;
          font-size: 0.9rem;
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
          background: #fdf8f1;
          border: 1px solid #f0dcc0;
          color: #b8622c;
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
          background: #faf1e6;
          border-color: #b8622c;
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
          border-color: #b8622c;
          color: #b8622c;
        }

        .member-filter.active {
          background: #b8622c;
          border-color: #b8622c;
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
          background: #5c4430;
          color: white;
        }

        .role-badge.role-host {
          background: #8a6d3f;
          color: white;
        }

        .role-badge.role-missionary {
          background: #d97b3f;
          color: white;
        }

        .role-badge.role-supporter {
          background: #146b71;
          color: white;
        }

        .member-detail {
          padding: 0 1.5rem 1.5rem;
          border-top: 1px solid #ecf0f1;
        }

        .member-deletion-notice {
          color: #e74c3c;
          line-height: 1.5;
        }

        .member-deletion-notice-danger {
          background: #fdf0ee;
          border-left: 3px solid #e74c3c;
          padding: 0.6rem 0.8rem;
          border-radius: 4px;
          margin-top: 0.5rem;
        }

        .member-delete-row {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
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
          .admin-dashboard .admin-tabs {
            flex-wrap: wrap;
            gap: 0.5rem;
            margin: 1.5rem 0;
          }

          .admin-dashboard .tab {
            flex: 1 1 auto;
            text-align: center;
            padding: 0.7rem 0.9rem;
            font-size: 0.9rem;
          }

          .admin-dashboard .action-buttons {
            flex-direction: column;
          }

          .admin-dashboard .user-info p,
          .admin-dashboard .accommodation-info p {
            font-size: 0.88rem;
          }

          .admin-dashboard .card-header h3,
          .admin-dashboard .member-basic h3 {
            font-size: 1.1rem;
          }

          .admin-dashboard .header-badges,
          .admin-dashboard .member-badges {
            gap: 0.35rem;
          }

          .admin-dashboard .badge,
          .admin-dashboard .badge-super-admin,
          .admin-dashboard .role-badge {
            font-size: 0.78rem;
            padding: 0.22rem 0.6rem;
          }

          .admin-dashboard .member-filters {
            gap: 0.5rem;
          }

          .admin-dashboard .member-filter {
            padding: 0.45rem 0.9rem;
            font-size: 0.82rem;
          }

          .admin-dashboard .member-card-header {
            padding: 1rem 1.1rem;
            gap: 0.6rem;
          }

          .admin-dashboard .member-detail {
            padding: 0 1.1rem 1.1rem;
          }

          .admin-dashboard .doc-link {
            font-size: 0.85rem;
            padding: 0.55rem 0.75rem;
          }

          .admin-dashboard .resend-row {
            gap: 0.5rem;
          }

          .admin-dashboard .resend-btn {
            font-size: 0.88rem;
            padding: 0.6rem 1rem;
          }

          .admin-dashboard .role-change-row {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .admin-dashboard .role-change-row select {
            flex: 1 1 auto;
            min-width: 0;
          }

          .admin-dashboard .modal-actions {
            gap: 0.75rem;
          }

          .admin-dashboard .modal-actions button {
            min-width: 0;
          }
        }

        @media (max-width: 480px) {
          .admin-dashboard .container > h1 {
            margin-bottom: 0.75rem;
          }

          .admin-dashboard .admin-tabs {
            gap: 0.4rem;
            margin: 1.1rem 0;
          }

          .admin-dashboard .tab {
            padding: 0.6rem 0.7rem;
            font-size: 0.82rem;
          }

          .admin-dashboard .review-section {
            margin-top: 1.25rem;
          }

          .admin-dashboard .user-info p,
          .admin-dashboard .accommodation-info p {
            font-size: 0.85rem;
            margin: 0.4rem 0;
          }

          .admin-dashboard .verification-docs h4 {
            font-size: 0.9rem;
          }

          .admin-dashboard .card-header h3,
          .admin-dashboard .member-basic h3 {
            font-size: 1.02rem;
          }

          .admin-dashboard .member-email {
            font-size: 0.8rem;
          }

          .admin-dashboard .badge,
          .admin-dashboard .badge-super-admin,
          .admin-dashboard .role-badge {
            font-size: 0.74rem;
            padding: 0.2rem 0.55rem;
          }

          .admin-dashboard .member-filter {
            padding: 0.4rem 0.8rem;
            font-size: 0.78rem;
          }

          .admin-dashboard .member-card-header {
            padding: 0.9rem 1rem;
          }

          .admin-dashboard .member-notice {
            font-size: 0.8rem;
            padding: 0.65rem 0.85rem;
          }

          .admin-dashboard .doc-link {
            font-size: 0.8rem;
            padding: 0.5rem 0.7rem;
          }

          .admin-dashboard .doc-link span {
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .admin-dashboard .resend-success,
          .admin-dashboard .resend-error,
          .admin-dashboard .role-change-busy {
            font-size: 0.78rem;
          }

          .admin-dashboard .role-change-row label {
            font-size: 0.85rem;
          }

          .admin-dashboard .action-buttons button,
          .admin-dashboard .action-buttons a {
            font-size: 0.88rem;
            padding: 0.65rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;