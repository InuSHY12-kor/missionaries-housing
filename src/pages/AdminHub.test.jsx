import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import AdminOverview from './AdminOverview';
import AnnouncementMail from './AnnouncementMail';
import MemberContactModal from '../components/MemberContactModal';

// 관리자 "한눈에 보기"와 "공지 메일 보내기" 테스트 (2026-10-10) — Supabase는 가짜로 바꿉니다.
const mockRpc = jest.fn();
const mockInvoke = jest.fn();
const mockInsert = jest.fn();
jest.mock('../App', () => ({
  supabase: {
    from: () => ({ insert: (...args) => mockInsert(...args) }),
    rpc: (...args) => mockRpc(...args),
    functions: { invoke: (...args) => mockInvoke(...args) },
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://x/y.png' } }) }) },
  },
}));

let container;
let root;

beforeEach(() => {
  mockRpc.mockReset();
  mockInvoke.mockReset();
  mockInsert.mockReset();
  mockInsert.mockImplementation(() => Promise.resolve({ error: null }));
  mockRpc.mockImplementation(() => Promise.resolve({
    data: { today: { visitors: 7 }, range: { visitors: 30 }, total: { visitors: 120 }, daily: [{ day: '2026-10-10', visitors: 7 }] },
    error: null,
  }));
  document.execCommand = jest.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

test('한눈에 보기: 처리할 일 숫자, 방문 통계 요약, 자세히 보기·공지 메일 이동', async () => {
  const onOpen = jest.fn();
  await act(async () => root.render(<AdminOverview counts={{ users: 2, accommodations: 0, deletions: 1, inquiries: 5 }} onOpen={onOpen} />));
  await flush();
  const todoCounts = [...container.querySelectorAll('.ao-todo-count')].map((e) => e.textContent);
  expect(todoCounts).toEqual(['2', '0', '1', '5']);
  expect(container.querySelector('.ao-stat-nums').textContent).toContain('120');
  act(() => container.querySelector('.ao-more').click());
  expect(onOpen).toHaveBeenCalledWith('stats');
  act(() => container.querySelector('.ao-mail-btn').click());
  expect(onOpen).toHaveBeenCalledWith('mail');
});

test('공지 메일: 대상 복수 선택 → 받는 사람 수 확인 후 발송', async () => {
  mockInvoke.mockImplementation((name, { body }) => Promise.resolve({
    data: body.previewOnly ? { success: true, html: '<p>x</p>', recipientCount: 12 } : { success: true, sent: 12, failed: 0, failedRecipients: [] },
    error: null,
  }));
  window.confirm = jest.fn(() => true);
  await act(async () => root.render(<AnnouncementMail onBack={() => {}} />));

  const boxes = container.querySelectorAll('.am-audience input');
  act(() => boxes[0].click()); // 선교사
  act(() => boxes[2].click()); // 후원자
  const subject = container.querySelector('.am-subject');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  act(() => { setter.call(subject, '10월 소식'); subject.dispatchEvent(new Event('input', { bubbles: true })); });
  container.querySelector('.am-editor').innerHTML = '<p>안녕하세요</p>';

  const sendBtn = [...container.querySelectorAll('.am-actions button')].find((b) => b.textContent.includes('보내기'));
  await act(async () => sendBtn.click());
  await flush();

  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('12명'));
  const sendCall = mockInvoke.mock.calls.find(([, { body }]) => !body.previewOnly);
  expect(sendCall[0]).toBe('send-announcement');
  expect(sendCall[1].body).toMatchObject({ subject: '10월 소식', roles: ['missionary', 'supporter'], html: '<p>안녕하세요</p>' });
  expect(container.querySelector('.am-message').textContent).toContain('12명에게 보냈습니다');
});

test('회원 개별 쪽지: 쪽지를 저장하고 메일로도 알림', async () => {
  mockInvoke.mockImplementation(() => Promise.resolve({ data: { success: true, sent: 1, failed: 0 }, error: null }));
  const member = { id: 'm1', full_name: '홍길동', email: 'hong@example.com', role: 'missionary', status: 'approved' };
  await act(async () => root.render(<MemberContactModal member={member} mode="message" adminProfile={{ id: 'a1' }} onClose={() => {}} />));
  const ta = container.querySelector('textarea');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  act(() => { setter.call(ta, '서류를 다시 올려주세요'); ta.dispatchEvent(new Event('input', { bubbles: true })); });
  const btn = [...container.querySelectorAll('.mcm-actions button')].find((b) => b.textContent.includes('쪽지 보내기'));
  await act(async () => btn.click());
  await flush();
  expect(mockInsert).toHaveBeenCalledWith({ sender_id: 'a1', recipient_id: 'm1', message: '서류를 다시 올려주세요' });
  expect(mockInvoke).toHaveBeenCalledWith('send-announcement', expect.objectContaining({ body: expect.objectContaining({ userIds: ['m1'] }) }));
  expect(container.querySelector('.mcm-result').textContent).toContain('쪽지를 보냈습니다');
});
