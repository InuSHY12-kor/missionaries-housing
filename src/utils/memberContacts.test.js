import { fetchMemberContacts, withContact } from './memberContacts';

// 보안 점검 B6 (2026-10-13): 연락처는 서버 함수로만 받아 붙입니다.
test('연락처: 중복·빈 ID 정리 후 한 번만 조회하고 객체에 붙임', async () => {
  const rpc = jest.fn(() => Promise.resolve({ data: [{ id: 'h1', email: 'h@x.kr', phone: '010' }], error: null }));
  const contacts = await fetchMemberContacts({ rpc }, ['h1', null, 'h1', 'g1']);
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith('get_member_contacts', { p_user_ids: ['h1', 'g1'] });
  expect(withContact({ full_name: '호스트' }, contacts.h1)).toEqual({ full_name: '호스트', email: 'h@x.kr', phone: '010' });
  expect(withContact({ full_name: '게스트' }, contacts.g1)).toEqual({ full_name: '게스트' });
});

test('연락처: ID가 없으면 조회하지 않고, 오류면 빈 결과', async () => {
  const rpc = jest.fn(() => Promise.resolve({ data: null, error: { message: 'x' } }));
  expect(await fetchMemberContacts({ rpc }, [])).toEqual({});
  expect(rpc).not.toHaveBeenCalled();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(await fetchMemberContacts({ rpc }, ['a'])).toEqual({});
  console.error.mockRestore();
});
