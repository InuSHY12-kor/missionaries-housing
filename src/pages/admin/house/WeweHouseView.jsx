import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Play } from 'lucide-react';
import OfficeScene from './OfficeScene';
import ActivityFeed, { timeAgo } from './ActivityFeed';
import useRepoActivity, { DEV_ACTIVE_MIN } from './useRepoActivity';
import useHouseActivity from './useHouseActivity';
import {
  ROOMS, ROOM_ORDER, COUNTER_LABELS, UNIFORM_STATS, EVENT_TYPES, QUEUE_MAX, ANIM_MS, POLL_MS,
} from './houseConfig';
import './wewe-house.css';

// WEWE 하우스 화면 본체. 데이터는 fetcher로만 받으므로(기본: get_house_activity RPC)
// 페이지(WeweHouse.jsx)가 supabase를 연결해 넘겨줍니다.
//  - 첫 응답은 피드·카운터에만 반영하고, 이후 새로 생긴 이벤트만 방 연출 대기열에 넣어 차례로 재생합니다.
//  - 실제 이벤트가 없으면 방마다 잔잔한 반복 움직임만 보입니다(가짜 활동을 만들지 않음).
//  - "연출 미리보기"는 관리자가 누를 때만 재생되며 피드·카운터에는 기록되지 않습니다.

const PREVIEW_TYPES = ['uniform_preview', 'stay_approved', 'booking_created', 'member_approved_missionary', 'supporter_joined', 'post_published'];

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => !!(window.matchMedia && window.matchMedia(query).matches));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}

const fmtTime = (d) => (d ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d) : '-');
const fmtNum = (n) => Number(n || 0).toLocaleString();

function RoomDetail({ roomId, counters, devActivity }) {
  const room = ROOMS[roomId];
  if (!room) {
    return (
      <section className="whh-card">
        <h2 className="whh-card-title">방 살펴보기</h2>
        <p className="whh-muted">집 안의 방이나 아래 방 이름을 누르면 사역별 현황을 볼 수 있어요.</p>
      </section>
    );
  }
  const live = room.status === 'live';
  return (
    <section className="whh-card whh-room-detail" aria-live="polite">
      <div className="whh-room-head">
        <h2 className="whh-card-title">{room.name}</h2>
        <span className={`whh-status ${live ? 'is-live' : 'is-planned'}`}>{live ? '진행 중' : '준비 중'}</span>
      </div>
      <p className="whh-room-ministry">{room.group} · {room.ministry}</p>
      <p className="whh-muted">{room.description}</p>
      <p className="whh-owner">담당: <strong>{room.owner}</strong></p>
      {room.duties?.length > 0 && (
        <ul className="whh-duties">
          {room.duties.map((d) => <li key={d}>{d}</li>)}
        </ul>
      )}
      {room.counters.length > 0 && (
        <dl className="whh-stats">
          {room.counters.map((k) => (
            <div key={k}>
              <dt>{COUNTER_LABELS[k]}</dt>
              <dd>{counters ? fmtNum(counters[k]) : '-'}</dd>
            </div>
          ))}
        </dl>
      )}
      {roomId === 'web' && (
        <div className="whh-dev">
          <p className={`whh-dev-state${devActivity?.working ? ' is-on' : ''}`}>
            {devActivity?.working ? 'Claude와 작업 중' : '대기 중'}
          </p>
          {devActivity?.label && (
            <p className="whh-muted">
              최근 작업: {devActivity.label}{devActivity.at ? ` · ${timeAgo(devActivity.at.toISOString())}` : ''}
            </p>
          )}
          {devActivity?.error && <p className="whh-note">GitHub 활동을 확인하지 못했어요({devActivity.error}).</p>}
          <p className="whh-note">※ 저장소의 최근 브랜치 푸시·PR 시각 기준(최근 {DEV_ACTIVE_MIN}분), 3분마다 확인</p>
        </div>
      )}
      {roomId === 'tailor' && (
        <>
          <dl className="whh-stats">
            <div><dt>지원·추천</dt><dd>{fmtNum(UNIFORM_STATS.recommended)}</dd></div>
            <div><dt>수혜</dt><dd>{fmtNum(UNIFORM_STATS.served)}</dd></div>
          </dl>
          <p className="whh-note">※ {UNIFORM_STATS.source}</p>
        </>
      )}
    </section>
  );
}

