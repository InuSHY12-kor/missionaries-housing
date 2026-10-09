import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrayerLettersListPage, PrayerLetterDetailPage, PrayerLetterEditorPage } from './PrayerLetters';

// 기도 편지 게시판 테스트 (2026-10-09) — 테스트 안에서만 Supabase와 관리자 확인을 가짜로 바꿉니다.
const LETTERS = [
  { id: '11111111-1111-4111-8111-111111111111', title: '10월 기도 편지', author_name: '홍현지', status: 'published', published_at: '2026-10-01T03:00:00Z', images: ['https://example.com/a4-1.jpg', 'https://example.com/a4-2.jpg'], content: '첫째 줄\n둘째 줄' },
  { id: '22222222-2222-4222-8222-222222222222', title: '9월 기도 편지', author_name: 'WEWE', status: 'published', published_at: '2026-09-01T03:00:00Z', images: [], content: '본문' },
];

let mockIsAdmin = false;
let mockInserted = null;

jest.mock('./useWeweAdmin', () => ({
  useWeweAdmin: () => ({ isAdmin: mockIsAdmin, userId: 'admin-1', checked: true }),
}));

// 헤더·푸터·배너는 이 테스트와 무관하므로 단순화합니다.
jest.mock('./WeweHeader', () => () => null);
jest.mock('./WeweFooter', () => () => null);
jest.mock('./WevePageHero', () => ({ title, children }) => <div data-testid="hero">{title}{children}</div>);

jest.mock('../App', () => {
  const chain = (rows) => {
    const q = {
      _rows: rows,
      select: () => q,
      order: () => q,
      eq: (col, val) => { q._rows = q._rows.filter((r) => r[col] === val); return q; },
      maybeSingle: () => Promise.resolve({ data: q._rows[0] || null, error: null }),
      then: (resolve) => resolve({ data: q._rows, error: null }),
      insert: (row) => { mockInserted = row; return Promise.resolve({ error: null }); },
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    };
    return q;
  };
  return {
    supabase: {
      from: () => chain([...require('./PrayerLetters.test.data').LETTERS]),
      storage: { from: () => ({ upload: () => Promise.resolve({ error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://x/y.jpg' } }), remove: () => Promise.resolve({}) }) },
    },
  };
});

jest.mock('./PrayerLetters.test.data', () => ({}), { virtual: true });

let container;
let root;

beforeEach(() => {
  // jsdom에는 crypto.randomUUID가 없어 테스트에서만 채워 넣습니다(실제 브라우저에는 있음).
  if (!window.crypto) window.crypto = {};
  if (!window.crypto.randomUUID) window.crypto.randomUUID = () => '33333333-3333-4333-8333-333333333333';
  mockIsAdmin = false;
  mockInserted = null;
  // eslint-disable-next-line global-require
  require('./PrayerLetters.test.data').LETTERS = LETTERS;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

function renderAt(path) {
  return act(async () => root.render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/news/prayer-letters" element={<PrayerLettersListPage />} />
        <Route path="/news/prayer-letters/new" element={<PrayerLetterEditorPage />} />
        <Route path="/news/prayer-letters/:id" element={<PrayerLetterDetailPage />} />
      </Routes>
    </MemoryRouter>
  ));
}

test('목록은 번호·제목·작성자·작성일만 보이는 게시판이고, 탭이 있다', async () => {
  await renderAt('/news/prayer-letters');
  await flush();
  const rows = container.querySelectorAll('a.pl-row');
  expect(rows.length).toBe(2);
  expect(rows[0].querySelector('.pl-col-no').textContent).toBe('2');
  expect(rows[0].querySelector('.pl-col-title').textContent).toContain('10월 기도 편지');
  expect(rows[0].querySelector('.pl-col-author').textContent).toBe('홍현지');
  expect(rows[0].querySelector('.pl-col-date').textContent).toContain('2026');
  expect(container.querySelector('.pl-content')).toBeNull(); // 미리보기(본문) 없음
  expect([...container.querySelectorAll('.wp-subnav a')].map((a) => a.textContent)).toEqual(['사역 소식', '기도 편지']);
  expect(container.querySelector('.pl-admin-bar')).toBeNull();
});

test('본문: 줄글과 A4 이미지, 누르면 확대·원본 크기 보기', async () => {
  await renderAt('/news/prayer-letters/11111111-1111-4111-8111-111111111111');
  await flush();
  expect(container.querySelector('.pl-content').textContent).toBe('첫째 줄\n둘째 줄');
  const thumbs = container.querySelectorAll('.pl-image');
  expect(thumbs.length).toBe(2);
  act(() => thumbs[1].click());
  const box = document.querySelector('.pl-lightbox');
  expect(box).not.toBeNull();
  expect(box.querySelector('img').getAttribute('src')).toBe('https://example.com/a4-2.jpg');
  expect(box.querySelector('a').getAttribute('href')).toBe('https://example.com/a4-2.jpg');
  const toggle = [...box.querySelectorAll('button')].find((b) => b.textContent.includes('원본 크기로 보기'));
  act(() => toggle.click());
  expect(document.querySelector('.pl-lightbox-original')).not.toBeNull();
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(document.querySelector('.pl-lightbox')).toBeNull();
  expect(container.querySelector('.pl-article-admin')).toBeNull(); // 비관리자에게 수정·삭제 없음
});

test('관리자: 글쓰기에서 작성자 선택·날짜를 정해 저장', async () => {
  mockIsAdmin = true;
  await renderAt('/news/prayer-letters/new');
  await flush();
  const setValue = (el, value) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
  const inputs = container.querySelectorAll('.pl-editor input');
  const options = [...container.querySelectorAll('#pl-author-options option')].map((o) => o.value);
  expect(options).toEqual(expect.arrayContaining(['WEWE', '홍현지']));
  act(() => setValue(inputs[0], '11월 기도 편지'));
  act(() => setValue(inputs[1], '홍현지'));
  act(() => setValue(inputs[2], '2026-11-02'));
  act(() => setValue(container.querySelector('.pl-editor textarea'), '기도 제목입니다.'));
  const save = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('저장하기'));
  await act(async () => save.click());
  await flush();
  expect(mockInserted).not.toBeNull();
  expect(mockInserted.title).toBe('11월 기도 편지');
  expect(mockInserted.author_name).toBe('홍현지');
  expect(mockInserted.published_at).toBe('2026-11-02T12:00:00+09:00');
  expect(mockInserted.status).toBe('published');
});
