import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { EditModeProvider, EditableText, HeroEditButton, useHero, renderRich } from './EditMode';

// 관리자 편집 모드 테스트 (2026-10-09).
// 실제 Supabase·로그인 없이 동작을 확인하기 위해, 테스트 안에서만 관리자 확인 훅과 supabase 클라이언트를
// 가짜로 바꿉니다(실제 사이트의 권한 확인 코드는 그대로입니다).
const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));
let mockRows = [];
let mockIsAdmin = true;

jest.mock('../wewe/useWeweAdmin', () => ({
  useWeweAdmin: () => ({ isAdmin: mockIsAdmin, userId: 'admin-1', checked: true }),
}));

jest.mock('../App', () => ({
  supabase: {
    from: () => ({
      select: () => ({ like: () => Promise.resolve({ data: mockRows, error: null }) }),
      upsert: (...args) => mockUpsert(...args),
    }),
    storage: { from: () => ({ upload: jest.fn(), getPublicUrl: jest.fn() }) },
  },
}));

const HERO_DEFAULTS = {
  eyebrow: 'ABOUT',
  title: '기본 배너 제목',
  subtitle: '기본 설명',
  images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
};

function HeroProbe() {
  const hero = useHero(HERO_DEFAULTS);
  return (
    <div style={{ position: 'relative' }}>
      <h1 data-testid="hero-title">{hero.title}</h1>
      <span data-testid="hero-count">{hero.images.length}</span>
      <HeroEditButton defaults={HERO_DEFAULTS} />
    </div>
  );
}

function App() {
  return (
    <MemoryRouter initialEntries={['/about']}>
      <EditModeProvider site="wewe">
        <EditableText id="intro" as="h2" className="lead">기본 문구</EditableText>
        <HeroProbe />
      </EditModeProvider>
    </MemoryRouter>
  );
}

let container;
let root;

beforeEach(async () => {
  // CRA의 Jest 설정(resetMocks)이 테스트마다 가짜 함수 구현을 지우므로 여기서 다시 지정합니다.
  mockUpsert.mockReset();
  mockUpsert.mockImplementation(() => Promise.resolve({ error: null }));
  mockRows = [];
  mockIsAdmin = true;
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
const byText = (text) => [...document.querySelectorAll('button, label')].find((b) => b.textContent.includes(text));
const setValue = (el, value) => {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

test('관리자가 아니면 편집 버튼이 보이지 않고 기본 문구가 그대로 보인다', async () => {
  mockIsAdmin = false;
  await act(async () => root.render(<App />));
  await flush();
  expect(document.querySelector('.em-toggle')).toBeNull();
  expect(document.querySelector('.em-hero-btn')).toBeNull();
  expect(container.querySelector('h2').textContent).toBe('기본 문구');
});

test('저장된 내용이 있으면 기본값 대신 보여준다', async () => {
  mockRows = [{ key: 'page:wewe:/about', data: { text: { intro: '바뀐 **문구**' }, hero: { title: '바뀐 배너', images: ['https://example.com/c.jpg'] } } }];
  await act(async () => root.render(<App />));
  await flush();
  expect(container.querySelector('h2').textContent).toBe('바뀐 문구');
  expect(container.querySelector('h2 strong').textContent).toBe('문구');
  expect(container.querySelector('[data-testid="hero-title"]').textContent).toBe('바뀐 배너');
  expect(container.querySelector('[data-testid="hero-count"]').textContent).toBe('1');
});

test('편집 모드에서 문구를 눌러 수정·저장할 수 있다', async () => {
  await act(async () => root.render(<App />));
  await flush();
  act(() => document.querySelector('.em-toggle').click());
  const h2 = container.querySelector('h2');
  expect(h2.className).toContain('em-editable');
  act(() => h2.click());
  const textarea = document.querySelector('.em-textarea');
  expect(textarea.value).toBe('기본 문구');
  act(() => setValue(textarea, '새 문구'));
  await act(async () => byText('저장하기').click());
  await flush();
  expect(mockUpsert).toHaveBeenCalledTimes(1);
  const saved = mockUpsert.mock.calls[0][0];
  expect(saved.key).toBe('page:wewe:/about');
  expect(saved.data.text.intro).toBe('새 문구');
  expect(container.querySelector('h2').textContent).toContain('새 문구');
  expect(document.querySelector('.em-modal')).toBeNull();
});

test('배너 수정: 사진 삭제·제목 변경 후 저장, 잘못된 주소는 거부', async () => {
  await act(async () => root.render(<App />));
  await flush();
  act(() => document.querySelector('.em-toggle').click());
  act(() => document.querySelector('.em-hero-btn').click());
  expect(document.querySelectorAll('.em-images li').length).toBe(2);

  // 잘못된 주소 추가 시도 → 오류
  const addInput = document.querySelector('.em-add-row input[type="text"]');
  act(() => setValue(addInput, 'javascript:alert(1)'));
  act(() => byText('주소로 추가').click());
  expect(document.querySelector('.em-error').textContent).toContain('https://');
  expect(document.querySelectorAll('.em-images li').length).toBe(2);

  // 두 번째 사진 삭제, 제목 변경
  act(() => document.querySelectorAll('.em-images li')[1].querySelector('.em-danger').click());
  const titleInput = document.querySelectorAll('.em-field input')[1];
  act(() => setValue(titleInput, '새 배너 제목'));
  await act(async () => byText('저장하기').click());
  await flush();

  const saved = mockUpsert.mock.calls[0][0];
  expect(saved.data.hero.title).toBe('새 배너 제목');
  expect(saved.data.hero.images).toEqual(['https://example.com/a.jpg']);
  expect(container.querySelector('[data-testid="hero-title"]').textContent).toBe('새 배너 제목');
});

test('renderRich는 HTML을 해석하지 않는다', () => {
  const div = document.createElement('div');
  const r = createRoot(div);
  act(() => r.render(<p>{renderRich('<img src=x onerror=alert(1)> **굵게**\n둘째 줄')}</p>));
  expect(div.querySelector('img')).toBeNull();
  expect(div.querySelector('strong').textContent).toBe('굵게');
  expect(div.querySelectorAll('br').length).toBe(1);
  act(() => r.unmount());
});
