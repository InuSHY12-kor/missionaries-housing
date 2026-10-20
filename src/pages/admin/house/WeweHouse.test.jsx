import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import WeweHouseView from './WeweHouseView';
import { diffNewEvents } from './useHouseActivity';
import { timeAgo } from './ActivityFeed';
import { summarizeRepo } from './useRepoActivity';

// WEWE 하우스 (2026-10-20): 새 이벤트 감지, 첫 응답은 연출 없이 피드에만, 이후 새 이벤트만 방 연출
const E = (type, at) => ({ type, occurred_at: at });

test('새 이벤트 감지: 같은 type·시각 묶음의 개수 차이만 새 것으로', () => {
  const prev = [E('booking_created', '2026-10-20T01:00:00Z'), E('post_published', '2026-10-19T01:00:00Z')];
  const next = [
    E('booking_created', '2026-10-20T01:00:00Z'),
    E('booking_created', '2026-10-20T01:00:00Z'),
    E('stay_approved', '2026-10-20T02:00:00Z'),
    E('post_published', '2026-10-19T01:00:00Z'),
  ];
  expect(diffNewEvents(prev, next)).toEqual([E('booking_created', '2026-10-20T01:00:00Z'), E('stay_approved', '2026-10-20T02:00:00Z')]);
  expect(diffNewEvents(next, next)).toEqual([]);
});

test('시각은 "N분 전" 수준으로만', () => {
  const now = new Date('2026-10-20T10:00:00Z');
  expect(timeAgo('2026-10-20T09:59:30Z', now)).toBe('방금');
  expect(timeAgo('2026-10-20T09:45:00Z', now)).toBe('15분 전');
  expect(timeAgo('2026-10-20T07:00:00Z', now)).toBe('3시간 전');
  expect(timeAgo('2026-10-17T10:00:00Z', now)).toBe('3일 전');
});

test('김바름 웹 관리실: 최근 20분 안의 PR·푸시가 있으면 작업 중', () => {
  const now = new Date('2026-10-20T10:00:00Z');
  const pulls = [{ number: 90, title: 'WEWE 하우스', updated_at: '2026-10-20T09:50:00Z' }];
  const activity = [{ timestamp: '2026-10-20T09:55:00Z', ref: 'refs/heads/feature/wewe-house-admin', activity_type: 'push' }];
  const on = summarizeRepo(pulls, activity, now);
  expect(on.working).toBe(true);
  expect(on.label).toBe('feature/wewe-house-admin 푸시');
  const off = summarizeRepo([{ ...pulls[0], updated_at: '2026-10-20T08:00:00Z' }], [], now);
  expect(off.working).toBe(false);
  expect(off.label).toBe('PR #90 WEWE 하우스');
  expect(summarizeRepo([], [], now).working).toBe(false);
});

test('첫 응답은 연출 없이 피드·카운터만, 새로고침으로 생긴 새 이벤트만 방 연출', async () => {
  const first = {
    counters: { approved_stays: 2, bookings_this_month: 1, confirmed_bookings: 3, approved_missionaries: 4, approved_hosts: 3, supporters: 0, published_posts: 7 },
    events: [E('post_published', '2026-10-11T04:44:00Z'), E('member_approved_missionary', '2026-10-09T03:08:00Z')],
  };
  const second = { ...first, events: [E('booking_created', new Date().toISOString()), ...first.events] };
  const fetcher = jest.fn()
    .mockResolvedValueOnce({ data: first, error: null })
    .mockResolvedValue({ data: second, error: null });

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const repoFetchJson = (url) => Promise.resolve(url.includes('/pulls')
    ? [{ number: 90, title: 'WEWE 하우스', updated_at: new Date().toISOString() }]
    : []);
  await act(async () => root.render(<WeweHouseView fetcher={fetcher} pollMs={600000} repoFetchJson={repoFetchJson} />));
  expect(container.textContent).toContain('김바름 · Claude와 작업 중');
  expect(container.textContent).toContain('대표 홍현지');

  expect(container.querySelectorAll('.whh-feed-item').length).toBe(2);
  expect(container.querySelector('.whh-now-playing')).toBeNull();
  expect(container.textContent).toContain('승인된 숙소 2');
  expect(container.textContent).toContain('연결됨');

  const refreshBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('새로고침'));
  await act(async () => refreshBtn.click());
  expect(container.querySelectorAll('.whh-feed-item').length).toBe(3);
  expect(container.querySelector('.whh-feed-item.is-fresh').textContent).toContain('새 예약 요청');
  expect(container.querySelector('.whh-now-playing').textContent).toContain('새 예약 요청이 들어왔어요');

  // 개인정보가 들어갈 자리가 없는지(화면 문구에 이메일·전화 형태가 없음)
  expect(container.textContent).not.toMatch(/@|010-/);

  act(() => root.unmount());
  container.remove();
});
