import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

// 비밀번호 변경 시 현재 비밀번호 확인 (2026-10-14, Supabase Auth: Require current password)
const mockUpdateUser = jest.fn();
jest.mock('../App', () => {
  const q = new Proxy({ then: (resolve) => resolve({ data: [], error: null }) }, { get: (t, k) => (k in t ? t[k] : () => q) });
  return {
    supabase: {
      from: () => q,
      rpc: () => q,
      auth: { updateUser: (...args) => mockUpdateUser(...args) },
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
    },
  };
});
jest.mock('../components/PayoutAccountForm', () => ({ PayoutAccountSection: () => null }));
jest.mock('../components/TestEmailButton', () => () => null);

let container;
let root;
beforeEach(() => {
  mockUpdateUser.mockReset();
  window.alert = jest.fn();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const setValue = (name, value) => {
  const input = container.querySelector(`input[name="${name}"]`);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  act(() => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
};
const submitPasswordForm = () => act(async () => {
  container.querySelector('input[name="currentPassword"]').closest('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
});

test('현재 비밀번호 없이는 변경 요청을 보내지 않음', async () => {
  await act(async () => root.render(<MemoryRouter><Profile userProfile={{ id: 'u1', role: 'missionary', full_name: '테스트' }} /></MemoryRouter>));
  setValue('newPassword', 'newpass123');
  setValue('confirmPassword', 'newpass123');
  await submitPasswordForm();
  expect(mockUpdateUser).not.toHaveBeenCalled();
  expect(window.alert).toHaveBeenCalledWith('현재 비밀번호를 입력해주세요.');
});

test('현재 비밀번호를 함께 보내고, 틀리면 한국어로 안내', async () => {
  mockUpdateUser.mockImplementation(() => Promise.resolve({ error: { code: 'current_password_mismatch', message: 'Current password required when setting new password.' } }));
  await act(async () => root.render(<MemoryRouter><Profile userProfile={{ id: 'u1', role: 'missionary', full_name: '테스트' }} /></MemoryRouter>));
  setValue('currentPassword', 'oldpass123');
  setValue('newPassword', 'newpass123');
  setValue('confirmPassword', 'newpass123');
  await submitPasswordForm();
  expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass123', current_password: 'oldpass123' });
  expect(window.alert).toHaveBeenCalledWith('오류: 현재 비밀번호가 맞지 않습니다. 다시 확인해주세요.');
});