function CounterSummary({ counters, devActivity }) {
  return (
    <section className="whh-card" aria-labelledby="whh-counter-title">
      <h2 id="whh-counter-title" className="whh-card-title">방별 현황</h2>
      <ul className="whh-counter-list">
        {ROOM_ORDER.map((id) => {
          const room = ROOMS[id];
          const live = room.status === 'live';
          let value;
          if (!live) value = '준비 중';
          else if (id === 'ceo') value = '홍현지 · 근무 중';
          else if (id === 'web') value = devActivity?.working ? '김바름 · Claude와 작업 중' : '김바름 · 대기';
          else if (id === 'tailor') value = `수혜 ${fmtNum(UNIFORM_STATS.served)} · 추천 ${fmtNum(UNIFORM_STATS.recommended)}`;
          else value = room.counters.map((k) => `${COUNTER_LABELS[k]} ${counters ? fmtNum(counters[k]) : '-'}`).join(' · ');
          return (
            <li key={id} className={live ? '' : 'is-planned'}>
              <span className={`whh-dot whh-dot--${id}`} aria-hidden="true" />
              <span className="whh-counter-name">{room.name}</span>
              <span className="whh-counter-value">{value}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WeweHouseView({ fetcher, pollMs = POLL_MS, backLink = null, hero = null, repoFetchJson }) {
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [queueTick, setQueueTick] = useState(0);
  const [freshKeys, setFreshKeys] = useState(() => new Set());
  const [previewType, setPreviewType] = useState(PREVIEW_TYPES[0]);
  const [now, setNow] = useState(() => new Date());
  const [hidden, setHidden] = useState(() => document.hidden);
  const [inView, setInView] = useState(true);
  const queueRef = useRef([]);
  const seqRef = useRef(0);
  const sceneRef = useRef(null);
  const freshTimer = useRef(null);

  const enqueue = useCallback((items) => {
    if (reducedRef.current || items.length === 0) return;
    queueRef.current.push(...items);
    // 너무 많이 쌓이면 앞쪽(오래된 것)은 건너뛰고 피드에만 남깁니다.
    while (queueRef.current.length > QUEUE_MAX) queueRef.current.shift();
    setQueueTick((t) => t + 1);
  }, []);

  const onNewEvents = useCallback((events) => {
    setFreshKeys(new Set(events.map((e) => `${e.type}|${e.occurred_at}`)));
    clearTimeout(freshTimer.current);
    freshTimer.current = setTimeout(() => setFreshKeys(new Set()), 10000);
    enqueue(
      events
        .filter((e) => EVENT_TYPES[e.type])
        .map((e) => ({ ...e, config: EVENT_TYPES[e.type], key: `ev-${(seqRef.current += 1)}` })),
    );
  }, [enqueue]);

  const { data, error, status, lastUpdated, refresh } = useHouseActivity({ fetcher, onNewEvents, pollMs });
  const devActivity = useRepoActivity(repoFetchJson ? { fetchJson: repoFetchJson } : undefined);

  // 대기열 재생: 하나씩, 화면이 보일 때만
  const paused = hidden || !inView;
  useEffect(() => {
    if (playing || paused) return;
    const next = queueRef.current.shift();
    if (next) setPlaying(next);
  }, [playing, queueTick, paused]);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => setPlaying(null), ANIM_MS);
    return () => clearTimeout(t);
  }, [playing]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(tick);
      clearTimeout(freshTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el || !window.IntersectionObserver) return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => { if (lastUpdated) setNow(new Date()); }, [lastUpdated]);

  const playPreview = () => {
    const config = EVENT_TYPES[previewType];
    if (!config) return;
    if (config.room) setSelectedRoom(config.room);
    enqueue([{ type: previewType, occurred_at: new Date().toISOString(), config, key: `pv-${(seqRef.current += 1)}`, preview: true }]);
  };

  const counters = data?.counters;
  const connected = status === 'ok';

  return (
    <div className="whh-page">
      {/* 상단 배너(랜딩 페이지와 같은 스타일) — 페이지(WeweHouse.jsx)가 넘겨줍니다 */}
      {hero}
      <div className="whh-container">
        <div className="whh-toolbar-row">
          <div className="whh-toolbar-left">{backLink}</div>
          <div className="whh-toolbar">
            <span className={`whh-conn ${connected ? 'is-ok' : status === 'error' ? 'is-error' : ''}`}>
              {connected ? <Wifi size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
              {connected ? '연결됨' : status === 'error' ? '연결 끊김' : '연결 중'}
            </span>
            <span className="whh-updated">마지막 갱신 {fmtTime(lastUpdated)}</span>
            <button type="button" className="btn btn-secondary whh-btn-std" onClick={refresh}>
              <RefreshCw size={16} aria-hidden="true" /> 새로고침
            </button>
          </div>
        </div>

        {error && <p className="whh-error" role="alert">활동을 불러오지 못했습니다. ({error})</p>}

        <div className="whh-layout">
          <div className="whh-main">
            <div className="whh-scene-wrap" ref={sceneRef}>
              <OfficeScene
                playing={playing}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
                paused={paused}
                counters={data?.counters}
                devActivity={devActivity}
              />
              {playing && (
                <p className="whh-now-playing">
                  {playing.preview ? '미리보기 · ' : ''}{playing.config.label}
                </p>
              )}
            </div>
            <div className="whh-room-tabs" role="group" aria-label="방 선택">
              {ROOM_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`whh-room-tab${selectedRoom === id ? ' is-selected' : ''}${ROOMS[id].status === 'live' ? '' : ' is-planned'}`}
                  aria-pressed={selectedRoom === id}
                  onClick={() => setSelectedRoom(id)}
                >
                  <span className={`whh-dot whh-dot--${id}`} aria-hidden="true" />
                  {ROOMS[id].name}
                  {ROOMS[id].status !== 'live' && <span className="whh-tab-note">준비 중</span>}
                </button>
              ))}
            </div>
          </div>

          <aside className="whh-side">
            <RoomDetail roomId={selectedRoom} counters={counters} devActivity={devActivity} />
            <CounterSummary counters={counters} devActivity={devActivity} />
            <ActivityFeed events={data?.events} freshKeys={freshKeys} now={now} />
            <section className="whh-card">
              <h2 className="whh-card-title">연출 미리보기</h2>
              <p className="whh-muted">실제 기록과 상관없이 화면에서만 재생됩니다. 전투복 프로젝트 연출은 여기서만 볼 수 있어요.</p>
              <div className="whh-preview">
                <select value={previewType} onChange={(e) => setPreviewType(e.target.value)} aria-label="미리볼 연출">
                  {PREVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>{EVENT_TYPES[t].label}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary whh-btn-std" onClick={playPreview} disabled={reduced}>
                  <Play size={16} aria-hidden="true" /> 재생
                </button>
              </div>
              {reduced && <p className="whh-note">기기에서 '동작 줄이기'가 켜져 있어 움직임을 재생하지 않습니다.</p>}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default WeweHouseView;
