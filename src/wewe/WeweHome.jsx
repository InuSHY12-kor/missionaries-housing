import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home as HomeIcon, Send, CheckCircle2, Target } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import { weweSupabase } from './weweSupabase';
import { supabase } from '../App';
import { useHero, HeroEditButton, renderRich, EditableText } from '../edit/EditMode';
import './wewe-shared.css';

// WEWE 비영리단체 전체 소개 홈페이지 (최상위 '/').
// 기존 위위스테이 전용 랜딩(지금은 /stay 안의 LandingPage.jsx)의 디자인 언어(에디토리얼 톤,
// 히어로 배너, 색상 등)를 재사용하되 콘텐츠는 WEWE 전체 소개로 새로 구성했습니다.
//
// Phase 2(2026-09-05)에서는 "소개"/"사역 소개" 전체 내용을 이 홈페이지 안의 섹션(#about,
// #ministries)으로 임시 구현했었습니다. Phase 3에서 그 내용을 실제 하위 페이지
// (/about, /about/ministries, /about/leadership)로 옮기고, 이 홈페이지는 각 섹션의
// 짧은 요약 + "자세히 보기" 링크만 남겨 홈페이지 자체는 더 가볍게 유지합니다.
// Phase 4에서 "사역 소식" 섹션도 실제 게시글(ministry_posts, /about/ministries의
// 관리자가 /stay/admin에서 작성·발행)의 최신 3개를 보여주도록 바꿨습니다 — 아직 발행된
// 글이 없으면 이전과 같은 "Coming soon" 안내를 그대로 보여줍니다.

// 스토리 갤러리(3분할) 사진 (2026-09-10 교체) — 이전에는 상단 히어로 배너와 같은 사진을
// 그대로 재사용해서 위위 스테이(숙소) 느낌이 강하다는 피드백이 있었습니다. 히어로(위쪽)와
// 겹치지 않는, "위로자의 위로자"다운 동행·나눔·환대의 사진으로 교체했습니다.
const STORY_GALLERY = {
  left: 'https://images.unsplash.com/photo-1484973768669-7fb6b5451095?auto=format&fit=crop&w=700&q=80', // 소파에 나란히 앉아 대화 — 동행
  center: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80', // 맞잡은 두 손, 환대
  right: 'https://images.unsplash.com/photo-1447619297994-b829cc1ab44a?auto=format&fit=crop&w=700&q=80', // 마주 편 두 손바닥 — 나눔
};
const MINISTRY_PHOTOS = {
  teal: 'https://images.unsplash.com/photo-1543525238-54e3d131f7ca?auto=format&fit=crop&w=700&q=80', // 기도하는 손
  orange: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=700&q=80', // 맞잡은 두 손, 환대
};

// 사역 소식 그리드(2026-09-10 수정) — 인스타그램 피드처럼 한 줄에 4개씩, 최대 2줄(8개)까지만
// 노출합니다. 글이 8개보다 적으면 남는 칸은 빈 박스로 채워 그리드 모양을 유지합니다.
const NEWS_GRID_SIZE = 8;

const EMPTY_INQUIRY_FORM = { name: '', email: '', phone: '', message: '' };

