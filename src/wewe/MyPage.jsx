import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, HeartHandshake, Newspaper, ArrowRight, Calendar, Shield, Bell } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import { weweSupabase } from './weweSupabase';
import './wewe-shared.css';

const ROLE_LABELS = {
  admin: '관리자',
  missionary: '선교사',
  host: '숙소 제공자',
  supporter: '후원자',
};

// WEWE 마이페이지 (/mypage).
// (2026-09-10 개편) 이전에는 "준비 중" 안내만 있는 자리표시자였는데, 활동 요약 / 후원 내역 /
// 받은 소식을 한 화면에서 볼 수 있는 임시 레이아웃으로 먼저 채웠습니다.
// - 활동 요약: 실제 회원 정보(가입일·회원 등급·알림 수신 여부)를 보여줍니다.
// - 후원 내역: 아직 후원 내역을 기록하는 기능/테이블이 없어 준비 중 안내로 둡니다(가짜 데이터 없음).
// - 받은 소식: 실제로 발행된 사역 소식 최신 글을 보여줍니다(News 목록과 동일한 데이터).
function MyPage() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsLoaded, setNewsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        if (mounted) navigate('/login');
        return;
      }

      const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (mounted) {
        setUserProfile(data || null);
        setLoadingProfile(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;
    weweSupabase
      .from('ministry_posts')
      .select('id, slug, title, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setNewsPosts(data || []);
        setNewsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadingProfile) {
    return (
      <div className="wewe-page wewe-mypage-page">
        <WeweHeader />
        <div className="wm-loading">불러오는 중...</div>
        <WeweFooter />
      </div>
    );
  }

  const roleLabel = userProfile?.role ? (ROLE_LABELS[userProfile.role] || userProfile.role) : '-';
  const joinedAt = userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('ko-KR') : '-';
  const notifOn = userProfile?.notification_email_wewe ?? true;

  return (
    <div className="wewe-page wewe-mypage-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="MY PAGE"
        title={userProfile?.full_name ? `${userProfile.full_name}님, 안녕하세요` : '마이페이지'}
        subtitle="활동 요약, 후원 내역, 받은 소식을 한 곳에서 확인하세요."
        images={HERO_IMAGE_SETS.login}
      />

      <section className="wm-section">
        <div className="wh-container wh-container-narrow">
          {/* 활동 요약 */}
          <Reveal as="div" className="wm-block">
            <h2>
              <Activity size={20} />
              활동 요약
            </h2>
            <div className="wm-stat-grid">
              <div className="wm-stat-card">
                <Calendar size={22} />
                <span className="wm-stat-label">가입일</span>
                <span className="wm-stat-value">{joinedAt}</span>
              </div>
              <div className="wm-stat-card">
                <Shield size={22} />
                <span className="wm-stat-label">회원 등급</span>
                <span className="wm-stat-value">{roleLabel}</span>
              </div>
              <div className="wm-stat-card">
                <Bell size={22} />
                <span className="wm-stat-label">이메일 알림</span>
                <span className="wm-stat-value">{notifOn ? '수신함' : '수신 안 함'}</span>
              </div>
            </div>
          </Reveal>

          {/* 후원 내역 */}
          <Reveal as="div" className="wm-block" delay={60}>
            <h2>
              <HeartHandshake size={20} />
              후원 내역
            </h2>
            <div className="wm-empty">
              <p>아직 후원 내역 조회 기능이 준비 중입니다. 이 자리에서 후원 이력을 확인하실 수 있도록 곧 업데이트할게요.</p>
              <Link to="/donate" className="wh-btn wh-btn-outline">후원 안내 보기</Link>
            </div>
          </Reveal>

          {/* 받은 소식 */}
          <Reveal as="div" className="wm-block" delay={120}>
            <h2>
              <Newspaper size={20} />
              받은 소식
            </h2>
            {newsLoaded && newsPosts.length > 0 ? (
              <>
                <ul className="wm-news-list">
                  {newsPosts.map((post) => (
                    <li key={post.id}>
                      <Link to={`/news/${post.slug}`} className="wm-news-item">
                        <span className="wm-news-item-date">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
                        </span>
                        <span className="wm-news-item-title">{post.title}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="wm-news-more">
                  <Link to="/news" className="wh-btn wh-btn-ghost">사역 소식 전체 보기 <ArrowRight size={16} /></Link>
                </div>
              </>
            ) : (
              <div className="wm-empty">
                <p>아직 발행된 소식이 없습니다.</p>
              </div>
            )}
          </Reveal>

          <div className="wm-profile-link">
            <Link to="/profile" className="wh-btn wh-btn-primary">프로필 관리하러 가기</Link>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wm-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 0;
          color: var(--wh-stone);
        }

        .wm-section {
          flex: 1;
          padding: 4rem 0 6rem;
          background: var(--wh-bg-soft);
        }

        .wm-block {
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
        }

        .wm-block h2 {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--wh-ink);
          font-size: 1.1rem;
          margin: 0 0 1.5rem;
        }

        .wm-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .wm-stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.4rem;
          padding: 1.5rem 1rem;
          background: var(--wh-bg-soft);
          border-radius: 10px;
        }

        .wm-stat-card svg {
          color: var(--wh-orange-deep);
          margin-bottom: 0.25rem;
        }

        .wm-stat-label {
          font-size: 0.8rem;
          color: var(--wh-stone);
          font-weight: 600;
        }

        .wm-stat-value {
          font-size: 1rem;
          font-weight: 800;
          color: var(--wh-ink);
        }

        .wm-empty {
          text-align: center;
          padding: 2rem 1rem;
          background: var(--wh-bg-soft);
          border: 1px dashed var(--wh-line);
          border-radius: 10px;
        }

        .wm-empty p {
          color: var(--wh-ink-soft);
          margin: 0 0 1rem;
          line-height: 1.7;
        }

        .wm-news-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .wm-news-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1.1rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          text-decoration: none;
          color: var(--wh-ink);
          transition: border-color 0.15s ease;
        }

        .wm-news-item:hover {
          border-color: var(--wh-orange);
        }

        .wm-news-item-date {
          flex-shrink: 0;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--wh-stone);
        }

        .wm-news-item-title {
          flex: 1;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .wm-news-item svg {
          flex-shrink: 0;
          color: var(--wh-orange-deep);
        }

        .wm-news-more {
          text-align: center;
          margin-top: 1.25rem;
        }

        .wm-profile-link {
          text-align: center;
          margin-top: 2rem;
        }

        @media (max-width: 860px) {
          .wm-block {
            padding: 1.5rem;
          }

          .wm-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default MyPage;
