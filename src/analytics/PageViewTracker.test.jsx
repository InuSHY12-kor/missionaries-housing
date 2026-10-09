import { trackPageView } from './PageViewTracker';

// 방문 통계 수집 테스트 (2026-10-10) — Supabase 호출은 가짜로 바꿉니다.
const mockRpc = jest.fn();
jest.mock('../App', () => ({ supabase: { rpc: (...args) => mockRpc(...args) } }));

const realLocation = window.location;

function setUrl(url) {
  delete window.location;
  window.location = new URL(url);
}

beforeEach(() => {
  mockRpc.mockReset();
  mockRpc.mockImplementation(() => Promise.resolve({ error: null }));
  window.localStorage.clear();
  window.sessionStorage.clear();
  if (!window.crypto) window.crypto = {};
  let n = 0;
  window.crypto.randomUUID = () => `00000000-0000-4000-8000-00000000000${(n += 1)}`;
});

afterAll(() => {
  window.location = realLocation;
});

test('첫 페이지는 유입 경로(utm)와 함께, 다음 페이지는 같은 방문으로 기록', () => {
  setUrl('https://wewestay.com/about?utm_source=instagram&utm_campaign=10월');
  trackPageView('wewe', '/about');
  setUrl('https://wewestay.com/news');
  trackPageView('wewe', '/news');

  expect(mockRpc).toHaveBeenCalledTimes(2);
  const [name, first] = mockRpc.mock.calls[0];
  const second = mockRpc.mock.calls[1][1];
  expect(name).toBe('track_page_view');
  expect(first).toMatchObject({ p_site: 'wewe', p_path: '/about', p_is_entry: true, p_utm_source: 'instagram', p_utm_campaign: '10월' });
  expect(second).toMatchObject({ p_path: '/news', p_is_entry: false, p_utm_source: null });
  expect(second.p_visitor_id).toBe(first.p_visitor_id);
  expect(second.p_session_id).toBe(first.p_session_id);
});

test('관리자 화면과 로컬 개발 화면은 세지 않는다', () => {
  setUrl('https://wewestay.com/stay/admin');
  trackPageView('stay', '/stay/admin');
  trackPageView('wewe', '/admin/posts/new');
  setUrl('http://localhost:3000/about');
  trackPageView('wewe', '/about');
  expect(mockRpc).not.toHaveBeenCalled();
});
