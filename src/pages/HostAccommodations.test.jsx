import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import HostAccommodations from './HostAccommodations';

// 숙소 관리 상태별 탭·호스트별 보기·삭제 테스트 (2026-10-12) — Supabase는 가짜로 바꿉니다.
const ROWS = [
  { id: 'a1', host_id: 'h1', title: '승인 숙소', location: '서울', status: 'approved', description: '설명', price: 10000, capacity: 2, images: [], users: { full_name: '김호스트', email: 'k@x.com' } },
  { id: 'a2', host_id: 'h2', title: '대기 숙소', location: '부산', status: 'pending', description: '설명', price: 10000, capacity: 2, images: [], users: { full_name: '이호스트', email: 'l@x.com' } },
  { id: 'a3', host_id: 'h2', title: '거절 숙소', location: '대구', status: 'rejected', admin_feedback_type: 'rejection', rejection_reason: '사진 부족', description: '설명', price: 10000, capacity: 2, images: ['https://p.supabase.co/storage/v1/object/public/accommodation-images/h2/1.png'], users: { full_name: '이호스트', email: 'l@x.com' } },
];
const mockDelete = jest.fn();
const mockRemove = jest.fn();

jest.mock('../App', () => {
  const chain = () => {
    const q = {
      select: () => q,
      order: () => q,
      eq: (col, val) => (col === 'id' ? mockDelete(val) : q),
      then: (resolve) => resolve({ data: require('./HostAccommodations.test.rows').ROWS, error: null }),
      delete: () => q,
    };
    return q;
  };
  return {
    supabase: {
      from: () => chain(),
      // (보안 점검 B6) 관리자 화면의 호스트 이메일은 연락처 함수로 받습니다.
      rpc: () => Promise.resolve({ data: [{ id: 'h1', email: 'k@x.com', phone: null }, { id: 'h2', email: 'l@x.com', phone: null }], error: null }),
      storage: { from: () => ({ remove: (...args) => mockRemove(...args) }) },
    },
  };
});
jest.mock('./HostAccommodations.test.rows', () => ({}), { virtual: true });
jest.mock('../components/LocationPicker', () => () => null);

let container;
let root;

beforeEach(() => {
  require('./HostAccommodations.test.rows').ROWS = ROWS;
  mockDelete.mockReset();
  mockDelete.mockImplementation(() => Promise.resolve({ error: null }));
  mockRemove.mockReset();
  mockRemove.mockImplementation(() => Promise.resolve({ error: null }));
  window.confirm = jest.fn(() => true);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));
const titles = () => [...container.querySelectorAll('.accommodation-item h3')].map((h) => h.textContent);

test('관리자: 상태별 탭, 호스트별 보기, 거절 숙소 삭제', async () => {
  await act(async () => root.render(<MemoryRouter><HostAccommodations userProfile={{ id: 'admin', role: 'admin' }} /></MemoryRouter>));
  await flush();
  expect([...container.querySelectorAll('.acc-tab')].map((t) => t.textContent)).toEqual(['전체 3', '승인됨 1', '승인 대기 1', '거절됨 1']);

  const rejectedTab = [...container.querySelectorAll('.acc-tab')].find((t) => t.textContent.startsWith('거절됨'));
  act(() => rejectedTab.click());
  expect(titles()).toEqual(['거절 숙소']);
  expect(container.querySelector('.acc-rejected-hint')).not.toBeNull();

  const del = [...container.querySelectorAll('.accommodation-item button')].find((b) => b.textContent.includes('삭제'));
  await act(async () => del.click());
  await flush();
  expect(mockDelete).toHaveBeenCalledWith('a3');
  expect(mockRemove).toHaveBeenCalledWith(['h2/1.png']);
  expect(titles()).toEqual([]);

  const allTab = container.querySelector('.acc-tab');
  act(() => allTab.click());
  const select = container.querySelector('.acc-host-filter select');
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  act(() => { setter.call(select, 'h1'); select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(titles()).toEqual(['승인 숙소']);
});

test('숙소 제공자: 상태 탭은 있고 호스트별 보기는 없음', async () => {
  require('./HostAccommodations.test.rows').ROWS = ROWS.filter((r) => r.host_id === 'h2');
  await act(async () => root.render(<MemoryRouter><HostAccommodations userProfile={{ id: 'h2', role: 'host' }} /></MemoryRouter>));
  await flush();
  expect(container.querySelectorAll('.acc-tab').length).toBe(4);
  expect(container.querySelector('.acc-host-filter')).toBeNull();
});
