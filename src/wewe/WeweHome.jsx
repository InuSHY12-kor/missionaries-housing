import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Send, CheckCircle2, Pause, Play, ExternalLink } from 'lucide-react';
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
//
// (2026-10-31 흑백 에디토리얼 시안) 화면 구성을 "흰 바탕 + 검정 글자·버튼 + 위위 주황은 점으로만"으로
// 새로 짰습니다. 관리자 편집 문구(EditableText id)·배너 편집·문의 폼·사역 소식 연동은 그대로입니다.

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
  // (2026-10-31) 이야기 갤러리 가운데 사진과 같은 사진이 두 번 나와 교체 — 고국에서의 쉼(한옥)
  orange: 'https://images.unsplash.com/photo-1662514121891-8f3a97e5a2ea?auto=format&fit=crop&w=700&q=80',
};

// 사역 소식 그리드(2026-09-10 수정) — 인스타그램 피드처럼 한 줄에 4개씩, 최대 2줄(8개)까지만
// 노출합니다. 글이 8개보다 적으면 남는 칸은 빈 박스로 채워 그리드 모양을 유지합니다.
const NEWS_GRID_SIZE = 8;
const HERO_INTERVAL_MS = 6500;

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
      console.error('WEWE 문의 저장 오류:', error);
      setInquiryError('문의를 보내지 못했습니다. 잠시 후 다시 시도하시거나, 아래 카카오톡 채널로 문의해 주세요.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  // (2026-10-31 Impeccable 점검) 3.5초 간격은 전환(1.4초)이 시간의 40%를 차지해 너무 분주했습니다.
  // 6.5초로 늘리고, 일시정지 버튼과 누를 수 있는 원형 인디케이터를 추가했습니다(WCAG 2.2.2).
  // 움직임 줄이기 설정을 켠 방문자에게는 처음부터 멈춘 상태로 보여줍니다.
  const heroCount = heroImages.length;
  const [heroPaused, setHeroPaused] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    setHeroSlide(0);
  }, [heroCount]);
  useEffect(() => {
    if (heroCount < 2 || heroPaused) return undefined;
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroCount);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [heroCount, heroPaused, heroSlide]);

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
  // 히어로 제목 안의 "WEWE"만 주황으로 — 관리자가 제목을 바꿔 WEWE가 빠지면 그냥 검정 한 줄로 보입니다.
  const heroTitleParts = hero.title ? hero.title.split(/(WEWE)/) : [];
  const newsVisible = newsPosts.slice(0, newsPosts.length >= 4 ? newsPosts.length - (newsPosts.length % 4) : newsPosts.length);

  return (
    <div className="wewe-page wewe-home">
      <WeweHeader variant="light" />

      {/* 히어로 (2026-10-31 흑백 에디토리얼) — 사진 위에 글자를 얹던 전면 배너 대신,
          큰 제목·설명을 흰 바탕 위에 먼저 두고 그 아래에 넓은 사진(슬라이드)을 둡니다. */}
      <section id="top" className="we-hero">
        <div className="we-wrap">
          <div className="we-hero-top" style={{ opacity: hero.ready ? 1 : 0, transition: 'opacity 0.2s ease' }}>
            <h1 className="we-hero-title">
              {heroTitleParts.map((part, idx) => (
                part === 'WEWE'
                  // eslint-disable-next-line react/no-array-index-key
                  ? <span key={idx} className="we-accent">{part}</span>
                  // eslint-disable-next-line react/no-array-index-key
                  : <React.Fragment key={idx}>{part}</React.Fragment>
              ))}
            </h1>
            <div className="we-hero-side">
              {hero.eyebrow && <span className="we-label">{hero.eyebrow}</span>}
              {hero.subtitle && (
                <p className="we-hero-sub">
                  {hero.subtitle.split('\n').filter((line) => line.trim()).map((line, idx) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <span className="we-hero-line" key={idx}>{renderRich(line)}</span>
                  ))}
                </p>
              )}
              <div className="we-actions">
                <Link to="/donate" className="we-btn we-btn-fill">
                  후원으로 함께하기 <ArrowRight size={18} />
                </Link>
                <a href="#ministries" className="we-btn we-btn-line">사역 알아보기</a>
              </div>
            </div>
          </div>

          <div className="we-hero-media">
            {hero.ready && heroImages.map((src, idx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${idx}-${src}`}
                className={`we-hero-slide ${idx === heroSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url("${src}")` }}
              />
            ))}

            {heroImages.length > 1 && (
              <div className={`we-hero-controls${heroPaused ? ' is-paused' : ''}`}>
                <button
                  type="button"
                  className="we-hero-ctl"
                  onClick={() => setHeroPaused((prev) => !prev)}
                  aria-label={heroPaused ? '배너 슬라이드 다시 재생' : '배너 슬라이드 일시정지'}
                >
                  {heroPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                {heroImages.map((src, idx) => (
                  <button
                    type="button"
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${idx}-${src}`}
                    className="we-hero-ctl we-hero-num"
                    onClick={() => setHeroSlide(idx)}
                    aria-label={`배너 사진 ${idx + 1}번 보기`}
                    aria-current={idx === heroSlide ? 'true' : undefined}
                  >
                    {/* (2026-10-31) 번호 대신 다른 페이지와 같은 원형 링 — 현재 사진의 링이 주황으로 채워집니다 */}
                    <svg className="we-hero-ring" viewBox="0 0 32 32" aria-hidden="true">
                      <circle className="we-hero-ring-track" cx="16" cy="16" r="14" />
                      {idx === heroSlide && (
                        <circle
                          key={`fill-${heroSlide}`}
                          className="we-hero-ring-fill"
                          cx="16"
                          cy="16"
                          r="14"
                        />
                      )}
                    </svg>
                  </button>
                ))}
              </div>
            )}
            <HeroEditButton defaults={heroDefaults} />
          </div>
        </div>
      </section>

      {/* 이야기 (요약 — 전체 내용은 /about). 섹션마다 왼쪽에 작은 라벨, 오른쪽에 제목을 두는
          2단 머리말을 같은 모양으로 반복합니다. 순서: 히어로 → 이야기 → 사역 → 사역 소식 → 후원 → 문의 */}
      <section id="about" className="we-sec">
        <div className="we-wrap">
          <Reveal className="we-sec-head">
            <EditableText id={"OUR STORY"} as="span" className="we-label">OUR STORY</EditableText>
            <div>
              <EditableText id={"위(WE)로자의 위(WE)로자"} as="h2">위(WE)로자의 위(WE)로자</EditableText>
              <EditableText id={"WEWE는 가장 깊은 상실의 자리에서 시작되었습니다."} className="we-sec-lead">WEWE는 가장 깊은 상실의 자리에서 시작되었습니다.</EditableText>
            </div>
          </Reveal>

          <div className="we-story">
            <Reveal className="we-story-text">
              <p>
                누군가의 아픔을 돌보는 이들이 정작 자신의 무너진 마음은 숨겨야만 하는 현실 속에서,
                WEWE는 <strong>현대판 레위인인 목회자와 선교사들의 &lsquo;위로자&rsquo;</strong>가 되고자 합니다.
              </p>
              <blockquote className="we-verse">
                <p>
                  &ldquo;너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서
                  먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라&rdquo;
                </p>
                <cite>신명기 14:29</cite>
              </blockquote>
              <Link to="/about" className="we-link">
                WEWE 이야기 더 보기 <ArrowRight size={16} />
              </Link>
            </Reveal>
            <Reveal className="we-story-photos" delay={80}>
              <div className="we-photo we-story-main" style={{ backgroundImage: `url(${STORY_GALLERY.center})` }} role="img" aria-label="맞잡은 두 손" />
              <div className="we-photo" style={{ backgroundImage: `url(${STORY_GALLERY.left})` }} role="img" aria-label="소파에 나란히 앉아 나누는 대화" />
              <div className="we-photo" style={{ backgroundImage: `url(${STORY_GALLERY.right})` }} role="img" aria-label="마주 편 두 손바닥" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 사역 (요약 — 전체 내용은 /about/ministries) */}
      <section id="ministries" className="we-sec we-sec-soft">
        <div className="we-wrap">
          <Reveal className="we-sec-head">
            <EditableText id={"OUR MINISTRIES"} as="span" className="we-label">OUR MINISTRIES</EditableText>
            <div>
              <EditableText id={"우리가 하는 일"} as="h2">우리가 하는 일</EditableText>
              <EditableText id={"현대판 레위인인 목회자와 선교사가 다시 일어설 수 있도록, 그들의 위로자가 됩니다."} className="we-sec-lead">현대판 레위인인 목회자와 선교사가 다시 일어설 수 있도록, 그들의 위로자가 됩니다.</EditableText>
            </div>
          </Reveal>

          <div className="we-ministries">
            {/* 프로젝트 1 — 목회자 */}
            <Reveal as="article" className="we-ministry">
              <div className="we-photo we-ministry-photo" style={{ backgroundImage: `url(${MINISTRY_PHOTOS.teal})` }} role="img" aria-label="기도하는 손" />
              <span className="we-num">01 · 목회자</span>
              <EditableText id={"Refresh Pastor Academy"} as="h3">Refresh Pastor Academy</EditableText>
              <EditableText id={"레위인의 회복 — 성도의 위로가 되어온 목회자님이, 이제는 위로받으실 시간입니다."} className="we-ministry-desc">레위인의 회복 — 성도의 위로가 되어온 목회자님이, 이제는 위로받으실 시간입니다.</EditableText>
              <ul className="we-ministry-list">
                <li>목회자 아카데미 · 심포지엄</li>
                <li>목회자 세미나 · 소진관리</li>
                <li>개별 지원: 심리상담 · 재정 · 장학</li>
              </ul>
              <Link to="/about/ministries/combat-uniform" className="we-status-row">
                <span className="we-status-text">
                  <strong>전투복 프로젝트</strong>
                  <span>사역의 자리로 다시 나서는 목회자님께 맞춤 정장 한 벌을 선물합니다</span>
                </span>
                <span className="we-status">진행 중</span>
                <ArrowRight size={18} className="we-status-arrow" aria-hidden="true" />
              </Link>
              <Link to="/about/ministries" className="we-link">자세히 보기 <ArrowRight size={16} /></Link>
            </Reveal>

            {/* 프로젝트 2 — 선교사 */}
            <Reveal as="article" className="we-ministry" delay={80}>
              <div className="we-photo we-ministry-photo" style={{ backgroundImage: `url(${MINISTRY_PHOTOS.orange})` }} role="img" aria-label="고즈넉한 한옥" />
              <span className="we-num">02 · 선교사</span>
              <EditableText id={"Missionary Care"} as="h3">Missionary Care</EditableText>
              <EditableText id={"선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록."} className="we-ministry-desc">선교사의 회복 — 열방의 나그네가, 고국에서는 편히 쉬실 수 있도록.</EditableText>
              <ul className="we-ministry-list">
                <li>WEWE 스테이 (주거)</li>
                <li>레위인의 모빌리티 (차량 쉐어링)</li>
                <li>Poiema 돌봄 (힐링캠프) · WE+WE 커넥트 (멤버십)</li>
              </ul>
              {/* 위위 스테이는 별도 사이트라 새 창으로 열립니다 — 아이콘과 숨김 문구로 미리 알려줍니다. */}
              <a href="/stay" target="_blank" rel="noopener" className="we-status-row">
                <span className="we-status-text">
                  <strong>WEWE 스테이</strong>
                  <span>선교사와 숙소 제공자를 잇는 신뢰의 공유 숙소 플랫폼</span>
                </span>
                <EditableText id={"오픈 준비 중"} as="span" className="we-status">오픈 준비 중</EditableText>
                <ExternalLink size={18} className="we-status-arrow" aria-hidden="true" />
                <span className="we-sr-only">(새 창에서 열림)</span>
              </a>
              <Link to="/about/ministries#project2" className="we-link">자세히 보기 <ArrowRight size={16} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 사역 소식 */}
      <section id="news" className="we-sec">
        <div className="we-wrap">
          <div className="we-sec-head">
            <EditableText id={"MINISTRY NEWS"} as="span" className="we-label">MINISTRY NEWS</EditableText>
            <div className="we-sec-head-row">
              <EditableText id={"사역 소식"} as="h2">사역 소식</EditableText>
              {newsLoaded && newsPosts.length > 0 && (
                <Link to="/news" className="we-link">전체 보기 <ArrowRight size={16} /></Link>
              )}
            </div>
          </div>

          {newsLoaded && newsPosts.length > 0 ? (
            // 4개 단위(한 줄)로 끊어서 보여줍니다(4개 미만이면 있는 만큼).
            <div className="we-news">
              {newsVisible.map((post) => {
                const imageCount = Array.isArray(post.image_urls) ? post.image_urls.length : 0;
                const thumbnail = post.cover_image_url || (imageCount > 0 ? post.image_urls[0] : '');
                return (
                  <Link key={post.id} to={`/news/${post.slug}`} className="we-news-card">
                    <div className="we-news-frame">
                      {thumbnail ? (
                        <div className="we-news-image" style={{ backgroundImage: `url(${thumbnail})` }} />
                      ) : (
                        <div className="we-news-image we-news-placeholder"><span>WEWE</span></div>
                      )}
                    </div>
                    <span className="we-news-date">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('ko-KR') : ''}
                    </span>
                    <h3>{post.title}</h3>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="we-news-empty">
              <EditableText id={"WEWE가 걸어가는 이야기와 사역 현장의 소식을 곧 이곳에서 전해드릴게요."}>WEWE가 걸어가는 이야기와 사역 현장의 소식을 곧 이곳에서 전해드릴게요.</EditableText>
              <span className="we-status">Coming soon</span>
            </div>
          )}
        </div>
      </section>

      {/* 후원 — 검정 띠. 버튼은 흰 채움(검정 바탕 위의 반전 버튼), 가입하기는 로그아웃 방문자에게만 */}
      <section className="we-give">
        <div className="we-wrap we-give-inner">
          <Reveal className="we-give-copy">
            <EditableText id={"후원 띠 제목"} as="h2">아픈 위로자의 손을 함께 잡아주세요</EditableText>
            <EditableText id={"후원 띠 설명"}>여러분의 후원은 목회자 회복 프로그램과 선교사 쉼터, 전투복 한 벌이 되어 사역의 현장으로 다시 돌아갑니다.</EditableText>
            <div className="we-actions">
              <Link to="/donate" className="we-btn we-btn-invert">
                후원하기 <ArrowRight size={18} />
              </Link>
              {isLoggedIn === false && (
                <Link to="/signup" className="we-btn we-btn-line-invert">WEWE 가입하기</Link>
              )}
            </div>
          </Reveal>
          <Reveal className="we-give-trust" delay={80}>
            <EditableText id={"지속 가능한 돌봄 모델"} as="h3">지속 가능한 돌봄 모델</EditableText>
            <ul>
              <li>임의단체에서 사단법인으로 전환을 준비하고 있습니다</li>
              <li>다분야 전문가가 함께하며 운영을 투명하게 공개합니다</li>
              <li>평신도 · 교회 · 기업의 후원이 다시 돌봄으로 순환합니다</li>
            </ul>
            <Link to="/about/sustainability" className="we-link we-link-invert">
              운영·지속가능성 보기 <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 문의 — 왼쪽 안내, 오른쪽 폼 */}
      <section className="we-sec">
        <div className="we-wrap we-inquiry">
          <Reveal className="we-inquiry-intro">
            <EditableText id={"CONTACT"} as="span" className="we-label">CONTACT</EditableText>
            <EditableText id={"위위(WEWE)에 대해 궁금한 점이 있으신가요?"} as="h2">위위(WEWE)에 대해 궁금한 점이 있으신가요?</EditableText>
            <EditableText id={"비영리단체 WEWE, 후원, 사역 소개 등 무엇이든 편하게 문의해 주세요."} className="we-sec-lead">비영리단체 WEWE, 후원, 사역 소개 등 무엇이든 편하게 문의해 주세요.</EditableText>
          </Reveal>

          <Reveal className="we-inquiry-body" delay={80}>
            {inquirySubmitted ? (
              <div className="we-inquiry-success" role="status">
                <CheckCircle2 size={36} />
                <EditableText id={"문의가 접수되었습니다"} as="h3">문의가 접수되었습니다</EditableText>
                <EditableText id={"남겨주신 연락처로 WEWE 팀이 곧 안내해 드리겠습니다. 감사합니다."}>남겨주신 연락처로 WEWE 팀이 곧 안내해 드리겠습니다. 감사합니다.</EditableText>
              </div>
            ) : (
              <form className="we-form" onSubmit={handleInquirySubmit}>
                <div className="we-form-row">
                  <div className="we-field">
                    <label htmlFor="wh-inquiry-name">이름 *</label>
                    <input
                      type="text"
                      id="wh-inquiry-name"
                      name="name"
                      autoComplete="name"
                      value={inquiryForm.name}
                      onChange={handleInquiryFormChange}
                      placeholder="성함을 입력해주세요"
                      required
                    />
                  </div>
                  <div className="we-field">
                    <label htmlFor="wh-inquiry-email">이메일 *</label>
                    <input
                      type="email"
                      id="wh-inquiry-email"
                      name="email"
                      autoComplete="email"
                      value={inquiryForm.email}
                      onChange={handleInquiryFormChange}
                      placeholder="이메일 주소를 입력해주세요"
                      required
                    />
                  </div>
                </div>

                <div className="we-field">
                  <label htmlFor="wh-inquiry-phone">전화번호 *</label>
                  <input
                    type="tel"
                    id="wh-inquiry-phone"
                    name="phone"
                    autoComplete="tel"
                    value={inquiryForm.phone}
                    onChange={handleInquiryFormChange}
                    placeholder="연락 가능한 전화번호를 입력해주세요"
                    required
                  />
                </div>

                <div className="we-field">
                  <label htmlFor="wh-inquiry-message">메시지</label>
                  <textarea
                    id="wh-inquiry-message"
                    name="message"
                    value={inquiryForm.message}
                    onChange={handleInquiryFormChange}
                    rows="5"
                    placeholder="궁금하신 점이나 남기고 싶은 말씀을 자유롭게 적어주세요"
                  />
                </div>

                {inquiryError && <p className="we-form-error" role="alert">{inquiryError}</p>}

                <button type="submit" className="we-btn we-btn-fill we-form-submit" disabled={inquirySubmitting}>
                  <Send size={18} />
                  {inquirySubmitting ? '접수 중...' : '문의하기'}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        /* 흑백 에디토리얼 (2026-10-31) — 무채색 바탕 + 위위 주황은 점·밑줄·강조 글자에만.
           주 버튼은 검정 채움, 모서리는 4px(사진·입력)·6px(버튼)로 얕게, 구획은 그림자 대신 가는 선.
           큰 제목 크기와 자간(-0.02em)은 공개된 기준이 없어 직접 정한 값입니다. */
        .wewe-home {
          --we-black: #000;
          --we-ink: #222;
          --we-ink-2: #424242;
          --we-ink-3: #6b6b6b; /* 기준표의 #808080은 흰 바탕 작은 글자 대비 4.5:1 미달이라 한 단계 진하게 */
          --we-line: #d4d4d4;
          --we-line-lite: #ebebeb;
          --we-bg-2: #fafafa;
          --we-bg-3: #f2f2f2;
          --we-accent: #d97b3f;
          --we-accent-text: #a65424; /* 흰 바탕 작은 글자용 진한 주황 */
          font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
          color: var(--we-ink);
          word-break: keep-all;
        }

        .wewe-home h1,
        .wewe-home h2,
        .wewe-home h3 {
          color: var(--we-black);
          margin: 0;
        }

        .we-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 72px;
        }

        .we-label {
          display: inline-block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--we-ink-3);
        }

        .we-accent {
          color: var(--we-accent);
        }

        .we-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        /* 버튼 — 검정 채움 / 가는 선 / 검정 바탕 위 반전 */
        .we-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .we-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
          padding: 0 24px;
          border-radius: 6px;
          border: 1px solid transparent;
          font: inherit;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
        }

        .we-btn:focus-visible,
        .we-link:focus-visible,
        .we-status-row:focus-visible,
        .we-news-card:focus-visible,
        .we-hero-ctl:focus-visible {
          outline: 2px solid var(--we-black);
          outline-offset: 3px;
        }

        .we-btn-fill {
          background: var(--we-black);
          color: #fff;
        }

        .we-btn-fill:hover {
          background: #2e2e2e;
        }

        .we-btn-fill:disabled {
          background: var(--we-line);
          color: #fff;
          cursor: not-allowed;
        }

        .we-btn-line {
          background: #fff;
          color: var(--we-black);
          border-color: var(--we-line);
        }

        .we-btn-line:hover {
          border-color: var(--we-black);
        }

        .we-btn-invert {
          background: #fff;
          color: var(--we-black);
        }

        .we-btn-invert:hover {
          background: var(--we-bg-3);
        }

        .we-btn-line-invert {
          background: transparent;
          color: #fff;
          border-color: rgba(255, 255, 255, 0.4);
        }

        .we-btn-line-invert:hover {
          border-color: #fff;
        }

        .we-give .we-btn:focus-visible,
        .we-give .we-link:focus-visible {
          outline-color: #fff;
        }

        /* 글자 링크 — 평소엔 검정, 올리면 주황 밑줄 */
        .we-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 44px;
          color: var(--we-black);
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: underline;
          text-decoration-color: var(--we-line);
          text-decoration-thickness: 1px;
          text-underline-offset: 6px;
          transition: text-decoration-color 0.2s ease-in-out;
        }

        .we-link:hover {
          text-decoration-color: var(--we-accent);
          text-decoration-thickness: 2px;
        }

        .we-link-invert {
          color: #fff;
          text-decoration-color: rgba(255, 255, 255, 0.35);
        }

        /* 히어로 */
        .we-hero {
          padding: 88px 0 0;
        }

        .we-hero-top {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 56px;
          align-items: end;
        }

        .we-hero-title {
          font-size: clamp(2.5rem, 5.2vw, 4.25rem);
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-wrap: balance;
        }

        .we-hero-side .we-label {
          margin-bottom: 14px;
        }

        .we-hero-sub {
          margin: 0 0 28px;
          font-size: 1.0625rem;
          line-height: 1.75;
          color: var(--we-ink-2);
        }

        .we-hero-line {
          display: block;
          text-wrap: pretty;
        }

        .we-hero-media {
          position: relative;
          margin-top: 56px;
          height: clamp(280px, 38vw, 480px);
          border-radius: 4px;
          overflow: hidden;
          background: var(--we-bg-3);
        }

        .we-hero-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 0.45s ease-in-out;
        }

        .we-hero-slide.active {
          opacity: 1;
        }

        .we-hero-controls {
          position: absolute;
          right: 16px;
          bottom: 16px;
          z-index: 2;
          display: flex;
          gap: 2px;
          padding: 4px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.62);
        }

        .we-hero-ctl {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
          padding: 0 8px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          font: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          cursor: pointer;
        }

        .we-hero-ctl:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
        }

        .we-hero-num {
          min-width: 32px;
          padding: 0 6px;
        }

        .we-hero-ring {
          width: 16px;
          height: 16px;
          transform: rotate(-90deg);
        }

        .we-hero-ring-track {
          fill: none;
          stroke: rgba(255, 255, 255, 0.45);
          stroke-width: 3;
        }

        .we-hero-ring-fill {
          fill: none;
          stroke: var(--we-accent);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 87.9;
          stroke-dashoffset: 87.9;
          animation: weHeroRingFill ${HERO_INTERVAL_MS}ms linear forwards;
        }

        .we-hero-controls.is-paused .we-hero-ring-fill {
          animation-play-state: paused;
        }

        @keyframes weHeroRingFill {
          from { stroke-dashoffset: 87.9; }
          to { stroke-dashoffset: 0; }
        }

        .we-hero-controls .we-hero-ctl:focus-visible {
          outline-color: #fff;
          outline-offset: 1px;
        }

        /* 섹션 공통 — 왼쪽 라벨 + 오른쪽 제목, 아래 검정 1px 선 */
        .we-sec {
          padding: 112px 0;
        }

        .we-sec-soft {
          background: var(--we-bg-2);
          box-shadow: inset 0 1px 0 var(--we-line-lite), inset 0 -1px 0 var(--we-line-lite);
        }

        .we-sec-head {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 48px;
          padding-bottom: 32px;
          margin-bottom: 48px;
          border-bottom: 1px solid var(--we-black);
        }

        .we-sec-head .we-label {
          padding-top: 10px;
        }

        .we-sec-head h2,
        .we-inquiry-intro h2 {
          font-size: clamp(1.75rem, 2.8vw, 2.25rem);
          line-height: 1.35;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-wrap: balance;
        }

        .we-sec-head-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
        }

        .we-sec-lead {
          margin: 12px 0 0;
          font-size: 1.0625rem;
          line-height: 1.7;
          color: var(--we-ink-2);
          max-width: 36em;
        }

        /* 이야기 */
        .we-story {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 48px;
          align-items: start;
        }

        .we-story-text > p {
          margin: 0 0 32px;
          font-size: 1.0625rem;
          line-height: 1.8;
          color: var(--we-ink-2);
        }

        .we-story-text strong {
          color: var(--we-black);
          font-weight: 600;
        }

        .we-verse {
          margin: 0 0 24px;
          padding: 24px 0;
          border-top: 1px solid var(--we-line);
          border-bottom: 1px solid var(--we-line);
        }

        .we-verse p {
          margin: 0 0 12px;
          font-size: 0.975rem;
          line-height: 1.8;
          color: var(--we-ink-2);
        }

        .we-verse cite {
          font-style: normal;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--we-accent-text);
        }

        .we-story-photos {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 8px;
          height: 520px;
        }

        .we-photo {
          border-radius: 4px;
          background-color: var(--we-bg-3);
          background-size: cover;
          background-position: center;
        }

        .we-story-main {
          grid-row: 1 / 3;
        }

        /* 사역 — 두 칸을 가는 세로선으로 나눕니다 */
        .we-ministries {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .we-ministry {
          display: flex;
          flex-direction: column;
          padding-right: 48px;
        }

        .we-ministry + .we-ministry {
          padding-right: 0;
          padding-left: 48px;
          border-left: 1px solid var(--we-line);
        }

        .we-ministry-photo {
          aspect-ratio: 16 / 10;
          margin-bottom: 28px;
        }

        .we-num {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--we-ink-3);
          font-variant-numeric: tabular-nums;
        }

        .we-ministry h3 {
          margin: 8px 0 12px;
          font-size: 1.625rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .we-ministry-desc {
          margin: 0 0 16px;
          font-size: 1rem;
          line-height: 1.75;
          color: var(--we-ink-2);
        }

        .we-ministry-list {
          margin: 0 0 28px;
          padding: 0;
          list-style: none;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--we-ink-2);
        }

        .we-ministry-list li {
          padding: 10px 0;
          border-top: 1px solid var(--we-line-lite);
        }

        .we-ministry-list li:last-child {
          border-bottom: 1px solid var(--we-line-lite);
        }

        /* 진행 상태 줄 — 줄 전체가 링크, 주황 점으로 상태 표시 */
        .we-status-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          margin-bottom: 12px;
          border: 1px solid var(--we-line);
          border-radius: 4px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          transition: border-color 0.2s ease-in-out;
        }

        .we-status-row:hover {
          border-color: var(--we-black);
        }

        .we-status-text {
          flex: 1;
          min-width: 0;
        }

        .we-status-text strong {
          display: block;
          margin-bottom: 4px;
          font-size: 1rem;
          font-weight: 600;
          color: var(--we-black);
        }

        .we-status-text span {
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--we-ink-3);
        }

        .we-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--we-black);
          white-space: nowrap;
        }

        .we-status::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--we-accent);
        }

        .we-status-arrow {
          flex-shrink: 0;
          color: var(--we-ink-3);
        }

        .we-status-row:hover .we-status-arrow {
          color: var(--we-black);
        }

        .we-ministry > .we-link {
          align-self: flex-start;
          margin-top: auto;
        }

        /* 사역 소식 — 4열 */
        .we-news {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px 24px;
        }

        .we-news-card {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .we-news-frame {
          aspect-ratio: 1;
          margin-bottom: 14px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--we-bg-3);
        }

        .we-news-image {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          transition: transform 0.45s cubic-bezier(.165, .84, .44, 1);
        }

        .we-news-card:hover .we-news-image {
          transform: scale(1.03);
        }

        .we-news-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .we-news-placeholder span {
          font-weight: 700;
          color: var(--we-ink-3);
        }

        .we-news-date {
          display: block;
          margin-bottom: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--we-ink-3);
          font-variant-numeric: tabular-nums;
        }

        .we-news-card h3 {
          font-size: 1rem;
          line-height: 1.5;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .we-news-card:hover h3 {
          text-decoration: underline;
          text-decoration-color: var(--we-accent);
          text-decoration-thickness: 2px;
          text-underline-offset: 4px;
        }

        .we-news-empty {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 32px 0;
          border-bottom: 1px solid var(--we-line);
          font-size: 1.0625rem;
          line-height: 1.7;
          color: var(--we-ink-2);
        }

        .we-news-empty p {
          margin: 0;
        }

        /* 후원 — 검정 띠 */
        .we-give {
          padding: 104px 0;
          background: var(--we-black);
          color: #fff;
        }

        .we-give-inner {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 72px;
          align-items: end;
        }

        .we-give h2 {
          color: #fff;
          font-size: clamp(2rem, 3.6vw, 2.75rem);
          line-height: 1.3;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-wrap: balance;
        }

        .we-give-copy p {
          margin: 16px 0 32px;
          max-width: 34em;
          font-size: 1.0625rem;
          line-height: 1.75;
          color: #bdbdbd;
        }

        .we-give-trust {
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.25);
        }

        .we-give-trust h3 {
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .we-give-trust ul {
          margin: 0 0 12px;
          padding: 0;
          list-style: none;
        }

        .we-give-trust li {
          position: relative;
          padding: 6px 0 6px 16px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #d4d4d4;
        }

        .we-give-trust li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.95em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--we-accent);
        }

        /* 문의 */
        .we-inquiry {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 72px;
          align-items: start;
        }

        .we-inquiry-intro .we-label {
          margin-bottom: 14px;
        }

        .we-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .we-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .we-field label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--we-ink-2);
        }

        .we-field input,
        .we-field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid transparent;
          border-radius: 4px;
          background: var(--we-bg-3);
          color: var(--we-black);
          font: inherit;
          font-size: 1rem;
          transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }

        .we-field input {
          height: 52px;
        }

        .we-field textarea {
          resize: vertical;
          min-height: 140px;
          line-height: 1.6;
        }

        .we-field input::placeholder,
        .we-field textarea::placeholder {
          color: #808080;
        }

        .we-field input:focus,
        .we-field textarea:focus {
          outline: none;
          border-color: var(--we-black);
          background: #fff;
        }

        .we-form-error {
          margin: 0;
          font-size: 0.925rem;
          font-weight: 600;
          color: #c62828;
        }

        .we-form-submit {
          align-self: flex-start;
          min-width: 160px;
        }

        .we-inquiry-success {
          padding: 40px 0;
          border-top: 1px solid var(--we-black);
          color: var(--we-ink-2);
          line-height: 1.7;
        }

        .we-inquiry-success svg {
          color: var(--we-accent);
          margin-bottom: 12px;
        }

        .we-inquiry-success h3 {
          font-size: 1.375rem;
          margin-bottom: 8px;
        }

        .we-inquiry-success p {
          margin: 0;
        }

        /* 1000px 이하 — 2단을 1단으로 */
        @media (max-width: 1000px) {
          .we-wrap {
            padding: 0 20px;
          }

          .we-hero {
            padding-top: 48px;
          }

          .we-hero-top,
          .we-sec-head,
          .we-story,
          .we-give-inner,
          .we-inquiry {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .we-hero-media {
            margin-top: 40px;
          }

          .we-sec {
            padding: 72px 0;
          }

          .we-sec-head {
            gap: 8px;
            margin-bottom: 32px;
            padding-bottom: 24px;
          }

          .we-sec-head .we-label {
            padding-top: 0;
          }

          .we-story-photos {
            height: 380px;
          }

          .we-news {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px 16px;
          }

          .we-give {
            padding: 72px 0;
          }

          .we-give-inner {
            gap: 40px;
          }

          .we-inquiry {
            gap: 32px;
          }
        }

        /* 768px 미만 — 휴대폰 */
        @media (max-width: 767px) {
          .we-ministries {
            grid-template-columns: 1fr;
          }

          .we-ministry,
          .we-ministry + .we-ministry {
            padding: 0;
            border-left: none;
          }

          .we-ministry + .we-ministry {
            margin-top: 48px;
            padding-top: 48px;
            border-top: 1px solid var(--we-line);
          }

          .we-story-photos {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 220px 140px;
            height: auto;
          }

          .we-story-main {
            grid-row: auto;
            grid-column: 1 / 3;
          }

          .we-status-row {
            flex-wrap: wrap;
            gap: 8px 12px;
          }

          .we-status-text {
            flex-basis: 100%;
          }

          .we-status-arrow {
            margin-left: auto;
          }

          .we-form-row {
            grid-template-columns: 1fr;
          }

          .we-form-submit {
            align-self: stretch;
          }

          .we-actions .we-btn {
            flex: 1 1 auto;
          }

          .we-news-empty {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .we-hero-slide,
          .we-news-image,
          .we-hero-ring-fill {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default WeweHome;
