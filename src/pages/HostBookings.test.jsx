import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import HostBookings from './HostBookings';

// 숙소 제공자 예약 관리: 탭 분류(미확인/확인된/이전)와 기간·숙소 검색 조건 테스트 (2026-11-02)
let mockBookings = [];
jest.mock('../App', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => Promise.resolve({ data: mockBookings, error: null }) }),
      }),
    }),
  },
}));
jest.mock('../utils/memberContacts', () => ({
  fetchMemberContacts: () => Promise.resolve({}),
  withContact: (user) => user,
}));
jest.mock('../components/PageHero', () => () => null);

const kstDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
};

const booking = (id, accId, status, checkIn, checkOut, extra = {}) => ({
  id,
  accommodation_id: accId,
  accommodations: { title: accId === 'a1' ? '제주 숙소' : '강릉 숙소', location: '', host_id: 'h1' },
  users: { full_name: '선교사' },
  guest_id: 'g1',
  status,
  payment_status: 'unpaid',
  check_in: kstDate(checkIn),
  check_out: kstDate(checkOut),
  total_price: 0,
  created_at: '2026-11-01T00:00:00Z',
  ...extra,
});

let container;
let root;

beforeEach(() => {
  mockBookings = [
    booking('A', 'a1', 'pending', 10, 12),                        // 미확인
    booking('B', 'a2', 'confirmed', 20, 22),                      // 확인된
    booking('C', 'a1', 'cancelled', 5, 7),                        // 이전(취소)
    booking('D', 'a2', 'confirmed', -32, -30),                    // 이전(지난 숙박)
    booking('E', 'a2', 'confirmed', -152, -150),                  // 3개월 밖
    booking('F', 'a1', 'pending', -12, -10),                      // 이전(확인 못 한 채 지남)
    booking('G', 'a2', 'confirmed', -4, -2, { payment_status: 'paid' }), // 결제됐지만 입실 확인 전 → 확인된
  ];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));
const tabCounts = () => [...container.querySelectorAll('.hb-tab-count')].map((e) => e.textContent);
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (text) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const shownTitles = () => [...container.querySelectorAll('.booking-item h3')].map((e) => e.textContent);

test('처음에는 최근 3개월 예약을 미확인/확인된/이전으로 나눠 보여 줌', async () => {
  await act(async () => root.render(<HostBookings userProfile={{ id: 'h1' }} />));
  await flush();
  expect(tabCounts()).toEqual(['1', '2', '3']);
  expect(shownTitles()).toEqual(['제주 숙소']);

  click(button('확인된 예약'));
  // 입실일이 가까운 순: G(지난 입실, 입실 확인 대기) → B
  expect(container.querySelectorAll('.booking-item').length).toBe(2);
  expect(container.textContent).toContain('예약 확정됨');
});

test('기간을 "전체"로 넓히면 오래된 예약도 나오고, 숙소로 좁힐 수 있음', async () => {
  await act(async () => root.render(<HostBookings userProfile={{ id: 'h1' }} />));
  await flush();
  click(button('전체'));
  expect(tabCounts()).toEqual(['1', '2', '4']);

  const select = container.querySelector('#hb-accommodation');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(select, 'a1');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(tabCounts()).toEqual(['1', '0', '2']);

  click(button('조건 초기화'));
  expect(tabCounts()).toEqual(['1', '2', '3']);
});
