// WEWE 하우스(관리자 전용 라이브 대시보드) 설정 (2026-10-20, 같은 날 아이소메트릭 사무실로 개편)
//
// 방의 켜짐/꺼짐은 ROOMS의 status로만 관리합니다('live' = 진행 중, 'planned' = 기획 예정).
// 사업이 시작되면 해당 방의 status를 'live'로 바꾸고, 필요하면 EVENT_TYPES에 이벤트·연출을 추가하세요.
// 데이터는 서버 함수 get_house_activity()가 돌려주는 익명 집계(카운터 + {type, occurred_at})만 씁니다.

export const ROOMS = {
  ceo: {
    id: 'ceo',
    name: '대표이사실',
    ministry: '대표 홍현지',
    status: 'live',
    description: 'WEWE 대표 홍현지가 일하는 방이에요. WEWE의 모든 사역이 이 방에서 시작됩니다.',
    counters: [],
  },
  web: {
    id: 'web',
    name: '웹 관리실',
    ministry: '김바름 · WEWE 홈페이지 관리',
    status: 'live',
    description: 'Claude와 함께 WEWE 홈페이지를 만들고 고치는 공간이에요. GitHub 저장소에 최근 20분 안에 작업(브랜치 푸시·PR)이 있으면 작업 중으로 바뀝니다.',
    counters: [],
  },
  guest: {
    id: 'guest',
    name: '게스트룸',
    ministry: 'WEWE 스테이',
    status: 'live',
    description: '선교사님이 머무를 숙소를 연결합니다. 숙소 승인과 예약이 생기면 이 방에서 손님을 맞이해요.',
    counters: ['approved_stays', 'bookings_this_month', 'confirmed_bookings'],
  },
  tailor: {
    id: 'tailor',
    name: '재단사 작업실',
    ministry: '전투복 프로젝트',
    status: 'live',
    description: '목회자에게 맞춤 양복을 지어 드립니다. 수치는 사업계획서 기준 수동 입력값이며, 연출은 미리보기 버튼으로만 재생돼요.',
    counters: [],
  },
  porch: {
    id: 'porch',
    name: '현관 · 우편함',
    ministry: '후원 · 사역 소식',
    status: 'live',
    description: '새로 함께하게 된 회원과 후원자를 맞이하고, 사역 소식이 발행되면 우편함에 편지가 도착해요.',
    counters: ['approved_missionaries', 'approved_hosts', 'supporters', 'published_posts'],
  },
  living: {
    id: 'living',
    name: '거실',
    ministry: 'WE+WE 커넥트 · Poiema 돌봄',
    status: 'planned',
    description: '선교사·목회자 공동체 연결과 돌봄 사역을 준비하고 있어요.',
    counters: [],
  },
  garage: {
    id: 'garage',
    name: '차고',
    ministry: '레위인의 모빌리티',
    status: 'planned',
    description: '사역자의 이동을 돕는 모빌리티 사역을 준비하고 있어요.',
    counters: [],
  },
};

export const ROOM_ORDER = ['ceo', 'web', 'guest', 'tailor', 'porch', 'living', 'garage'];

export const COUNTER_LABELS = {
  approved_stays: '승인된 숙소',
  bookings_this_month: '이번 달 예약',
  confirmed_bookings: '확정된 예약',
  approved_missionaries: '승인된 선교사',
  approved_hosts: '승인된 숙소 제공자',
  supporters: '후원자',
  published_posts: '발행된 사역 소식',
};

// 전투복 프로젝트는 DB 테이블이 없어 사업계획서(2026-09-30) 기준 수치를 직접 적어둡니다.
export const UNIFORM_STATS = {
  recommended: 17, // 지원·추천
  served: 1, // 수혜
  source: '사업계획서(2026-09-30) 기준 수동 입력값',
};

// 이벤트 type → 방, 피드 문구, 연출 종류, 캐릭터
//   anim: kit(웰컴 키트) · arrive(입실) · greet(현관 인사) · supporter(후원자 도착) · letter(우편) · tailor(전투복)
export const EVENT_TYPES = {
  stay_approved: { room: 'guest', label: '새 숙소가 승인되었어요', anim: 'kit' },
  booking_created: { room: 'guest', label: '새 예약 요청이 들어왔어요', anim: 'arrive', character: 'missionary' },
  booking_confirmed: { room: 'guest', label: '예약이 확정되었어요', anim: 'arrive', character: 'missionary' },
  member_approved_missionary: { room: 'porch', label: '선교사 회원이 승인되었어요', anim: 'greet', character: 'missionary' },
  member_approved_host: { room: 'porch', label: '숙소 제공자 회원이 승인되었어요', anim: 'greet', character: 'host' },
  supporter_joined: { room: 'porch', label: '새 후원자가 함께하게 되었어요', anim: 'supporter', character: 'supporter' },
  post_published: { room: 'porch', label: '사역 소식이 발행되었어요', anim: 'letter' },
  uniform_preview: { room: 'tailor', label: '전투복 연출 미리보기', anim: 'tailor', character: 'pastor' },
};

export const CHARACTER_LABELS = {
  missionary: '선교사',
  host: '숙소 제공자',
  pastor: '목회자',
  supporter: '후원자',
};

export const POLL_MS = 30000; // 30초마다 갱신
export const QUEUE_MAX = 5; // 연출 대기열 최대 길이(넘치면 앞쪽은 피드에만 기록)
export const ANIM_MS = 4600; // 연출 1회 길이(CSS 애니메이션 길이와 맞춤)
export const FEED_MAX = 10;
