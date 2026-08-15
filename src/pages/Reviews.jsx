import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../App';
import { Heart, MapPin, Calendar } from 'lucide-react';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 숙소 제공자(호스트)와 관리자만 볼 수 있는 리뷰("감사 인사") 열람 페이지.
// 실제 열람 범위는 Supabase RLS가 강제합니다 — 호스트는 본인 숙소의 리뷰만,
// 관리자는 전체 리뷰를 조회할 수 있습니다.
function Reviews({ userProfile }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heartBusyId, setHeartBusyId] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, comment, host_heart, host_heart_at, created_at,
          bookings(check_in, check_out),
          accommodations(id, title, location, host_id),
          users(full_name, church_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('리뷰 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const toggleHeart = async (review) => {
    setHeartBusyId(review.id);
    const nextHeart = !review.host_heart;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ host_heart: nextHeart })
        .eq('id', review.id);
      if (error) throw error;
      setReviews(reviews.map(r => r.id === review.id ? { ...r, host_heart: nextHeart } : r));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setHeartBusyId(null);
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="reviews-page">
      <div className="container">
        <h1>리뷰</h1>
        <p className="subtitle">
          {isAdmin
            ? '선교사님들이 숙소 이용 후 남긴 감사 인사입니다. 전체 숙소의 리뷰를 확인할 수 있습니다.'
            : '선교사님들이 내 숙소를 이용하신 후 남긴 감사 인사입니다. 확인 후 하트를 눌러 감사의 마음을 전해보세요.'}
        </p>

        {loading ? (
          <p>로드 중...</p>
        ) : reviews.length === 0 ? (
          <p className="empty-message">아직 등록된 리뷰가 없습니다.</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.id} className="card review-card">
                <div className="review-card-header">
                  <div>
                    <h3>{review.accommodations?.title || '삭제된 숙소'}</h3>
                    {review.accommodations?.location && (
                      <p className="location">
                        <MapPin size={16} />
                        {review.accommodations.location}
                      </p>
                    )}
                  </div>
                  <button
                    className={`heart-btn ${review.host_heart ? 'active' : ''}`}
                    onClick={() => toggleHeart(review)}
                    disabled={heartBusyId === review.id}
                    title={review.host_heart ? '하트 취소' : '하트로 감사 표현하기'}
                  >
                    <Heart size={20} fill={review.host_heart ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {review.bookings && (
                  <p className="stay-dates">
                    <Calendar size={15} />
                    {formatDate(review.bookings.check_in)} ~ {formatDate(review.bookings.check_out)} 이용
                  </p>
                )}

                <p className="review-comment">{review.comment}</p>

                <div className="review-footer">
                  <span className="guest-name">
                    {review.users?.full_name || '알 수 없음'}
                    {review.users?.church_name && ` · ${review.users.church_name}`}
                  </span>
                  <span className="review-date">{formatDate(review.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .reviews-page {
          flex: 1;
        }

        .subtitle {
          color: #7f8c8d;
          margin-top: -1rem;
          margin-bottom: 2rem;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .reviews-list {
          display: grid;
          gap: 1.5rem;
        }

        .review-card {
          display: flex;
          flex-direction: column;
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ecf0f1;
        }

        .review-card-header h3 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;
          margin: 0;
          font-size: 0.9rem;
        }

        .heart-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid #dfe6e9;
          background: white;
          color: #e74c3c;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .heart-btn:hover {
          background: #fdecea;
          border-color: #e74c3c;
        }

        .heart-btn.active {
          background: #e74c3c;
          border-color: #e74c3c;
          color: white;
        }

        .heart-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .stay-dates {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;
          font-size: 0.85rem;
          margin: 1rem 0 0;
        }

        .review-comment {
          color: #2c3e50;
          font-size: 1rem;
          line-height: 1.6;
          margin: 0.75rem 0;
          white-space: pre-wrap;
        }

        .review-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
          font-size: 0.85rem;
          color: #7f8c8d;
        }

        .guest-name {
          font-weight: 600;
          color: #2c3e50;
        }

        @media (max-width: 768px) {
          .review-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.3rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Reviews;
