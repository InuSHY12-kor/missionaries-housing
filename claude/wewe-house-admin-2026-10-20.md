# WEWE 하우스(관리자 전용 라이브 대시보드) — 작업 기록 (2026-10-20)

기획: B안(SVG/CSS 단면도 + 실제 이벤트 반응). 관리자만 볼 수 있는 페이지이며 공개 사이트에는 연결하지 않았습니다.
브랜치 `feature/wewe-house-admin`.

## 1. 위치와 접근 제어

- URL: `/stay/admin/house` — `App.jsx`의 **관리자 전용 라우트 블록** 안에 추가(비관리자는 `/dashboard`, 비로그인은 `/stay`로 이동).
- `src/index.js`의 `isWeweSitePath`는 수정하지 않았습니다.
- 진입점: 관리자 대시보드 "한눈에 보기"(`AdminOverview.jsx`)의 **WEWE 하우스** 카드. `/admin`(WEWE)과 `/stay/admin` 양쪽에서 `<a href="/stay/admin/house">`(전체 페이지 이동)로 엽니다.
- 검색엔진 차단: 페이지에서 `<meta name="robots" content="noindex, nofollow">`를 추가하고, `public/_headers`에 `/stay/admin/*`, `/admin`, `/admin/*` → `X-Robots-Tag: noindex, nofollow`.
- 서버: `get_house_activity()`가 `is_admin()`이 아니면 `42501 forbidden`. 실행 권한은 `authenticated`만(`anon`·`public` 회수).

## 2. 방과 이벤트

| 방 | 사역 | status | 평상시 움직임 | 이벤트 연출 |
|---|---|---|---|---|
| 게스트룸 | WEWE 스테이 | live | 커튼 흔들림, 램프 깜빡임 | `stay_approved`: 방이 밝아지고 웰컴 키트가 침대에 놓임 / `booking_created`·`booking_confirmed`: 선교사가 문으로 들어와 짐을 내려놓고 두 손을 듦 |
| 재단사 작업실 | 전투복 프로젝트 | live | 재봉틀 바늘·바퀴, 줄자 흔들림 | `uniform_preview`(미리보기 버튼으로만): 목회자 입장 → 채촌 → 양복 → 두 손을 듦 |
| 현관·우편함 | 후원·사역 소식 | live | 우편함 깃발이 가끔 흔들림 | `member_approved_missionary`·`member_approved_host`: 캐릭터가 현관으로 들어와 두 손을 듦 / `supporter_joined`: 후원자 도착 + 현관 불 켜짐 / `post_published`: 편지가 우편함으로, 깃발이 올라감 |
| 거실 | WE+WE 커넥트 · Poiema 돌봄 | planned | 정지, "준비 중" | 없음 |
| 차고 | 레위인의 모빌리티 | planned | 정지, "준비 중" | 없음 |

- 방 켜짐/꺼짐은 `src/pages/admin/house/houseConfig.js`의 `ROOMS[*].status`로만 바꿉니다.
- 캐릭터 4종(선교사 teal, 숙소 제공자 orange, 목회자 ink+흰 칼라, 후원자 orange-deep+하트). "두 손을 받쳐 올리는" 동작(아론과 훌)은 입실·현관 인사·후원자·전투복 연출에 들어 있습니다.
- 대기열: 하나씩 순서대로 4.6초, 5개 초과 시 앞쪽은 건너뛰고 피드에만 남김. 첫 응답은 피드·카운터에만 반영.
- 가짜 활동은 만들지 않습니다. "연출 미리보기"는 관리자가 누를 때만 화면에서 재생되며 피드·카운터에 기록되지 않습니다.
- 전투복 수치: `UNIFORM_STATS`(지원·추천 17, 수혜 1) — 화면에 "사업계획서(2026-09-30) 기준 수동 입력값" 표시.

## 3. 데이터 (마이그레이션 `20261020134755_wewe_house_activity`)

- `accommodations.approved_at`, `users.approved_at` 추가. 트리거 `zz_stamp_approved_at`(기존 보호 트리거 다음에 실행)이 상태가 approved로 바뀌는 순간 기록, 후원자는 가입 즉시. 화면에서 보낸 값은 무시(회원이 위조 불가). 기존 승인 건은 `updated_at`으로 채움(근사값). 두 칸 모두 회원이 직접 읽을 수 없음(B6 칸 단위 권한).
- `get_house_activity(p_limit int default 20)` → JSON. 반환 필드 **전체 목록**:
  - `generated_at` (분 단위)
  - `counters.approved_stays`, `counters.bookings_this_month`(KST 기준 이번 달 생성·취소 제외), `counters.confirmed_bookings`, `counters.approved_missionaries`, `counters.approved_hosts`, `counters.supporters`, `counters.published_posts`
  - `events[]` = `{ type, occurred_at }` (최대 50, 분 단위로 내림, 미래 시각 제외). type: `stay_approved`, `booking_created`, `booking_confirmed`, `member_approved_missionary`, `member_approved_host`, `supporter_joined`, `post_published`
