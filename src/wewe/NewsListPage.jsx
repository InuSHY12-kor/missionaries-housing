import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import { weweSupabase } from './weweSupabase';
import './wewe-shared.css';

// 사역 소식 목록 페이지 (/news, Phase 4).
// 관리자 대시보드(/stay/admin, "사역 소식" 탭)에서 발행(status='published')한 글만
// 최신순으로 보여줍니다. 로그인 없이도 볼 수 있는 공개 페이지입니다.
function NewsListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data, error } = await weweSupabase
          .from('ministry_posts')
          .select('id, slug, title, excerpt, cover_image_url, published_at')
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
      />

      <section className="nl-section">
        <div className="wh-container">
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
              {posts.map((post) => (
                <Link key={post.id} to={`/news/${post.slug}`} className="nl-card">
                  {post.cover_image_url ? (
                    <div
                      className="nl-card-image"
                      style={{ backgroundImage: `url(${post.cover_image_url})` }}
                    />
                  ) : (
                    <div className="nl-card-image nl-card-image-placeholder">
                      <span>WEWE</span>
                    </div>
                  )}
                  <div className="nl-card-body">
                    <span className="nl-card-date">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('ko-KR')
                        : ''}
                    </span>
                    <h3>{post.title}</h3>
                    {post.excerpt && <p>{post.excerpt}</p>}
                    <span className="nl-card-link">
                      자세히 보기 <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
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

        .nl-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
        }

        .nl-card {
          display: flex;
          flex-direction: column;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .nl-card:hover {
          box-shadow: 0 10px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .nl-card-image {
          height: 170px;
          background-size: cover;
          background-position: center;
          background-color: var(--wh-bg-soft);
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

        .nl-card-body {
          padding: 1.25rem 1.4rem 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .nl-card-date {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--wh-stone);
          letter-spacing: 0.03em;
          margin-bottom: 0.5rem;
        }

        .nl-card-body h3 {
          color: var(--wh-ink);
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .nl-card-body p {
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          flex: 1;
        }

        .nl-card-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--wh-orange-deep);
        }

        @media (max-width: 860px) {
          .nl-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default NewsListPage;
