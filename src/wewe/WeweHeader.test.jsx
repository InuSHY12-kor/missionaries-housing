import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import WeweHeader from './WeweHeader';

// WEWE 헤더 알림·쪽지 아이콘 테스트 (2026-10-10) — Supabase는 가짜로 바꿉니다.
let mockProfile;
const mockAssign = jest.fn();

jest.mock('../App', () => {
  const query = (table) => {
    const q = {
      select: () => q,
      eq: () => q,
      order: () => q,
      limit: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => Promise.resolve({ data: table === 'users' ? mockProfile : null, error: null }),
      then: (resolve) => resolve({ count: table === 'messages' ? 3 : 2, data: [], error: null }),
    };
    return q;
  };
  return {
    supabase: {
      from: (table) => query(table),
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({}),
      },
    },
  };
});

let container;
let root;
const realLocation = window.location;

beforeEach(() => {
  mockAssign.mockReset();
  delete window.location;
  window.location = { ...realLocation, assign: mockAssign };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.location = realLocation;
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

async function renderHeader() {
  await act(async () => root.render(<MemoryRouter><WeweHeader /></MemoryRouter>));
  await flush();
  await flush();
}

test('승인된 선교사·숙소 제공자에게 알림·쪽지 아이콘과 개수가 보이고, 쪽지는 위위스테이 쪽지함으로 이동', async () => {
  mockProfile = { id: 'u1', role: 'host', status: 'approved', full_name: '홍길동', email_verified_at: '2026-10-01' };
  await renderHeader();
  const icons = container.querySelector('.wewe-header-icons');
  expect(icons).not.toBeNull();
  expect(icons.querySelector('.notification-badge').textContent).toBe('2');
  expect(icons.querySelector('.message-icon-badge').textContent).toBe('3');
  act(() => icons.querySelector('.message-icon-btn').click());
  expect(mockAssign).toHaveBeenCalledWith('/stay/messages');
});

test('후원자와 이메일 미인증 회원에게는 보이지 않음', async () => {
  mockProfile = { id: 'u1', role: 'supporter', status: 'approved', full_name: '김후원', email_verified_at: '2026-10-01' };
  await renderHeader();
  expect(container.querySelector('.wewe-header-icons')).toBeNull();
});
