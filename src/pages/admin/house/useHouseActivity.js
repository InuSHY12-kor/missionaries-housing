import { useCallback, useEffect, useRef, useState } from 'react';
import { POLL_MS } from './houseConfig';

// 이벤트에는 ID가 없으므로(개인 식별 방지) "type|시각(분)" 묶음의 개수 차이로 새 이벤트를 찾습니다.
const eventKey = (e) => `${e.type}|${e.occurred_at}`;

export function diffNewEvents(prevEvents, nextEvents) {
  const prevCount = new Map();
  (prevEvents || []).forEach((e) => prevCount.set(eventKey(e), (prevCount.get(eventKey(e)) || 0) + 1));
  const fresh = [];
  (nextEvents || []).forEach((e) => {
    const k = eventKey(e);
    const left = prevCount.get(k) || 0;
    if (left > 0) prevCount.set(k, left - 1);
    else fresh.push(e);
  });
  // 오래된 것부터 재생되도록 시간순으로
  return fresh.sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
}

// fetcher(): Promise<{ data, error }>  — 기본은 supabase.rpc('get_house_activity')
// onNewEvents(events): 이전 응답에 없던 이벤트(첫 응답 제외)
// 탭이 숨겨지면 폴링을 멈추고, 다시 보이면 즉시 갱신합니다.
export default function useHouseActivity({ fetcher, onNewEvents, pollMs = POLL_MS }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('connecting'); // connecting | ok | error
  const [lastUpdated, setLastUpdated] = useState(null);
  const prevEventsRef = useRef(null);
  const onNewRef = useRef(onNewEvents);
  onNewRef.current = onNewEvents;
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const { data: next, error: err } = await fetcher();
      if (err) throw err;
      const events = next?.events || [];
      if (prevEventsRef.current !== null) {
        const fresh = diffNewEvents(prevEventsRef.current, events);
        if (fresh.length && onNewRef.current) onNewRef.current(fresh);
      }
      prevEventsRef.current = events;
      setData(next);
      setError('');
      setStatus('ok');
      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.message || String(e));
      setStatus('error');
    } finally {
      busyRef.current = false;
    }
  }, [fetcher]);

  useEffect(() => {
    let timer = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(refresh, pollMs);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        refresh();
        start();
      }
    };
    refresh();
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, pollMs]);

  return { data, error, status, lastUpdated, refresh };
}
