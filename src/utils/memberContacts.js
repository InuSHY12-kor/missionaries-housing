// 회원 연락처(이메일·전화) 조회 (2026-10-13 보안 점검 B6)
// users 표에서는 다른 회원의 이메일·전화를 직접 읽을 수 없으므로, 서버 함수 get_member_contacts로 받아옵니다.
// 서버는 본인, 관리자, 예약으로 연결된 상대(게스트↔숙소 제공자)의 연락처만 돌려줍니다.

export async function fetchMemberContacts(supabase, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.rpc('get_member_contacts', { p_user_ids: unique });
  if (error) {
    console.error('연락처 조회 오류:', error);
    return {};
  }
  return Object.fromEntries((data || []).map((c) => [c.id, c]));
}

// person(예: booking.users)에 email/phone을 덧붙인 새 객체. 연락처가 없으면 그대로 돌려줍니다.
export function withContact(person, contact) {
  if (!person || !contact) return person;
  return { ...person, email: contact.email, phone: contact.phone };
}