- 포함하지 않는 것: 이름·이메일·전화·교회명·숙소 주소/좌표/지역·예약 날짜/기간·파송지·사용자/숙소/예약 ID. 새 이벤트 판별도 ID 없이 `type|시각` 묶음의 개수 차이로 합니다.
- 갱신: 30초 폴링, 탭이 숨겨지면 중지·다시 보이면 즉시 갱신. Realtime 미사용.

## 4. 파일

```
src/pages/admin/WeweHouse.jsx               라우트 페이지(noindex, RPC 연결, 뒤로가기)
src/pages/admin/house/WeweHouseView.jsx     화면 본체(대기열, 방 상세, 현황, 피드, 미리보기)
src/pages/admin/house/HouseScene.jsx        단면도 SVG + 이벤트 연출
src/pages/admin/house/Characters.jsx        캐릭터 4종·소품
src/pages/admin/house/ActivityFeed.jsx      최근 활동(aria-live)
src/pages/admin/house/houseConfig.js        ROOMS, EVENT_TYPES, UNIFORM_STATS, 폴링·대기열 설정
src/pages/admin/house/useHouseActivity.js   폴링·새 이벤트 감지 훅
src/pages/admin/house/wewe-house.css        전용 스타일(WEWE 토큰 직접 정의)
src/pages/admin/house/WeweHouse.test.jsx    테스트
src/App.jsx, src/pages/AdminOverview.jsx(+AdminHub.test.jsx), public/_headers
supabase/migrations/20261020134755_wewe_house_activity.sql
```
새 의존성 없음(순수 SVG + CSS + React 상태). 외부 이미지·폰트·CDN 없음.

## 5. 검증 결과

- `CI=true npm run build` 통과, 테스트 38개 통과(새 이벤트 감지, "N분 전" 표기, 첫 응답은 연출 없음·새로고침 후 새 이벤트만 연출).
- 롤백 SQL 테스트: 비로그인·일반 회원 → 거부, 회원이 `approved_at` 위조 시 무시, 관리자 → `generated_at/counters/events`만 반환, 숙소 pending→approved 시 시각 기록.
- 적용 후 비로그인 키로 `/rest/v1/rpc/get_house_activity` 직접 호출 → `42501 permission denied`.
- 실제 응답 JSON 확인: 이벤트에는 `type`, `occurred_at`만 있음.
- 화면: 샘플 데이터를 넣은 임시 로컬 페이지(커밋하지 않음)로 데스크톱 1280·모바일 390(가로 스크롤 없음)·움직임 끔 상태 확인, 6가지 연출 모두 정지 화면으로 확인, 콘솔 오류 없음.
- Supabase Advisors: 새 경고는 `get_house_activity`(로그인 회원 실행 가능 — 내부에서 관리자 확인, 의도된 것) 1건.

## 6. 검증하지 못한 것 / 사용자 확인 필요

- 관리자 계정으로 로그인한 실제 화면(로그인 불가). 확인 체크리스트:
  1. 관리자 대시보드 → 한눈에 보기 → "WEWE 하우스 열기"로 들어가지는지
  2. 카운터 숫자가 실제와 맞는지(승인 숙소, 이번 달 예약 등)
  3. 최근 활동 목록이 보이는지, 관리자 탭을 열어둔 채 숙소 승인 등을 하면 30초 안에 해당 방 연출이 재생되는지
  4. "연출 미리보기"로 전투복 연출이 재생되는지
  5. 일반 회원 계정으로 `/stay/admin/house` 접근 시 대시보드로 돌아가는지
- 실제 기기의 "동작 줄이기" 설정: 브라우저 창에서 직접 바꿀 수 없어, 같은 CSS 규칙을 강제로 넣는 방식으로만 확인했습니다.
- 기존 승인 건의 승인 시각은 `updated_at` 근사값입니다(이후 승인부터 정확).

## 7. 이후 단계(이번 범위 아님)

- 공개 전환 시 같은 RPC 구조를 `anon`에 열지, 어떤 수치를 공개할지 결정.
- 모빌리티·Poiema·커넥트 시작 시 `ROOMS.status`를 `live`로 바꾸고 이벤트·연출 추가.
- 전투복 수치를 DB 테이블 기반으로 교체.
