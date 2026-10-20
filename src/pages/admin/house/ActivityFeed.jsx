import React from 'react';
import { EVENT_TYPES, ROOMS, FEED_MAX } from './houseConfig';

// "N분 전" 수준으로만 보여줍니다(분 단위로 내린 시각만 받음).
export function timeAgo(iso, now = new Date()) {
  const diffMin = Math.max(0, Math.floor((now - new Date(iso)) / 60000));
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

function ActivityFeed({ events, freshKeys, now }) {
  const list = (events || []).slice(0, FEED_MAX);
  return (
    <section className="whh-card" aria-labelledby="whh-feed-title">
      <h2 id="whh-feed-title" className="whh-card-title">최근 활동</h2>
      <ol className="whh-feed" aria-live="polite">
        {list.length === 0 && <li className="whh-feed-empty">아직 기록된 활동이 없어요.</li>}
        {list.map((e, i) => {
          const cfg = EVENT_TYPES[e.type];
          if (!cfg) return null;
          const key = `${e.type}|${e.occurred_at}|${i}`;
          return (
            <li key={key} className={`whh-feed-item${freshKeys.has(`${e.type}|${e.occurred_at}`) ? ' is-fresh' : ''}`}>
              <span className={`whh-dot whh-dot--${cfg.room}`} aria-hidden="true" />
              <span className="whh-feed-text">
                <strong>{cfg.label}</strong>
                <span className="whh-feed-meta">{ROOMS[cfg.room]?.name} · {timeAgo(e.occurred_at, now)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default ActivityFeed;
