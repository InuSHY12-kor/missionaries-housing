import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { Home, Users, Star, MessageSquare } from 'lucide-react';

function Dashboard({ userProfile }) {
  const [stats, setStats] = useState({
    totalAccommodations: 0,
    totalBookings: 0,
    totalReviews: 0,
    recentBookings: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 숙소 수
      const { count: accCount } = await supabase
        .from('accommodations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // 예약 수
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, accommodations(title), users(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // 리뷰 수
      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalAccommodations: accCount || 0,
        totalBookings: bookings?.length || 0,
        totalReviews: reviewCount || 0,
        recentBookings: bookings || []
      });
    } catch (error) {
      console.error('통계 로드 오류:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <h1>대시보드</h1>
        <p className="welcome">환영합니다, {userProfile?.full_name}님!</p>

        {/* 통계 카드 */}
        <div className="stats-grid">
          <div className="stat-card">
            <Home size={32} />
            <h3>등록된 숙소</h3>
            <p className="stat-number">{stats.totalAccommodations}</p>
          </div>
          <div className="stat-card">
            <Users size={32} />
            <h3>예약</h3>
            <p className="stat-number">{stats.totalBookings}</p>
          </div>
          <div className="stat-card">
            <Star size={32} />
            <h3>리뷰</h3>
            <p className="stat-number">{stats.totalReviews}</p>
          </div>
          <div className="stat-card">
            <MessageSquare size={32} />
            <h3>메시지</h3>
            <p className="stat-number">0</p>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="quick-links">
          <h2>빠른 접근</h2>
          <div className="grid grid-3">
            <Link to="/accommodations" className="quick-link-card">
              <Home size={40} />
              <h3>숙소 검색</h3>
              <p>승인된 숙소를 검색하고 예약하세요</p>
            </Link>
            {userProfile?.role === 'host' && (
              <Link to="/my-accommodations" className="quick-link-card">
                <Home size={40} />
                <h3>내 숙소 관리</h3>
                <p>등록하신 숙소를 관리하세요</p>
              </Link>
            )}
            <Link to="/profile" className="quick-link-card">
              <Users size={40} />
              <h3>프로필</h3>
              <p>계정 정보를 수정하세요</p>
            </Link>
          </div>
        </div>

        {/* 최근 예약 */}
        {stats.recentBookings.length > 0 && (
          <div className="recent-section">
            <h2>최근 예약</h2>
            <div className="table-responsive">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>숙소명</th>
                    <th>예약자</th>
                    <th>상태</th>
                    <th>날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.accommodations?.title}</td>
                      <td>{booking.users?.full_name}</td>
                      <td><span className="badge badge-info">예약 완료</span></td>
                      <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="info-banner">
          <h3>💡 팁</h3>
          <p>
            {userProfile?.role === 'missionary' 
              ? '숙소를 검색하고 예약하려면 "숙소 검색" 메뉴에서 시작하세요. 호스트와 직접 메시지로 소통할 수 있습니다.'
              : '숙소를 등록하려면 "내 숙소" 메뉴에서 새 숙소를 추가할 수 있습니다. 등록한 숙소는 관리자 승인 후 공개됩니다.'}
          </p>
        </div>
      </div>

      <style>{`
        .dashboard {
          flex: 1;
        }

        .welcome {
          color: #7f8c8d;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-card svg {
          color: #667eea;
          margin-bottom: 1rem;
        }

        .stat-card h3 {
          color: #7f8c8d;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #667eea;
          margin: 0;
        }

        .quick-links {
          margin: 3rem 0;
        }

        .quick-links h2 {
          margin-bottom: 1.5rem;
        }

        .quick-link-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          text-decoration: none;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .quick-link-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .quick-link-card svg {
          color: #667eea;
        }

        .quick-link-card h3 {
          color: #2c3e50;
          margin: 0;
        }

        .quick-link-card p {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin: 0;
        }

        .recent-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin: 2rem 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .booking-table {
          width: 100%;
          border-collapse: collapse;
        }

        .booking-table th {
          text-align: left;
          padding: 1rem;
          border-bottom: 2px solid #ecf0f1;
          color: #2c3e50;
          font-weight: 600;
        }

        .booking-table td {
          padding: 1rem;
          border-bottom: 1px solid #ecf0f1;
          color: #555;
        }

        .booking-table tr:hover {
          background: #f8f9fa;
        }

        .info-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 8px;
          margin: 2rem 0;
        }

        .info-banner h3 {
          color: white;
          margin-bottom: 0.5rem;
        }

        .info-banner p {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-links .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
