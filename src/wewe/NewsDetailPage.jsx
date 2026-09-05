import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import { weweSupabase } from './weweSupabase';
import { splitIntoParagraphs } from './postContent';
import './wewe-shared.css';

// 사역 소식 상세 페이지 (/news/:slug, Phase 4).
// RLS가 status='published'인 글만 비로그인 사용자에게 노출하므로, 임시저장 글의 슬러그로
// 들어오면 조회 결과가 그냥 비어 있게 됩니다 — 초안이 존재한다는 사실 자체가 새어나가지
// 않도록(글이 없는 주소와 동일하게) "글을 찾을 수 없습니다" 화면을 보여줍니다.
function NewsDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setPost(null);

    const load = async () => {
      try {
        const { data, error } = await weweSupabase
          .from('ministry_posts')
          .select('id, title, excerpt, content, cover_image_url, published_at')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
      } catch (err) {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="wewe-page wewe-news-detail-page">
        <WeweHeader />
        <WevePageHero eyebrow="MINISTRY NEWS" title="사역 소식" />
        <div className="wh-container wh-container-narrow nd-status">불러오는 중...</div>
        <WeweFooter />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="wewe-page wewe-news-detail-page">
        <WeweHeader />
        <WevePageHero eyebrow="MINISTRY NEWS" title="글을 찾을 수 없습니다" />
        <div className="wh-container wh-container-narrow nd-status">
          <p>요청하신 소식을 찾을 수 없습니다. 삭제되었거나 아직 공개되지 않은 글일 수 있습니다.</p>
          <Link to="/news" className="wh-btn wh-btn-ghost">
            <ArrowLeft size={16} />
            사역 소식으로 돌아가기
          </Link>
        </div>
        <WeweFooter />
      </div>
    );
  }

  return (
    <div className="wewe-page wewe-news-detail-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="MINISTRY NEWS"
        title={post.title}
        subtitle={post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
      />

      <article className="nd-article">
        <div className="wh-container wh-container-narrow">
          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} className="nd-cover-image" />
          )}

          {splitIntoParagraphs(post.content).map((para, i) => (
            <p key={i}>
              {para.split('\n').map((line, j, arr) => (
                <React.Fragment key={j}>
                  {line}
                  {j < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          ))}

          <div className="nd-back">
            <Link to="/news" className="wh-btn wh-btn-ghost">
              <ArrowLeft size={16} />
              사역 소식으로 돌아가기
            </Link>
          </div>
        </div>
      </article>

      <WeweFooter />

      <style>{`
        .nd-status {
          padding: 4rem 0;
          text-align: center;
          color: var(--wh-ink-soft);
        }

        .nd-article {
          padding: 4rem 0 5rem;
          background: var(--wh-bg);
          flex: 1;
        }

        .nd-cover-image {
          width: 100%;
          border-radius: 10px;
          margin-bottom: 2rem;
          display: block;
        }

        .nd-article p {
          color: var(--wh-ink-soft);
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        .nd-back {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--wh-line);
        }
      `}</style>
    </div>
  );
}

export default NewsDetailPage;