function WeweHome() {
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  // (2026-10-09) 로그인 여부 — 맨 아래 "가입하기/로그인" 안내 밴드는 로그인하지 않은 방문자에게만
  // 보여줍니다. 확인 전(null)에는 숨겨 두어, 로그인한 회원에게 잠깐 보였다 사라지는 깜빡임을 막습니다.
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsLoggedIn(!!data?.session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsLoggedIn(!!session?.user);
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);
  // (2026-10-09) 관리자 편집 모드 — 저장된 배너(사진·문구)가 있으면 그것을, 없으면 아래 기본값.
  // 배너 설명은 줄마다(Enter) 한 문장 블록으로 나뉘어 모바일에서도 고르게 줄바꿈됩니다.
  const heroDefaults = {
    eyebrow: 'WE + WE, 나에서 우리로',
    title: '위로자의 위로자, WEWE입니다',
    subtitle: '사역 현장에서 누군가를 위로하느라 자신의 아픔은 숨겨야 했던 목회자와 선교사님들.\n먼저 아파본 위로자가 지금 아픈 위로자의 손을 잡아드립니다.',
    images: HERO_IMAGE_SETS.home,
  };
  const hero = useHero(heroDefaults);
  const heroImages = hero.images;

  // WEWE 문의 폼 (2026-09-13 이동) — 이전에는 위위스테이 랜딩 페이지(/stay)의 "궁금한 점이
  // 있으신가요?" 섹션 아래에 있었는데, WEWE 자체에 대한 문의이므로 위위 랜딩(여기)의 사역
  // 소식 섹션 아래로 옮겼습니다. 로그인 여부와 무관한 공개 문의 폼이라 익명 키를 쓰는
  // weweSupabase로 inquiries 테이블에 topic='wewe'로 저장합니다(관리자 화면에서 구분).
  const [inquiryForm, setInquiryForm] = useState(EMPTY_INQUIRY_FORM);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const handleInquiryFormChange = (e) => {
    const { name, value } = e.target;
    setInquiryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || !inquiryForm.email.trim() || !inquiryForm.phone.trim()) {
      setInquiryError('이름, 이메일, 전화번호는 필수 입력입니다.');
      return;
    }

    setInquirySubmitting(true);
    setInquiryError('');

    try {
      // 비로그인 방문자가 남기는 문의라 inquiries에는 SELECT 정책이 없습니다(관리자만 열람 가능).
      // insert().select()를 쓰면 삽입 직후 되읽기 단계에서 RLS에 막히므로, id를 미리 만들어 함께 저장합니다.
      const inquiryId = window.crypto.randomUUID();
      const { error } = await weweSupabase.from('inquiries').insert({
        id: inquiryId,
        name: inquiryForm.name.trim(),
        email: inquiryForm.email.trim(),
        phone: inquiryForm.phone.trim(),
        message: inquiryForm.message.trim() || null,
        topic: 'wewe',
      });

      if (error) throw error;

      weweSupabase.functions
        .invoke('send-email', { body: { type: 'inquiry', inquiryId } })
        .catch((emailErr) => console.error('문의 이메일 발송 오류:', emailErr));

      setInquirySubmitted(true);
      setInquiryForm(EMPTY_INQUIRY_FORM);
    } catch (error) {
      setInquiryError('오류가 발생했습니다: ' + error.message);
    } finally {
      setInquirySubmitting(false);
    }
  };

  const heroCount = heroImages.length;
  useEffect(() => {
    setHeroSlide(0);
    if (heroCount < 2) return undefined;
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroCount);
    }, 3500);
    return () => clearInterval(timer);
  }, [heroCount]);

  // 다른 페이지에서 "/#ministries"처럼 해시가 붙은 주소로 들어온 경우, 해당 섹션이
  // 화면에 그려진 뒤에 스크롤해서 보여줍니다(브라우저의 기본 해시 스크롤은 정적
  // HTML을 기준으로 동작해서, 이 콘텐츠처럼 자바스크립트로 그려지는 섹션에는
  // 적용되지 않기 때문입니다).
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto' }));
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    weweSupabase
      .from('ministry_posts')
      .select('id, slug, title, excerpt, cover_image_url, image_urls, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(NEWS_GRID_SIZE)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setNewsPosts(data || []);
        setNewsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="wewe-page wewe-home">
      <WeweHeader />

      {/* 히어로 — 3.5초마다 전환되는 크로스페이드 슬라이드쇼 + 원형 링 진행 인디케이터
          (2026-09-09) WevePageHero.jsx의 하위 페이지 히어로와 동일한 효과를 홈 히어로에도 적용. */}
      <section id="top" className="wh-hero">
        {hero.ready && heroImages.map((src, idx) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`${idx}-${src}`}
            className={`wh-hero-slide ${idx === heroSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}

        <div className="wh-hero-content" style={{ opacity: hero.ready ? 1 : 0, transition: 'opacity 0.25s ease' }}>
          {hero.eyebrow && <span className="wh-hero-eyebrow">{hero.eyebrow}</span>}
          <h1>{hero.title}</h1>
          {/* (2026-10-09) <br /> 대신 문장마다 블록으로 나눠, 모바일에서 각 문장의 줄 길이가 고르게
              나뉘도록(text-wrap: balance) 했습니다 — 마지막 줄에 한 단어만 남지 않게. */}
          {hero.subtitle && (
            <p>
              {hero.subtitle.split('\n').filter((line) => line.trim()).map((line, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <span className="wh-hero-line" key={idx}>{renderRich(line)}</span>
              ))}
            </p>
          )}
          <div className="wh-hero-actions">
            <a href="#ministries" className="wh-btn wh-btn-outline">사역 알아보기</a>
            <a href="/stay" className="wh-btn wh-btn-outline">위위 스테이 살펴보기</a>
          </div>
        </div>

        {heroImages.length > 1 && (
          <div className="wp-hero-progress">
            {heroImages.map((src, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="wp-hero-dot-wrap" key={`${idx}-${src}`}>
                <svg className="wp-hero-ring" viewBox="0 0 32 32">
                  <circle className="wp-hero-ring-track" cx="16" cy="16" r="14" />
                  {idx === heroSlide && (
                    <circle key={`fill-${heroSlide}`} className="wp-hero-ring-fill" cx="16" cy="16" r="14" />
                  )}
                </svg>
              </div>
            ))}
          </div>
        )}
        <HeroEditButton defaults={heroDefaults} />
      </section>

      {/* 한눈에 보는 WEWE — PPT 슬라이드 3 "SUMMARY" 요약 (2026-10-03 신규).
          미션 한 줄 + 두 프로젝트 요약 + 운영 기반(법인화·선순환)을 카드 3개로 압축해
          히어로 바로 아래에 배치, 홈페이지에서도 전체 그림이 한눈에 보이도록 합니다. */}
      <section className="wh-snapshot">
        <div className="wh-container">
          <Reveal>
            <EditableText id={"SUMMARY"} as="span" className="wh-eyebrow wh-eyebrow-center">SUMMARY</EditableText>
            <EditableText id={"한눈에 보는 WEWE"} as="h2" className="wh-h2-center">한눈에 보는 WEWE</EditableText>
            <p className="wh-snapshot-mission">
              <Target size={16} /> 현대판 레위인인 목회자와 선교사가 다시 일어설 수 있도록, 그들의 위로자가 됩니다.
            </p>
          </Reveal>

          <Reveal as="div" className="wh-snapshot-grid" delay={80}>
            <div className="wh-snapshot-card">
              <span className="wh-snapshot-tag wh-snapshot-tag-teal">PROJECT 1 · 목회자</span>
              <EditableText id={"Refresh Pastor Academy"} as="h3">Refresh Pastor Academy</EditableText>
              <ul>
                <li>목회자 아카데미 심포지엄</li>
                <li>목회자 세미나 · 소진관리</li>
                <li>개별 지원: 심리상담 · 재정 · 장학</li>
              </ul>
              <span className="wh-progress-badge">진행 중 · 전투복 프로젝트</span>
            </div>

            <div className="wh-snapshot-card">
              <span className="wh-snapshot-tag wh-snapshot-tag-orange">PROJECT 2 · 선교사</span>
              <EditableText id={"Missionary Care"} as="h3">Missionary Care</EditableText>
              <ul>
                <li>WEWE 스테이 (주거)</li>
                <li>레위인의 모빌리티 (이동)</li>
                <li>Poiema 돌봄 · WE+WE 커넥트</li>
              </ul>
              <span className="wh-progress-badge">진행 중 · WEWE 스테이</span>
            </div>

            <div className="wh-snapshot-card wh-snapshot-card-foundation">
              <span className="wh-snapshot-tag wh-snapshot-tag-dark">FOUNDATION · 운영 기반</span>
              <EditableText id={"지속 가능한 돌봄 모델"} as="h3">지속 가능한 돌봄 모델</EditableText>
              <ul>
                <li>임의단체 → 사단법인 전환</li>
                <li>다분야 전문가 협업 · 투명한 운영</li>
                <li>평신도 · 교회 · 기업 후원의 선순환</li>
              </ul>
              <Link to="/about/sustainability" className="wh-ministry-link">
                운영·지속가능성 보기 <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* OUR STORY (요약 — 전체 내용은 /about) */}
      <section id="about" className="wh-about">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"OUR STORY"} as="span" className="wh-eyebrow wh-eyebrow-center">OUR STORY</EditableText>
            <EditableText id={"위(WE)로자의 위(WE)로자"} as="h2" className="wh-h2-center">위(WE)로자의 위(WE)로자</EditableText>

            <blockquote className="wh-verse">
              &ldquo;너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서
              먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라&rdquo;
              <cite>(신명기 14:29)</cite>
            </blockquote>

            {/* (2026-10-09 가독성) 한 덩어리였던 소개 문단을 "첫 문장(크게) + 설명(핵심 구절 강조)"으로 나눔 */}
            <div className="wh-about-intro">
              <EditableText id={"WEWE는 가장 깊은 상실의 자리에서 시작되었습니다."} className="wh-about-intro-lead">WEWE는 가장 깊은 상실의 자리에서 시작되었습니다.</EditableText>
              <p>
                누군가의 아픔을 돌보는 이들이 정작 자신의 무너진 마음은 숨겨야만 하는 현실 속에서,
                WEWE는 <strong>현대판 레위인인 목회자와 선교사들의 &lsquo;위로자&rsquo;</strong>가 되고자 합니다.
              </p>
            </div>
          </Reveal>

          <Reveal as="div" className="wh-story-gallery" delay={100}>
            <div className="side left" style={{ backgroundImage: `url(${STORY_GALLERY.left})` }} />
            <div className="arch" style={{ backgroundImage: `url(${STORY_GALLERY.center})` }} />
            <div className="side right" style={{ backgroundImage: `url(${STORY_GALLERY.right})` }} />
          </Reveal>

          <div className="wh-about-more">
            <Link to="/about" className="wh-btn wh-btn-ghost">
              WEWE 이야기 더 보기 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 사역 소개 (요약 — 전체 내용은 /about/ministries) */}
      <section id="ministries" className="wh-ministries">
        <div className="wh-container">
          <Reveal>
            <EditableText id={"OUR MINISTRIES"} as="span" className="wh-eyebrow wh-eyebrow-center">OUR MINISTRIES</EditableText>
            <EditableText id={"우리가 하는 일"} as="h2" className="wh-h2-center">우리가 하는 일</EditableText>
            <EditableText id={"Blessed Blessing, 하나님의 영광을 위해 사람을 세웁니다."} className="wh-ministries-lead">Blessed Blessing, 하나님의 영광을 위해 사람을 세웁니다.</EditableText>
          </Reveal>

          <div className="wh-ministry-grid">
            {/* 프로젝트 1 — 목회자 */}
            <Reveal as="div" className="wh-ministry-card wh-ministry-teal">
              <div
                className="wh-ministry-photo"
                style={{ backgroundImage: `url(${MINISTRY_PHOTOS.teal})` }}
                role="img"
                aria-label="기도하는 손"
              />
              <span className="wh-ministry-tag">PROJECT 1 · 목회자</span>
              <EditableText id={"Refresh Pastor Academy"} as="h3">Refresh Pastor Academy</EditableText>
              <EditableText id={"레위인의 회복 — 성도의 위로가 되어온 목회자님이, 이제는 위로받으실 시간입니다."} className="wh-ministry-desc">레위인의 회복 — 성도의 위로가 되어온 목회자님이, 이제는 위로받으실 시간입니다.</EditableText>
              <EditableText id={"목회자 아카데미(심포지엄·세미나·소진관리)와 개별 지원(심리상담, 재정, 장학사업)으로 구성됩니다."} className="wh-ministry-summary">목회자 아카데미(심포지엄·세미나·소진관리)와 개별 지원(심리상담, 재정, 장학사업)으로 구성됩니다.</EditableText>
              <Link to="/about/ministries" className="wh-ministry-link">자세히 보기 <ArrowRight size={14} /></Link>
            </Reveal>

            {/* 프로젝트 2 — 선교사 */}
            <Reveal as="div" className="wh-ministry-card wh-ministry-orange" delay={100}>
              <div
                className="wh-ministry-photo"
                style={{ backgroundImage: `url(${MINISTRY_PHOTOS.orange})` }}
                role="img"
                aria-label="맞잡은 두 손, 환대"
              />
              <span className="wh-ministry-tag">PROJECT 2 · 선교사</span>
              <EditableText id={"Missionary Care"} as="h3">Missionary Care</EditableText>
              <EditableText id={"선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록."} className="wh-ministry-desc">선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록.</EditableText>

              <div className="wh-ministry-live">
                <span className="wh-ministry-icon"><HomeIcon size={18} /></span>
                <div>
                  <strong>WEWE 스테이 <span className="wh-live-badge">이용 가능</span></strong>
                  <span>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼</span>
                </div>
                <a href="/stay" className="wh-ministry-link">바로가기 <ArrowRight size={14} /></a>
              </div>

              <EditableText id={"그 외 레위인의 모빌리티(차량 쉐어링), Poiema 돌봄(힐링캠프), WE+WE 커넥트(멤버십)도 준비하고"} className="wh-ministry-summary">그 외 레위인의 모빌리티(차량 쉐어링), Poiema 돌봄(힐링캠프), WE+WE 커넥트(멤버십)도 준비하고 있습니다.</EditableText>
              <Link to="/about/ministries#project2" className="wh-ministry-link">자세히 보기 <ArrowRight size={14} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 사역 소식 */}
      <section id="news" className="wh-news">
        <div className="wh-container">
          <EditableText id={"MINISTRY NEWS"} as="span" className="wh-eyebrow wh-eyebrow-center">MINISTRY NEWS</EditableText>
          <EditableText id={"사역 소식"} as="h2" className="wh-h2-center">사역 소식</EditableText>

          {newsLoaded && newsPosts.length > 0 ? (
            <>
              <div className="wh-newsgrid">
                {newsPosts.map((post) => {
                  const imageCount = Array.isArray(post.image_urls) ? post.image_urls.length : 0;
                  const thumbnail = post.cover_image_url || (imageCount > 0 ? post.image_urls[0] : '');
                  return (
                    <Link key={post.id} to={`/news/${post.slug}`} className="wh-newsgrid-card">
                      {thumbnail ? (
                        <div className="wh-newsgrid-image" style={{ backgroundImage: `url(${thumbnail})` }} />
                      ) : (
                        <div className="wh-newsgrid-image wh-newsgrid-image-placeholder">
                          <span>WEWE</span>
                        </div>
                      )}
                      <div className="wh-newsgrid-caption">
                        <span className="wh-newsgrid-date">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
                        </span>
                        <h3>{post.title}</h3>
                      </div>
                    </Link>
                  );
                })}
                {/* 글이 8개(4×2)보다 적으면 남는 칸을 빈 박스로 채워 그리드 형태를 유지합니다. */}
                {Array.from({ length: Math.max(0, NEWS_GRID_SIZE - newsPosts.length) }).map((_, idx) => (
                  <div key={`wh-newsgrid-empty-${idx}`} className="wh-newsgrid-card wh-newsgrid-empty" aria-hidden="true" />
                ))}
              </div>
              <div className="wh-news-more">
                <Link to="/news" className="wh-btn wh-btn-ghost">
                  사역 소식 전체 보기 <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <div className="wh-news-card">
              <EditableText id={"WEWE가 걸어가는 이야기와 사역 현장의 소식을 곧 이곳에서 전해드릴게요."}>WEWE가 걸어가는 이야기와 사역 현장의 소식을 곧 이곳에서 전해드릴게요.</EditableText>
              <span className="wh-news-soon">Coming soon</span>
            </div>
          )}
        </div>
      </section>

      {/* WEWE 문의 섹션 (2026-09-13 이동) — 위위스테이 랜딩 페이지의 "궁금한 점이
          있으신가요?" 아래에 있던 것을, WEWE 자체에 대한 문의이므로 이 페이지의 사역
          소식 섹션 아래로 옮겼습니다. */}
      <section className="wh-inquiry">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <EditableText id={"CONTACT"} as="span" className="wh-eyebrow wh-eyebrow-center">CONTACT</EditableText>
            <EditableText id={"위위(WEWE)에 대해 궁금한 점이 있으신가요?"} as="h2" className="wh-h2-center">위위(WEWE)에 대해 궁금한 점이 있으신가요?</EditableText>
            <EditableText id={"비영리단체 WEWE, 후원, 사역 소개 등 무엇이든 편하게 문의해 주세요."} className="wh-inquiry-lead">비영리단체 WEWE, 후원, 사역 소개 등 무엇이든 편하게 문의해 주세요.</EditableText>
          </Reveal>

          <Reveal as="div" className="wh-inquiry-card" delay={80}>
            {inquirySubmitted ? (
              <div className="wh-inquiry-success">
                <CheckCircle2 size={40} />
                <EditableText id={"문의가 접수되었습니다"} as="h3">문의가 접수되었습니다</EditableText>
                <EditableText id={"남겨주신 연락처로 WEWE 팀이 곧 안내해 드리겠습니다. 감사합니다."}>남겨주신 연락처로 WEWE 팀이 곧 안내해 드리겠습니다. 감사합니다.</EditableText>
              </div>
            ) : (
              <form className="wh-inquiry-form" onSubmit={handleInquirySubmit}>
                <div className="wh-inquiry-form-row">
                  <div className="wh-form-group">
                    <label>이름 *</label>
                    <input
                      type="text"
                      name="name"
                      value={inquiryForm.name}
                      onChange={handleInquiryFormChange}
                      placeholder="성함을 입력해주세요"
                      required
                    />
                  </div>
                  <div className="wh-form-group">
                    <label>이메일 *</label>
                    <input
                      type="email"
                      name="email"
                      value={inquiryForm.email}
                      onChange={handleInquiryFormChange}
                      placeholder="이메일 주소를 입력해주세요"
                      required
                    />
                  </div>
                </div>

                <div className="wh-form-group">
                  <label>전화번호 *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={inquiryForm.phone}
                    onChange={handleInquiryFormChange}
                    placeholder="연락 가능한 전화번호를 입력해주세요"
                    required
                  />
                </div>

                <div className="wh-form-group">
                  <label>메시지</label>
                  <textarea
                    name="message"
                    value={inquiryForm.message}
                    onChange={handleInquiryFormChange}
                    rows="4"
                    placeholder="궁금하신 점이나 남기고 싶은 말씀을 자유롭게 적어주세요"
                  />
                </div>

                {inquiryError && <p className="wh-form-error">{inquiryError}</p>}

                <button type="submit" className="wh-btn wh-btn-primary wh-inquiry-submit" disabled={inquirySubmitting}>
                  <Send size={18} />
                  {inquirySubmitting ? '접수 중...' : '문의하기'}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      {/* WEWE CTA 밴드 (2026-09-10 수정) — 이전에는 위위 스테이 회원가입을 안내하는
          문구/링크였는데, 여기는 위위 랜딩 페이지이므로 위위 자체 가입·로그인으로 바꿨습니다. */}
      {isLoggedIn === false && (
      <section className="wh-cta">
        <div className="wh-container wh-cta-inner">
          <div>
            <EditableText id={"위위의 사역에 관심이 있으신가요?"} as="h2">위위의 사역에 관심이 있으신가요?</EditableText>
            <EditableText id={"WEWE에 가입하고 위로자의 위로자 공동체와 함께해 주세요."}>WEWE에 가입하고 위로자의 위로자 공동체와 함께해 주세요.</EditableText>
          </div>
          <div className="wh-cta-actions">
            <Link to="/signup" className="wh-btn wh-btn-primary">가입하기</Link>
            <Link to="/login" className="wh-btn wh-btn-ghost">로그인</Link>
          </div>
        </div>
      </section>
      )}

      <WeweFooter />

      <style>{`
        /* 히어로 */
        .wh-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 6rem 2rem;
          background-color: #14201d;
          overflow: hidden;
        }

        .wh-hero-slide {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1.4s ease;
        }

        .wh-hero-slide.active {
          opacity: 1;
        }

        .wh-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(15,20,18,0.6) 0%, rgba(15,20,18,0.5) 45%, rgba(15,20,18,0.88) 100%);
        }

        .wh-hero-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
          margin: 0 auto;
        }

        .wh-hero-eyebrow {
          display: inline-block;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          color: #f0c9a0;
          margin-bottom: 1.1rem;
        }

        .wh-hero h1 {
          color: #fff;
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          margin-bottom: 1.1rem;
        }

        .wh-hero p {
          color: rgba(255,255,255,0.92);
          font-size: 1.1rem;
          line-height: 1.75;
          margin-bottom: 2.25rem;
        }

        .wh-hero-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* 한눈에 보는 WEWE (2026-10-03 신규) */
        .wh-snapshot {
          padding: 5rem 0 1.5rem;
          background: var(--wh-bg);
        }

        .wh-snapshot-mission {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          max-width: 620px;
          margin: 0 auto;
          text-align: center;
          color: var(--wh-ink-soft);
          font-weight: 600;
          line-height: 1.7;
        }

        .wh-snapshot-mission svg {
          flex-shrink: 0;
          color: var(--wh-orange-deep);
        }

        .wh-snapshot-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2.5rem;
        }

        .wh-snapshot-card {
          display: flex;
          flex-direction: column;
          padding: 1.75rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wh-snapshot-card-foundation {
          background: var(--wh-ink);
          border-color: var(--wh-ink);
        }

        .wh-snapshot-tag {
          display: inline-block;
          align-self: flex-start;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.9rem;
        }

        .wh-snapshot-tag-teal {
          color: var(--wh-teal);
          background: rgba(20, 107, 113, 0.1);
        }

        .wh-snapshot-tag-orange {
          color: var(--wh-orange-deep);
          background: rgba(217, 123, 63, 0.1);
        }

        .wh-snapshot-tag-dark {
          color: #f0c9a0;
          background: rgba(255,255,255,0.1);
        }

        .wh-snapshot-card h3 {
          color: var(--wh-ink);
          font-size: 1.2rem;
          margin-bottom: 0.9rem;
        }

        .wh-snapshot-card-foundation h3 {
          color: #fff;
        }

        .wh-snapshot-card ul {
          margin: 0 0 1.1rem;
          padding-left: 1.1rem;
          color: var(--wh-ink-soft);
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .wh-snapshot-card-foundation ul {
          color: rgba(255,255,255,0.78);
        }

        .wh-snapshot-card .wh-progress-badge {
          align-self: flex-start;
          margin-left: 0;
          margin-top: auto;
        }

        .wh-snapshot-card-foundation .wh-ministry-link {
          color: #f0c9a0;
        }

        /* OUR STORY */
        .wh-about {
          padding: 5.5rem 0;
          background: var(--wh-bg);
        }

        .wh-about p {
          color: var(--wh-ink-soft);
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        /* (2026-10-09 가독성) 말씀 인용 — 한글 기울임꼴을 없애고 글씨를 키웠습니다(위위란? 페이지와 동일). */
        .wh-verse {
          margin: 0 0 2.25rem;
          padding: 1.75rem 2rem;
          background: rgba(217, 123, 63, 0.07);
          border-left: 4px solid var(--wh-orange);
          border-radius: 0 12px 12px 0;
          color: var(--wh-ink);
          font-weight: 600;
          font-size: 1.08rem;
          line-height: 1.9;
        }

        .wh-verse cite {
          display: block;
          margin-top: 0.75rem;
          color: var(--wh-orange-deep);
          font-style: normal;
          font-weight: 800;
          font-size: 0.9rem;
        }

        .wh-about-intro {
          text-align: center;
          max-width: 620px;
          margin: 0 auto;
        }

        .wh-about .wh-about-intro p {
          color: var(--wh-ink);
          font-size: 1.04rem;
          line-height: 1.9;
          margin-bottom: 0.6rem;
        }

        .wh-about .wh-about-intro .wh-about-intro-lead {
          font-size: 1.3rem;
          font-weight: 800;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .wh-about-intro strong {
          color: var(--wh-teal);
          font-weight: 800;
        }

        .wh-story-gallery {
          display: grid;
          grid-template-columns: 1fr 1.15fr 1fr;
          align-items: end;
          gap: 1rem;
          margin: 2.5rem 0 1rem;
        }

        .wh-story-gallery .side,
        .wh-story-gallery .arch {
          background-size: cover;
          background-position: center;
          background-color: var(--wh-bg-soft);
        }

        .wh-story-gallery .side {
          height: 190px;
          border-radius: 6px;
        }

        .wh-story-gallery .arch {
          height: 260px;
          border-radius: 160px 160px 6px 6px;
        }

        .wh-about-more {
          text-align: center;
          margin-top: 1.5rem;
        }

        /* 사역 소개 */
        .wh-ministries {
          padding: 5.5rem 0;
          background: var(--wh-bg-soft);
        }

        .wh-ministries-lead {
          text-align: center;
          color: var(--wh-ink-soft);
          font-weight: 600;
          margin: -1rem 0 2.5rem;
        }

        .wh-ministry-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.75rem;
        }

        .wh-ministry-card {
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          padding: 2rem;
          border-top: 4px solid transparent;
          display: flex;
          flex-direction: column;
        }

        .wh-ministry-photo {
          height: 140px;
          margin: -2rem -2rem 1.25rem;
          border-radius: 8px 8px 0 0;
          background-size: cover;
          background-position: center;
        }

        .wh-ministry-teal {
          border-top-color: var(--wh-teal);
        }

        .wh-ministry-orange {
          border-top-color: var(--wh-orange);
        }

        .wh-ministry-tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          margin-bottom: 0.9rem;
        }

        .wh-ministry-teal .wh-ministry-tag {
          color: var(--wh-teal);
          background: rgba(20, 107, 113, 0.1);
        }

        .wh-ministry-orange .wh-ministry-tag {
          color: var(--wh-orange-deep);
          background: rgba(217, 123, 63, 0.1);
        }

        .wh-ministry-card h3 {
          color: var(--wh-ink);
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
        }

        .wh-ministry-desc {
          color: var(--wh-ink-soft);
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .wh-ministry-summary {
          color: var(--wh-stone);
          font-size: 0.88rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .wh-ministry-live {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 1rem 0;
          margin-bottom: 0.5rem;
          border-top: 1px solid var(--wh-line);
          border-bottom: 1px solid var(--wh-line);
        }

        .wh-ministry-live > strong {
          display: block;
          color: var(--wh-ink);
          font-size: 0.98rem;
          margin-bottom: 0.15rem;
        }

        .wh-ministry-live > div > span {
          display: block;
          color: var(--wh-stone);
          font-size: 0.87rem;
          line-height: 1.5;
        }

        .wh-ministry-icon {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.1);
          color: var(--wh-orange-deep);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wh-ministry-link {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--wh-orange-deep);
          text-decoration: none;
          white-space: nowrap;
        }

        .wh-ministry-live .wh-ministry-link {
          margin-top: 0;
          margin-left: auto;
        }

        .wh-ministry-link:hover {
          text-decoration: underline;
        }

        /* 사역 소식 */
        .wh-news {
          padding: 5rem 0;
          background: var(--wh-bg);
        }

        .wh-news-card {
          max-width: 640px;
          margin: 0 auto;
          text-align: center;
          padding: 2.5rem;
          background: var(--wh-bg-soft);
          border: 1px dashed var(--wh-line);
          border-radius: 10px;
        }

        .wh-news-card p {
          color: var(--wh-ink-soft);
          margin-bottom: 0.9rem;
          font-size: 1rem;
        }

        .wh-news-soon {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--wh-stone);
          border: 1px solid var(--wh-line);
          border-radius: 999px;
          padding: 0.3rem 0.9rem;
        }

        /* 인스타그램 피드처럼 한 줄에 4개, 최대 2줄(8개)까지만 노출 (2026-09-10) —
           NewsListPage.jsx의 정사각형 사진 카드 그리드와 같은 느낌으로 맞췄습니다. */
        .wh-newsgrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .wh-newsgrid-card {
          position: relative;
          display: block;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 6px;
          background: var(--wh-bg-soft);
          text-decoration: none;
        }

        .wh-newsgrid-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-color: var(--wh-bg-soft);
          transition: transform 0.35s ease;
        }

        .wh-newsgrid-card:hover .wh-newsgrid-image {
          transform: scale(1.05);
        }

        .wh-newsgrid-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--wh-teal) 0%, var(--wh-orange) 100%);
        }

        .wh-newsgrid-image-placeholder span {
          color: rgba(255,255,255,0.9);
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: 0.06em;
        }

        .wh-newsgrid-caption {
          position: absolute;
          inset: auto 0 0 0;
          padding: 1.4rem 0.7rem 0.55rem;
          background: linear-gradient(0deg, rgba(10,10,9,0.85) 0%, rgba(10,10,9,0.5) 55%, rgba(10,10,9,0) 100%);
        }

        .wh-newsgrid-date {
          display: block;
          font-size: 0.64rem;
          font-weight: 700;
          color: rgba(255,255,255,0.75);
          margin-bottom: 0.15rem;
        }

        .wh-newsgrid-caption h3 {
          color: #fff;
          font-size: 0.82rem;
          line-height: 1.4;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .wh-newsgrid-empty {
          border: 1px dashed var(--wh-line);
          background: var(--wh-bg-soft);
        }

        .wh-news-more {
          text-align: center;
          margin-top: 1.75rem;
        }

        /* WEWE 문의 섹션 (2026-09-13 이동) */
        .wh-inquiry {
          padding: 5rem 0;
          background: var(--wh-bg-soft);
        }

        .wh-inquiry-lead {
          text-align: center;
          color: var(--wh-ink-soft);
          margin: 0.75rem 0 0;
        }

        .wh-inquiry-card {
          max-width: 640px;
          margin: 2.25rem auto 0;
          padding: 2.25rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 14px;
        }

        .wh-inquiry-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .wh-form-group {
          margin-bottom: 1.25rem;
        }

        .wh-form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: var(--wh-ink);
          font-size: 0.9rem;
        }

        .wh-form-group input,
        .wh-form-group textarea {
          width: 100%;
          padding: 0.75rem 0.9rem;
          border: 1px solid var(--wh-line);
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
          background: var(--wh-bg);
          color: var(--wh-ink);
          resize: vertical;
        }

        .wh-form-group input:focus,
        .wh-form-group textarea:focus {
          outline: none;
          border-color: var(--wh-orange);
          box-shadow: 0 0 0 3px rgba(217, 123, 63, 0.15);
        }

        .wh-form-error {
          color: #c0392b;
          font-size: 0.88rem;
          margin: -0.5rem 0 1.25rem;
        }

        .wh-inquiry-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          border: none;
          cursor: pointer;
        }

        .wh-inquiry-submit:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .wh-inquiry-success {
          text-align: center;
          padding: 1.5rem 0;
          color: var(--wh-ink-soft);
        }

        .wh-inquiry-success svg {
          color: var(--wh-orange-deep);
          margin-bottom: 0.75rem;
        }

        .wh-inquiry-success h3 {
          color: var(--wh-ink);
          margin-bottom: 0.5rem;
        }

        /* CTA 밴드 */
        .wh-cta {
          padding: 4rem 0;
          background: var(--wh-ink);
        }

        .wh-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .wh-cta h2 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .wh-cta p {
          color: rgba(255,255,255,0.72);
          margin: 0;
        }

        .wh-cta-actions {
          display: flex;
          gap: 0.85rem;
          flex-shrink: 0;
        }

        .wh-cta .wh-btn-ghost {
          color: #fff;
          border-color: rgba(255,255,255,0.35);
        }

        .wh-cta .wh-btn-ghost:hover {
          border-color: #fff;
          color: #fff;
          background: rgba(255,255,255,0.08);
        }

        /* 모바일 */
        @media (max-width: 860px) {
          .wh-hero {
            /* (2026-09-13) 모바일에서 히어로 버튼과 원형 슬라이드 인디케이터가 거의
               겹칠 만큼 여백이 부족했던 문제 — 하단 여백을 넉넉히 늘렸습니다. 상단 여백도
               로그인 시 헤더 위에 뜨는 "안녕하세요 ○○님" 줄까지 겹치지 않도록 늘렸습니다. */
            min-height: 560px;
            padding: 8.25rem 1.25rem 5rem;
          }

          .wh-hero h1 {
            font-size: 1.9rem;
          }

          .wh-hero p {
            font-size: 0.95rem;
          }

          .wh-ministry-grid,
          .wh-snapshot-grid {
            grid-template-columns: 1fr;
          }

          .wh-snapshot {
            padding: 3.5rem 0 0.5rem;
          }

          .wh-newsgrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .wh-story-gallery {
            grid-template-columns: 1fr 1fr;
          }

          .wh-story-gallery .right {
            display: none;
          }

          .wh-about, .wh-ministries, .wh-news, .wh-inquiry {
            padding: 3.5rem 0;
          }

          .wh-inquiry-card {
            padding: 1.5rem;
          }

          .wh-inquiry-form-row {
            grid-template-columns: 1fr;
          }

          .wh-cta-inner {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweHome;
