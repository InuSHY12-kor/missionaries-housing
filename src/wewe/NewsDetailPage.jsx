import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, HeartHandshake, Pencil } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import { weweSupabase } from './weweSupabase';
import { splitIntoParagraphs } from './postContent';
import HERO_IMAGE_SETS from './heroImages';
import Reveal from './Reveal';
import './wewe-shared.css';

// 반응 종류 — DB의 ministry_post_reactions.reaction_type과 동일해야 합니다.
const REACTION_TYPES = [
  { type: 'like', label: '좋아요', icon: ThumbsUp },
  { type: 'pray', label: '기도합니다', icon: HeartHandshake },
];

// 사역 소식 상세 페이지 (/news/:slug, Phase 4).
// RLS가 status='published'인 글만 비로그인 사용자에게 노출하므로, 임시저장 글의 슬러그로
// 들어오면 조회 결과가 그냥 비어 있게 됩니다 — 초안이 존재한다는 사실 자체가 새어나가지
// 않도록(글이 없는 주소와 동일하게) "글을 찾을 수 없습니다" 화면을 보여줍니다.
//
// (2026-09-09 추가) 글에 좋아요/기도합니다 반응을 남길 수 있고, 관리자로 로그인한
// 경우에는 수정 버튼도 함께 보여줍니다.
function NewsDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reactionCounts, setReactionCounts] = useState({});
  const [myReactions, setMyReactions] = useState(new Set());
  const [reactionBusy, setReactionBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setPost(null);

    const load = async () => {
      try {
        const { data, error } = await weweSupabase
          .from('ministry_posts')
          .select('id, title, excerpt, content, cover_image_url, image_urls, published_at')
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

  // 로그인 상태·관리자 여부 확인 (헤더와 동일한 supabase 클라이언트/세션 사용)
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data?.session?.user;
      if (!active || !user) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
      if (active && profile?.role === 'admin') setIsAdmin(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // 게시글 반응(좋아요/기도합니다) 불러오기
  useEffect(() => {
    if (!post?.id) return;
    let active = true;

    supabase
      .from('ministry_post_reactions')
      .select('reaction_type, user_id')
      .eq('post_id', post.id)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const counts = {};
        const mine = new Set();
        data.forEach((row) => {
          counts[row.reaction_type] = (counts[row.reaction_type] || 0) + 1;
          if (currentUserId && row.user_id === currentUserId) mine.add(row.reaction_type);
        });
        setReactionCounts(counts);
        setMyReactions(mine);
      });

    return () => {
      active = false;
    };
  }, [post?.id, currentUserId]);

  const toggleReaction = async (type) => {
    if (!currentUserId) {
      alert('로그인 후 반응을 남길 수 있어요.');
      return;
    }
    if (reactionBusy) return;
    setReactionBusy(true);

    const alreadyReacted = myReactions.has(type);

    try {
      if (alreadyReacted) {
        const { error } = await supabase
          .from('ministry_post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
          .eq('reaction_type', type);
        if (error) throw error;
        setMyReactions((prev) => {
          const next = new Set(prev);
          next.delete(type);
          return next;
        });
        setReactionCounts((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 1) - 1) }));
      } else {
        const { error } = await supabase
          .from('ministry_post_reactions')
          .insert({ post_id: post.id, user_id: currentUserId, reaction_type: type });
        if (error) throw error;
        setMyReactions((prev) => new Set(prev).add(type));
        setReactionCounts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
      }
    } catch (err) {
      alert('오류: ' + err.message);
    } finally {
      setReactionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="wewe-page wewe-news-detail-page">
        <WeweHeader />
        <WevePageHero eyebrow="MINISTRY NEWS" title="사역 소식" images={HERO_IMAGE_SETS.news} />
        <div className="wh-container wh-container-narrow nd-status">불러오는 중...</div>
        <WeweFooter />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="wewe-page wewe-news-detail-page">
        <WeweHeader />
        <WevePageHero eyebrow="MINISTRY NEWS" title="글을 찾을 수 없습니다" images={HERO_IMAGE_SETS.news} />
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
        images={HERO_IMAGE_SETS.news}
      />


      <article className="nd-article">
        <Reveal as="div" className="wh-container wh-container-narrow">
          {(() => {
            // image_urls가 없던(옛날) 글은 cover_image_url 한 장만 보여줍니다.
            const images = Array.isArray(post.image_urls) && post.image_urls.length > 0
              ? post.image_urls
              : (post.cover_image_url ? [post.cover_image_url] : []);
            if (images.length === 0) return null;
            if (images.length === 1) {
              return <img src={images[0]} alt={post.title} className="nd-cover-image" />;
            }
            return (
              <div className="nd-gallery">
                {images.map((url, i) => (
                  <img key={url} src={url} alt={`${post.title} 사진 ${i + 1}`} className="nd-gallery-image" />
                ))}
              </div>
            );
          })()}

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

          <div className="nd-reactions">
            {REACTION_TYPES.map(({ type, label, icon: Icon }) => {
              const active = myReactions.has(type);
              const count = reactionCounts[type] || 0;
              return (
                <button
                  key={type}
                  type="button"
                  className={`nd-reaction-btn${active ? ' active' : ''}`}
                  onClick={() => toggleReaction(type)}
                  disabled={reactionBusy}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {count > 0 && <span className="nd-reaction-count">{count}</span>}
                </button>
              );
            })}
            {!currentUserId && <span className="nd-reaction-hint">로그인 후 반응을 남길 수 있어요</span>}

            {isAdmin && (
              <a href={`/stay/admin/posts/${post.id}/edit`} className="wh-btn wh-btn-outline nd-edit-btn">
                <Pencil size={16} />
                수정
              </a>
            )}
          </div>

          <div className="nd-back">
            <Link to="/news" className="wh-btn wh-btn-ghost">
              <ArrowLeft size={16} />
              사역 소식으로 돌아가기
            </Link>
          </div>
        </Reveal>
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

        /* 사진이 여러 장인 글은 세로로 한 장씩 풀사이즈로 이어서 보여줍니다
           (2026-09-10: 2열 그리드에서 세로 1열 레이아웃으로 변경) */
        .nd-gallery {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 2rem;
        }

        .nd-gallery-image {
          width: 100%;
          border-radius: 10px;
          display: block;
        }

        .nd-article p {
          color: var(--wh-ink-soft);
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        .nd-reactions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
          padding-top: 1.75rem;
          border-top: 1px solid var(--wh-line);
        }

        .nd-reaction-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.1rem;
          border-radius: 999px;
          border: 1.5px solid var(--wh-line);
          background: var(--wh-bg);
          color: var(--wh-ink-soft);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .nd-reaction-btn:hover {
          border-color: var(--wh-orange);
          color: var(--wh-orange-deep);
        }

        .nd-reaction-btn.active {
          border-color: var(--wh-orange);
          background: rgba(217, 123, 63, 0.1);
          color: var(--wh-orange-deep);
        }

        .nd-reaction-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .nd-reaction-count {
          font-weight: 800;
        }

        .nd-reaction-hint {
          font-size: 0.82rem;
          color: var(--wh-stone);
        }

        .nd-edit-btn {
          margin-left: auto;
        }

        .nd-back {
          margin-top: 1.75rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--wh-line);
        }
      `}</style>
    </div>
  );
}

export default NewsDetailPage;
