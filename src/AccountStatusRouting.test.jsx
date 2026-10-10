import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// 관리자가 삭제 처리한 회원(deletion_pending)의 계정 안내 화면 테스트 (2026-10-10).
// 로그인 직후 이동하는 /stay(첫 화면)에서도 랜딩 페이지가 아니라 삭제 안내가 보여야 합니다.
let mockProfile;

jest.mock('@supabase/supabase-js', () => {
  const query = (table) => {
    const terminal = {
      maybeSingle: () => Promise.resolve({ data: table === 'users' ? mockProfile : null, error: null }),
      single: () => Promise.resolve({ data: table === 'users' ? mockProfile : null, error: null }),
      then: (resolve) => resolve({ data: [], count: 0, error: null }),
    };
    // select/eq/like/order 등 어떤 조건 메서드든 자기 자신을 돌려주는 가짜 쿼리
    const q = new Proxy(terminal, { get: (t, k) => (k in t ? t[k] : () => q) });
    return q;
  };
  return {
    createClient: () => ({
      from: (table) => query(table),
      rpc: () => Promise.resolve({ data: null, error: null }),
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
      storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'u1', email: 'a@b.c' } }, error: null }),
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1', email: 'a@b.c' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({}),
      },
    }),
  };
});

let container;
let root;

beforeEach(() => {
  window.history.pushState({}, '', '/stay');
  window.scrollTo = () => {};
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {} });
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

test('삭제 대기 회원은 /stay 첫 화면에서도 삭제 안내(사유 확인)를 본다', async () => {
  mockProfile = { id: 'u1', role: 'missionary', status: 'deletion_pending', email_verified_at: '2026-10-01', admin_deletion_reason: '중복 가입' };
  // eslint-disable-next-line global-require
  const App = require('./App').default;
  await act(async () => root.render(<App />));
  await flush();
  await flush();
  expect(container.textContent).toContain('계정 삭제 안내');
  expect(container.textContent).toContain('중복 가입');
});
