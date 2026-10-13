import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { checkUploadFile, contentTypeFor } from './uploadRules';
import ForgotPassword from '../pages/ForgotPassword';

// 보안 점검 A (2026-10-13): 업로드 제한, 비밀번호 찾기에서 회원 대조 제거
const mockReset = jest.fn();
const mockRpc = jest.fn();
jest.mock('../App', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    auth: { resetPasswordForEmail: (...args) => mockReset(...args) },
  },
}));

const file = (name, type, size) => ({ name, type, size });

test('업로드 제한: 형식·용량, HEIC 형식 보완', () => {
  expect(checkUploadFile(file('a.svg', 'image/svg+xml', 1000), 'site-assets')).toContain('형식');
  expect(checkUploadFile(file('a.html', 'text/html', 1000), 'accommodation-images')).toContain('형식');
  expect(checkUploadFile(file('big.jpg', 'image/jpeg', 11 * 1024 * 1024), 'accommodation-images')).toContain('10MB');
  expect(checkUploadFile(file('ok.jpg', 'image/jpeg', 2 * 1024 * 1024), 'accommodation-images')).toBeNull();
  expect(checkUploadFile(file('doc.pdf', 'application/pdf', 3 * 1024 * 1024), 'verification-docs')).toBeNull();
  expect(checkUploadFile(file('photo.HEIC', '', 12 * 1024 * 1024), 'verification-docs')).toBeNull();
  expect(contentTypeFor(file('photo.HEIC', '', 1))).toBe('image/heic');
});

test('비밀번호 찾기: 이메일만 받고, 회원 대조 없이 재설정 메일 요청', async () => {
  mockReset.mockReset();
  mockRpc.mockReset();
  mockReset.mockImplementation(() => Promise.resolve({ error: null }));
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(<MemoryRouter><ForgotPassword /></MemoryRouter>));
  expect(container.querySelectorAll('input').length).toBe(1);
  const input = container.querySelector('input[type="email"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  act(() => { setter.call(input, 'someone@example.com'); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(mockRpc).not.toHaveBeenCalled();
  expect(mockReset).toHaveBeenCalledWith('someone@example.com', expect.objectContaining({ redirectTo: expect.stringContaining('/stay/reset-password') }));
  expect(container.textContent).toContain('가입된 이메일이라면');
  act(() => root.unmount());
  container.remove();
});
