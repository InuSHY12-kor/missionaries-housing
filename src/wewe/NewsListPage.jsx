import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SquareStack, PenSquare } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import { weweSupabase } from './weweSupabase';
import HERO_IMAGE_SETS from './heroImages';
import Reveal from './Reveal';
import './wewe-shared.css';

// 사역 소식 목록 페이지 (/news, Phase 4).
// 관리자 대시보드(/stay/admin, "사역 소식" 탭)에서 발행(status='published')한 글만
// 최신순으로 보여줍니다. 로그인 없이도 볼 수 있는 공개 페이지입니다.
//
// (2026-09-09 추가) 관리자로 로그인한 경우에만 "새 글쓰기" 버튼을 보여줍니다. 후원자·
// 선교사·숙소 제공자 계정은 글을 읽기만 할 수 있어야 하므로, 인증된 supabase 클라이언트로
// 세션 + users.role을 직접 확인합니다(weweSupabase는 익명 클라이언트라 role을 알 수 없음).
function NewsListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
      if (active && data?.role === 'admin') setIsAdmin(true);
    };

    checkAdmin();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data, error } = await weweSupabase
          .from('ministry_posts')
          .select('id, slug, title, excerpt, cover_image_url, image_urls, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        if (error) throw error;
        if (active) setPosts(data || []);
      } catch (err) {
        if (active) setLoadError('소식을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="wewe-page wewe-news-list-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="MINISTRY NEWS"
        title="사역 소식"
        subtitle="WEWE가 걸어가는 이야기와 사역 현장의 소식을 전합니다."
        images={HERO_IMAGE_SETS.news}
      />

      <section className="nl-section">
        <div className="wh-container">
          {isAdmin && (
            <div className="nl-admin-bar">
              <a href="/stay/admin/posts/new" className="wh-btn wh-btn-primary">
                <PenSquare size={16} />
                새 글쓰기
              </a>
            </div>
          )}

          {loading ? (
            <p className="nl-status">불러오는 중...</p>
          ) : loadError ? (
            <p className="nl-status">{loadError}</p>
          ) : posts.length === 0 ? (
            <div className="nl-empty">
              <p>아직 등록된 소식이 없습니다. 곧 새로운 이야기로 찾아올게요.</p>
            </div>
          ) : (
            <div className="nl-grid">
              {posts.map((post, idx) => {
                const imageCount = Array.isArray(post.image_urls) ? post.image_urls.length : 0;
                const thumbnail = post.cover_image_url || (imageCount > 0 ? post.image_urls[0] : '');
                return (
                  <Reveal
                    key={post.id}
                    as={Link}
                    to={`/news/${post.slug}`}
                    className="nl-card"
                    delay={(idx % 6) * 40}
                  >
                    {thumbnail ? (
                      <div className="nl-card-image" style={{ backgroundImage: `url(${thumbnail})` }} />
                    ) : (
                      <div className="nl-card-image nl-card-image-placeholder">
                        <span>WEWE</span>
                      </div>
                    )}

                    {imageCount > 1 && (
                      <span className="nl-card-multi-badge" title={`사진 ${imageCount}장`}>
                        <SquareStack size={14} />
                      </span>
                    )}

                    <div className="nl-card-caption">
                      <span className="nl-card-date">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('ko-KR')
                          : ''}
                      </span>
                      <h3>{post.title}</h3>
                      {post.excerpt && <p>{post.excerpt}</p>}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .nl-section {
          padding: 4rem 0 5rem;
          background: var(--wh-bg);
          flex: 1;
        }

        .nl-admin-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1.5rem;
        }

        .nl-status {
          text-align: center;
          color: var(--wh-ink-soft);
          padding: 3rem 0;
        }

        .nl-empty {
          text-align: center;
          padding: 3rem;
          background: var(--wh-bg-soft);
          border: 1px dashed var(--wh-line);
          border-radius: 10px;
          color: var(--wh-ink-soft);
        }

        /* 인스타그램 피드처럼 정사각형 사진 카드가 촘촘히 이어지는 그리드
           (2026-09-07 수정 — 기존 흰 바탕 카드 레이아웃을 사진 중심으로 교체) */
        .nl-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.4rem;
        }

        .nl-card {
          position: relative;
          display: block;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--wh-bg-soft);
          text-decoration: none;
        }

        .nl-card-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-color: var(--wh-bg-soft);
          transition: transform 0.35s ease;
        }

        .nl-card:hover .nl-card-image {
          transform: scale(1.05);
        }

        .nl-card-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--wh-teal) 0%, var(--wh-orange) 100%);
        }

        .nl-card-image-placeholder span {
          color: rgba(255,255,255,0.9);
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: 0.06em;
        }

        .nl-card-multi-badge {
          position: absolute;
          top: 0.6rem;
          right: 0.6rem;
          z-index: 2;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(20, 20, 18, 0.55);
          backdrop-filter: blur(2px);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 캡션은 사진 하단에 항상 살짝 보이는 그라데이션 띠 형태로 — 날짜와 제목 한 줄은
           바로 보이고, 호버하면(모바일은 터치 유지 시) 요약까지 함께 펼쳐집니다. 제목이
           기본값으로 늘 보이므로 호버를 지원하지 않는 기기에서도 정보가 가려지지 않습니다. */
        .nl-card-caption {
          position: absolute;
          inset: auto 0 0 0;
          z-index: 1;
          padding: 1.75rem 0.85rem 0.7rem;
          background: linear-gradient(0deg, rgba(10,10,9,0.85) 0%, rgba(10,10,9,0.55) 55%, rgba(10,10,9,0) 100%);
        }

        .nl-card-date {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.03em;
          margin-bottom: 0.2rem;
        }

        .nl-card-caption h3 {
          color: #fff;
          font-size: 0.92rem;
          line-height: 1.4;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .nl-card-caption p {
          margin: 0.35rem 0 0;
          color: rgba(255,255,255,0.78);
          font-size: 0.8rem;
          line-height: 1.55;
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          transition: max-height 0.2s ease, opacity 0.2s ease;
        }

        .nl-card:hover .nl-card-caption p,
        .nl-card:focus-visible .nl-card-caption p {
          max-height: 3rem;
          opacity: 1;
        }

        @media (max-width: 860px) {
          .nl-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.3rem;
          }

          .nl-card-caption p {
            max-height: 3rem;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default NewsListPage;
