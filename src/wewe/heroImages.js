// 위위 전체 홈페이지의 페이지별 상단 배너(슬라이드쇼) 사진 묶음.
// (2026-09-09) 이전에는 모든 하위 페이지가 WevePageHero.jsx의 기본 4장을 그대로
// 재사용해 페이지마다 사진이 다 똑같았습니다. 여기서 페이지별로 서로 다른 사진
// 조합을 만들어 각 페이지 컴포넌트에서 <WevePageHero images={...} />로 넘겨줍니다.
// 전부 Unsplash 무료 사진이며, 이미 이 저장소(위위 스테이 랜딩 히어로 등)에서
// 실제 프로덕션에 라이브로 걸려 정상 로드가 확인된 사진들을 우선 재사용하고,
// 이번에 새로 3장을 추가했습니다(기도, 회의/이사회, 환대의 손길).
const u = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=80`;

const A = u('1604881991575-dfb1003d8811'); // Priscilla Du Preez - 맞잡은 손
const B = u('1763616828336-e7fcd02086f5'); // Rochelle Lee
const C = u('1749703810919-1f979a9a3982'); // Kailun Zhang
const D = u('1769366316790-dfcb6a546f05'); // Oriol Pascual
const E = u('1726090401458-7abb00f7450c'); // Clay Banks
const F = u('1662514121891-8f3a97e5a2ea'); // Photos of Korea - 한옥
const G = u('1632518741173-9c2d8e962704'); // Tom Jur - 창밖 산 풍경
const H = u('1782952438288-7528ca318935'); // Rebecca Winter - 여행자
const I = u('1618237600880-fb9d72e98393');
const J = u('1781781490292-b3897966361c');
const K = u('1786255454548-b0b71597f9c0');
const L = u('1771970574223-24e53a0c5a24');
const M = u('1650476524542-c5cc53306700');
const N = u('1543525238-54e3d131f7ca'); // 기도하는 손 (신규)
const O = u('1517048676732-d65bc937f952'); // 회의/이사회 테이블 (신규)
const P = u('1578357078586-491adf1aa5ba'); // 맞잡은 두 손, 환대 (신규)
// (2026-09-10 추가) 랜딩 페이지 상단 히어로/중간 갤러리가 위위 스테이(숙소) 느낌이 아니라
// "위로자의 위로자"다운 사진으로 보이도록 새로 고른 사진들. 위위 스테이 랜딩(LandingPage.jsx)이나
// 기존 A~D와 겹치지 않는, 위로·기도·동행을 담은 사진입니다.
const S = u('1437603568260-1950d3ca6eab'); // 펼친 책(말씀) 위에 올린 손
// (2026-09-13 교체) 기존 T(둘러앉은 사람들 속에서 위로받는 한 사람)는 위로자보다는
// 그룹 사진에 가까워 V(공동체 사진)와 느낌이 겹쳤습니다 — 한 사람이 다른 한 사람의
// 어깨에 손을 얹어 위로하는, "위로자"의 의미에 더 맞는 사진으로 교체했습니다.
const T = u('1650826699533-8932a1a0b9d7'); // 어깨에 손을 얹어 위로하는 모습
const U = u('1520187044487-b2efb58f0cba'); // 흑백, 기도하는 손
const V = u('1520857014576-2c4f4c972b57'); // 함께 고개 숙인 여성들 — 공동체

export const HERO_IMAGE_SETS = {
  home: [S, T, U, V],
  about: [E, F, G, H],
  ministries: [I, J, K, L],
  leadership: [M, N, O],
  donate: [P, A, B],
  login: [C, D, E],
  signup: [F, G, H],
  supporterSignup: [I, J, K],
  news: [G, K, N, D],
  // (2026-10-03 추가) 사업계획서(PPT) 기반 신규 하위 페이지 3곳 — 전부 이미 검증되어
  // 쓰이고 있는 사진 조합을 테마에 맞게 재조합한 것으로, 새로 검증이 필요한 사진은
  // 추가하지 않았습니다.
  sustainability: [O, M, N], // 회의 테이블, 협업, 기도하는 손 — 운영/구조 테마
  combatUniform: [E, H, D], // 존중·응원·동행 테마
  weweStayIntro: [P, A, F], // 환대의 손길, 맞잡은 손, 한옥(주거) 테마
};

export default HERO_IMAGE_SETS;
