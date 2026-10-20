// WEWE 하우스(관리자 전용 라이브 대시보드) 설정 (2026-10-20)
//
// 룸 구성은 claude/wewe-projects-and-roles-2026-10-20.md(사역 프로젝트 구분·룸별 담당 업무)와 1:1입니다.
// 한 룸 = 한 사역(또는 운영 파트) = 담당자 1명. 대표 홍현지·김바름은 실명, 나머지는 "○○ 담당".
// 룸의 켜짐/꺼짐은 status로만 관리합니다('live' = 진행 중·조명 켜짐, 'planned' = 준비 중·조명 꺼짐).
// 사업이 시작되면 해당 룸의 status를 'live'로 바꾸세요(담당자 캐릭터·조명이 함께 켜집니다).
// 데이터는 서버 함수 get_house_activity()가 돌려주는 익명 집계(카운터 + {type, occurred_at})만 씁니다.

export const ROOMS = {
  ceo: {
    id: 'ceo', name: '대표이사실', ministry: '대표 · 총괄', owner: '대표 홍현지', status: 'live', group: '운영',
    description: 'WEWE의 비전과 모든 사역을 총괄하는 방이에요.',
    duties: ['연간 사업계획·각 룸 진행 점검', '법인화(사단법인 전환) 추진', '이사회·전문가 자문단 운영', '엘모즈·동역 교회·파송단체 협력', '예산 승인·재정 보고 확인'],
    counters: [],
  },
  web: {
    id: 'web', name: '웹 관리실', ministry: '홈페이지 · 플랫폼', owner: '김바름', status: 'live', group: '운영',
    description: 'Claude와 함께 WEWE 홈페이지와 WEWE 스테이 플랫폼을 만들고 고치는 공간이에요. GitHub 저장소에 최근 20분 안에 작업(브랜치 푸시·PR)이 있으면 작업 중으로 바뀝니다.',
    duties: ['홈페이지·스테이 플랫폼 개발·배포', '회원·숙소·예약·알림 기능 운영', '보안·개인정보 보호', '관리자 도구·통계·공지 메일'],
    counters: [],
  },
  donation: {
    id: 'donation', name: '후원 관리실', ministry: '후원 관리', owner: '후원 관리 담당', status: 'live', group: '운영',
    description: '정기후원·교회·기업 후원과 목적형 캠페인을 관리하고, 감사와 소식을 전하는 방이에요.',
    duties: ['정기후원(WE 멤버십) 관리', "목적형 캠페인('전투복 1벌'·'스테이 1박')", '입금 확인·기부금 영수증', '감사 인사·정기 소식·회복 스토리', '사업·재정 정기 보고'],
    counters: ['supporters'],
  },
  tailor: {
    id: 'tailor', name: '재단사 작업실', ministry: '전투복 프로젝트', owner: '전투복 담당', status: 'live', group: 'Project 1 · 목회자',
    description: '엘모즈와 함께 목회자에게 맞춤 정장(전투복)을 지어 드립니다. 수치는 사업계획서 기준 수동 입력값이며, 연출은 미리보기 버튼으로만 재생돼요.',
    duties: ['기수 모집·사연 심사·선정', '엘모즈 채촌·가봉·제작 일정 조율', "전달식('축복과 파송' 예배) 기획", '동의 범위 내 스토리 기록·후속 연계', 'KPI·운영 매뉴얼 관리'],
    counters: [],
  },
  academy: {
    id: 'academy', name: '아카데미 강의실', ministry: 'Refresh Pastor Academy · 심포지엄·세미나', owner: '아카데미 담당', status: 'planned', group: 'Project 1 · 목회자',
    description: '목회자 아카데미 심포지엄(연 1회)과 목회자 세미나(반기 1회)를 준비하고 있어요.',
    duties: ['심포지엄 주제·연사·장소·홍보', '세미나 커리큘럼·대상자 선정', '동료 그룹·멘토링 매칭', '지역별 자조모임'],
    counters: [],
  },
  pastorcare: {
    id: 'pastorcare', name: '목회자 케어룸', ministry: '소진관리 · 개별 지원', owner: '목회자 케어 담당', status: 'planned', group: 'Project 1 · 목회자',
    description: '목회자 소진관리와 심리상담·재정·장학 개별 지원을 준비하고 있어요.',
    duties: ['소진 진단·회복 프로그램', '심리상담 연계', '재정 지원·장학사업 심사', '상담·지원 기록 비밀 보장'],
    counters: [],
  },
  guest: {
    id: 'guest', name: '게스트룸', ministry: 'WEWE 스테이', owner: '스테이 담당', status: 'live', group: 'Project 2 · 선교사',
    description: '교회와 성도의 유휴 숙소를 쉼이 필요한 선교사님과 연결합니다. 숙소 승인과 예약이 생기면 이 방에서 손님을 맞이해요.',
    duties: ['숙소 등록 검토·현장 확인', '선교사 자격 확인·매칭', '예약·입금·체크인 운영', '웰컴(환대) 키트·체류 중 돌봄', '후기·호스트 감사 리포트'],
    counters: ['approved_stays', 'bookings_this_month', 'confirmed_bookings', 'approved_hosts'],
  },
  poiema: {
    id: 'poiema', name: '힐링룸', ministry: 'Poiema 돌봄', owner: 'Poiema 담당', status: 'planned', group: 'Project 2 · 선교사',
    description: '선교사 정체성 회복을 위한 힐링캠프·검진 연계를 준비하고 있어요.',
    duties: ['리트릿·힐링캠프 기획', '귀국 검진 의료기관 연계', '심리·정서·영성 회복 프로그램'],
    counters: [],
  },
  porch: {
    id: 'porch', name: '로비 · 우편함', ministry: '회원 맞이 · 사역 소식', owner: '공용', status: 'live', group: '공용',
    description: '새로 승인된 회원을 맞이하고, 사역 소식이 발행되면 우편함에 편지가 도착해요.',
    duties: ['새 회원 맞이', '사역 소식 발행(웹·후원 담당 협업)'],
    counters: ['approved_missionaries', 'published_posts'],
  },
  connect: {
    id: 'connect', name: '커넥트 라운지', ministry: 'WE+WE 커넥트', owner: '커넥트 담당', status: 'planned', group: 'Project 2 · 선교사',
    description: '후원자–선교사, 선교사–선교사를 잇는 멤버십을 준비하고 있어요.',
    duties: ['멤버십 설계', '후원자–선교사·선교사–교회 연결', '정기 모임·커뮤니티 운영'],
    counters: [],
  },
  garage: {
    id: 'garage', name: '차고', ministry: '레위인의 모빌리티', owner: '모빌리티 담당', status: 'planned', group: 'Project 2 · 선교사',
    description: '단기 귀국 선교사를 위한 차량 쉐어링을 준비하고 있어요.',
    duties: ['차량 쉐어링 모델·차량 확보', '보험·운행 규정·배차', '스테이 연계 이동 지원'],
    counters: [],
  },
};

export const ROOM_ORDER = ['ceo', 'web', 'donation', 'tailor', 'academy', 'pastorcare', 'guest', 'poiema', 'porch', 'connect', 'garage'];

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

// 이벤트 type → 룸, 피드 문구, 연출 종류, 캐릭터
//   anim: kit(웰컴 키트) · arrive(입실) · greet(로비 인사) · supporter(후원자 도착) · letter(우편) · tailor(전투복)
export const EVENT_TYPES = {
  stay_approved: { room: 'guest', label: '새 숙소가 승인되었어요', anim: 'kit' },
  booking_created: { room: 'guest', label: '새 예약 요청이 들어왔어요', anim: 'arrive', character: 'missionary' },
  booking_confirmed: { room: 'guest', label: '예약이 확정되었어요', anim: 'arrive', character: 'missionary' },
  member_approved_missionary: { room: 'porch', label: '선교사 회원이 승인되었어요', anim: 'greet', character: 'missionary' },
  member_approved_host: { room: 'porch', label: '숙소 제공자 회원이 승인되었어요', anim: 'greet', character: 'host' },
  supporter_joined: { room: 'donation', label: '새 후원자가 함께하게 되었어요', anim: 'supporter', character: 'supporter' },
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
