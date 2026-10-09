import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import SiteStats from './SiteStats';

// 관리자 통계 화면 테스트 (2026-10-10) — admin_site_stats 응답을 가짜로 넣습니다.
const mockRpc = jest.fn();
jest.mock('../App', () => ({ supabase: { rpc: (...args) => mockRpc(...args) } }));

const STATS = {
  today: { visitors: 12, pageviews: 40 },
  total: { visitors: 345, pageviews: 1200, since: '2026-10-10T00:00:00Z' },
  range: { visitors: 80, pageviews: 300, sessions: 95 },
  daily: [
    { day: '2026-10-09', visitors: 5, pageviews: 9 },
    { day: '2026-10-10', visitors: 12, pageviews: 40 },
  ],
  sources: [{ source: '네이버', sessions: 30 }, { source: 'instagram', sessions: 10 }],
  campaigns: [{ source: 'instagram', medium: null, campaign: '10월', sessions: 10 }],
  pages: [{ site: 'wewe', path: '/', pageviews: 100, visitors: 60 }],
  devices: [{ device: 'mobile', visitors: 50 }],
  sites: [{ site: 'wewe', visitors: 60, pageviews: 200 }],
};

let container;
let root;

beforeEach(() => {
  mockRpc.mockReset();
  mockRpc.mockImplementation(() => Promise.resolve({ data: STATS, error: null }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('오늘·총 방문자, 유입 경로, 일별 그래프를 보여주고 사이트를 바꿔 다시 조회', async () => {
  await act(async () => root.render(<SiteStats />));
  const text = container.textContent;
  expect(text).toContain('오늘 방문자');
  expect(container.querySelector('.ss-card-accent strong').textContent).toBe('12');
  expect(text).toContain('345');
  expect(text).toContain('네이버');
  expect(container.querySelectorAll('.ss-bar-col').length).toBe(2);
  expect(mockRpc).toHaveBeenLastCalledWith('admin_site_stats', expect.objectContaining({ p_site: null }));

  const stayBtn = [...container.querySelectorAll('.ss-seg button')].find((b) => b.textContent === 'WEWE STAY');
  await act(async () => stayBtn.click());
  expect(mockRpc).toHaveBeenLastCalledWith('admin_site_stats', expect.objectContaining({ p_site: 'stay' }));
});

test('추적 링크 만들기', async () => {
  await act(async () => root.render(<SiteStats />));
  const input = container.querySelector('input[placeholder^="예: instagram"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  act(() => {
    setter.call(input, 'kakao');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(container.querySelector('.ss-linkmaker-result code').textContent).toBe('https://wewestay.com/?utm_source=kakao');
});
