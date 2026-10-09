import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../App';

// 방문 통계 수집 (2026-10-10) — 관리자 페이지 "통계" 탭에서 봅니다.
// 개인을 알아볼 수 있는 정보는 보내지 않습니다.
//   visitor_id: 브라우저마다 한 번 만드는 무작위 ID(localStorage) → "방문자 수"
//   session_id: 탭을 닫으면 사라지는 무작위 ID(sessionStorage) → "방문(세션) 수", 유입 경로는 세션의 첫 페이지 기준
//   referrer / utm_*: 어디서 들어왔는지 (검색·SNS·공유 링크의 ?utm_source=...)
// 관리자 화면(/admin, /stay/admin), 검색 로봇·자동화 브라우저, 개발 중인 로컬 화면(localhost)은 세지 않습니다.
// DB: track_page_view() (supabase/migrations/20261009102812_site_analytics.sql)

const VISITOR_KEY = 'wewe_visitor_id';
const SESSION_KEY = 'wewe_session_id';
const ENTRY_KEY = 'wewe_session_entry';

function randomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  // 아주 오래된 브라우저용
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readOrCreate(storage, key) {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = randomId();
      storage.setItem(key, value);
    }
    return value;
  } catch (e) {
    return null; // 저장소를 막아둔 브라우저는 세지 않습니다
  }
}

function isBot() {
  const ua = navigator.userAgent || '';
  return navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(ua);
}

function deviceType() {
  const ua = navigator.userAgent || '';
  if (/ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function trackPageView(site, fullPath) {
  if (isBot()) return;
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;
  if (/^\/(stay\/)?admin(\/|$)/.test(fullPath)) return;
  const visitorId = readOrCreate(window.localStorage, VISITOR_KEY);
  if (!visitorId) return;
  let sessionId = null;
  let isEntry = false;
  try {
    sessionId = window.sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = randomId();
      window.sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    if (!window.sessionStorage.getItem(ENTRY_KEY)) {
      isEntry = true;
      window.sessionStorage.setItem(ENTRY_KEY, '1');
    }
  } catch (e) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  supabase
    .rpc('track_page_view', {
      p_site: site,
      p_path: fullPath,
      p_referrer: isEntry ? document.referrer || null : null,
      p_utm_source: isEntry ? params.get('utm_source') : null,
      p_utm_medium: isEntry ? params.get('utm_medium') : null,
      p_utm_campaign: isEntry ? params.get('utm_campaign') : null,
      p_visitor_id: visitorId,
      p_session_id: sessionId,
      p_is_entry: isEntry,
      p_device: deviceType(),
    })
    .then(() => {}, () => {}); // 통계 실패는 화면에 영향을 주지 않습니다
}

// site: 'wewe' | 'stay', basePath: 라우터 basename ('' 또는 '/stay')
function PageViewTracker({ site, basePath = '' }) {
  const location = useLocation();
  const last = useRef(null);
  useEffect(() => {
    const fullPath = `${basePath}${location.pathname}` || '/';
    if (last.current === fullPath) return; // 같은 페이지 안에서 쿼리만 바뀐 경우 등은 한 번만
    last.current = fullPath;
    trackPageView(site, fullPath);
  }, [location.pathname, site, basePath]);
  return null;
}

export default PageViewTracker;
