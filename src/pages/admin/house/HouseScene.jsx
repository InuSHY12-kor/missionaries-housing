import React from 'react';
import { ROOMS } from './houseConfig';
import { Character, Suitcase, WelcomeKit, Letter } from './Characters';

// WEWE 하우스 단면도(SVG). 2층: 게스트룸(WEWE 스테이) · 재단사 작업실(전투복 프로젝트)
//                        1층: 현관·우편함(후원·사역 소식) · 거실(커넥트·Poiema) · 차고(모빌리티)
// 방 좌표는 ROOM_BOX에 모여 있고, 평상시 움직임(idle)과 이벤트 연출은 wewe-house.css의 keyframes로 그립니다.

export const ROOM_BOX = {
  guest: { x: 83, y: 199, w: 334, h: 157 },
  tailor: { x: 423, y: 199, w: 294, h: 157 },
  porch: { x: 83, y: 364, w: 134, h: 176 },
  living: { x: 223, y: 364, w: 254, h: 176 },
  garage: { x: 483, y: 364, w: 234, h: 176 },
};

function RoomLabel({ room, box }) {
  const live = room.status === 'live';
  const width = Math.max(room.name.length * 13, room.ministry.length * 10.5) + 30;
  return (
    <g className="hh-label" aria-hidden="true">
      <rect x={box.x + 8} y={box.y + 8} width={width} height={38} rx={8} fill="rgba(255,255,255,0.92)" />
      <circle cx={box.x + 19} cy={box.y + 21} r={4} fill={live ? 'var(--wh-teal)' : '#a9a49a'} />
      <text x={box.x + 28} y={box.y + 25} className="hh-label-name">{room.name}</text>
      <text x={box.x + 17} y={box.y + 40} className="hh-label-ministry">{room.ministry}</text>
    </g>
  );
}

function PlannedOverlay({ box }) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + 10;
  return (
    <g className="hh-planned" aria-hidden="true">
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="rgba(28,28,26,0.5)" />
      <rect x={cx - 44} y={cy - 14} width={88} height={28} rx={14} fill="#ffffff" />
      <text x={cx} y={cy + 5} textAnchor="middle" className="hh-planned-text">준비 중</text>
    </g>
  );
}

// ── 방 내부 그림 ─────────────────────────────────────────────
function GuestRoom() {
  return (
    <g>
      <rect x={83} y={199} width={334} height={157} fill="#fbf3e6" />
      <rect x={83} y={340} width={334} height={16} fill="#e9d8bf" />
      {/* 액자 */}
      <rect x={180} y={226} width={46} height={34} fill="#ffffff" stroke="#c89b6d" strokeWidth={3} />
      <path d="M203 252 C195 246 193 240 198 238 C200 237.5 202 239 203 240.5 C204 239 206 237.5 208 238 C213 240 211 246 203 252 Z" fill="var(--wh-orange)" />
      {/* 창문 + 커튼 */}
      <rect x={300} y={222} width={70} height={60} fill="#dcecee" stroke="#a87a4f" strokeWidth={4} />
      <path d="M335 222 L335 282 M300 252 L370 252" stroke="#a87a4f" strokeWidth={2} />
      <line x1={292} y1={216} x2={378} y2={216} stroke="#8a6a4a" strokeWidth={3} strokeLinecap="round" />
      <path className="hh-curtain hh-curtain-l" d="M296 216 L320 216 Q314 252 322 292 L296 292 Z" fill="var(--wh-orange)" opacity={0.85} />
      <path className="hh-curtain hh-curtain-r" d="M374 216 L350 216 Q356 252 348 292 L374 292 Z" fill="var(--wh-orange)" opacity={0.85} />
      {/* 침대 */}
      <rect x={98} y={262} width={10} height={78} rx={3} fill="#a87a4f" />
      <rect x={104} y={298} width={150} height={42} rx={4} fill="#c89b6d" />
      <rect x={104} y={288} width={150} height={18} rx={6} fill="#ffffff" />
      <rect x={150} y={290} width={104} height={28} rx={6} fill="var(--wh-teal)" opacity={0.85} />
      <rect x={112} y={280} width={34} height={14} rx={6} fill="#f4e9da" />
      {/* 협탁 + 램프 */}
      <circle className="hh-lamp-glow" cx={281} cy={296} r={52} fill="url(#hhLampGlow)" />
      <rect x={266} y={312} width={30} height={28} fill="#a87a4f" />
      <rect x={277} y={300} width={8} height={12} fill="#8a6a4a" />
      <path d="M268 301 L294 301 L288 283 L274 283 Z" fill="#f0c9a0" />
      {/* 문 */}
      <rect x={380} y={262} width={32} height={94} fill="#c89b6d" stroke="#a87a4f" strokeWidth={3} />
      <circle cx={387} cy={312} r={2.6} fill="#5a4636" />
    </g>
  );
}

function TailorRoom() {
  return (
    <g>
      <rect x={423} y={199} width={294} height={157} fill="#f6f1ea" />
      <rect x={423} y={340} width={294} height={16} fill="#e6dccd" />
      {/* 창문 */}
      <rect x={648} y={222} width={52} height={52} fill="#dcecee" stroke="#a87a4f" strokeWidth={4} />
      <path d="M674 222 L674 274 M648 248 L700 248" stroke="#a87a4f" strokeWidth={2} />
      {/* 원단 선반 */}
      <rect x={540} y={250} width={84} height={4} fill="#a87a4f" />
      <rect x={544} y={232} width={14} height={18} rx={3} fill="var(--wh-teal)" />
      <rect x={561} y={236} width={14} height={14} rx={3} fill="var(--wh-orange)" />
      <rect x={578} y={230} width={14} height={20} rx={3} fill="#1f2c4a" />
      <rect x={595} y={234} width={14} height={16} rx={3} fill="#c9b79c" />
      {/* 마네킹(지어지는 중인 재킷) */}
      <line x1={470} y1={300} x2={470} y2={350} stroke="#8a6a4a" strokeWidth={3} />
      <ellipse cx={470} cy={352} rx={14} ry={3} fill="#8a6a4a" />
      <path d="M454 262 Q470 250 486 262 L483 302 L457 302 Z" fill="#1f2c4a" />
      <path d="M466 254 L470 270 L474 254" fill="#ffffff" />
      <circle cx={470} cy={250} r={4} fill="#8a6a4a" />
      {/* 줄자 */}
      <circle cx={520} cy={226} r={3} fill="#8a6a4a" />
      <path className="hh-tape" d="M520 226 Q510 258 518 296" fill="none" stroke="#f0c9a0" strokeWidth={5} strokeLinecap="round" strokeDasharray="2 4" />
      {/* 작업대 + 재봉틀 */}
      <rect x={560} y={312} width={140} height={10} fill="#a87a4f" />
      <rect x={566} y={322} width={6} height={34} fill="#8a6a4a" />
      <rect x={688} y={322} width={6} height={34} fill="#8a6a4a" />
      <rect x={590} y={300} width={70} height={12} rx={3} fill="#2b2f3a" />
      <path d="M598 300 L598 276 Q598 270 604 270 L652 270 Q658 270 658 276 L658 288 L646 288 L646 300 Z" fill="#2b2f3a" />
      <rect x={612} y={262} width={8} height={8} rx={1} fill="var(--wh-orange)" />
      <rect className="hh-needle" x={649} y={288} width={3} height={10} fill="#c9c3b8" />
      <circle className="hh-wheel" cx={606} cy={284} r={6} fill="none" stroke="#c9c3b8" strokeWidth={2} strokeDasharray="4 3" />
    </g>
  );
}

function Porch({ lit }) {
  return (
    <g>
      <rect x={83} y={364} width={134} height={176} fill="#f3ede4" />
      <circle className={`hh-porch-glow${lit ? ' is-lit' : ''}`} cx={191} cy={440} r={44} fill="url(#hhPorchGlow)" />
      <rect x={120} y={430} width={52} height={110} rx={3} fill="var(--wh-teal)" />
      <rect x={130} y={442} width={32} height={24} rx={2} fill="#dcecee" opacity={0.85} />
      <circle cx={162} cy={492} r={3} fill="#f0c9a0" />
      <rect x={186} y={420} width={10} height={14} rx={2} fill="#2b2f3a" />
      <circle className={`hh-porch-bulb${lit ? ' is-lit' : ''}`} cx={191} cy={438} r={5} />
      <rect x={112} y={536} width={68} height={4} fill="var(--wh-orange)" />
      <rect x={120} y={404} width={52} height={16} rx={3} fill="#ffffff" stroke="#e5e2da" />
      <text x={146} y={416} textAnchor="middle" className="hh-plaque">WEWE</text>
    </g>
  );
}

function Mailbox({ raised }) {
  return (
    <g>
      <rect x={36} y={470} width={6} height={70} fill="#8a6a4a" />
      <rect x={16} y={446} width={46} height={28} rx={10} fill="var(--wh-orange)" />
      <line x1={24} y1={458} x2={46} y2={458} stroke="#8a4b25" strokeWidth={2.5} strokeLinecap="round" />
      <g className={`hh-flag${raised ? ' is-raised' : ''}`}>
        <rect x={62} y={450} width={3} height={20} fill="#6b5a48" />
        <rect x={65} y={450} width={12} height={8} fill="var(--wh-teal)" />
      </g>
    </g>
  );
}

function LivingRoom() {
  return (
    <g>
      <rect x={223} y={364} width={254} height={176} fill="#efe8dc" />
      <rect x={223} y={524} width={254} height={16} fill="#e2d6c3" />
      <rect x={300} y={398} width={70} height={46} fill="#ffffff" stroke="#c89b6d" strokeWidth={3} />
      <ellipse cx={345} cy={528} rx={96} ry={8} fill="#e9a06d" opacity={0.5} />
      <rect x={270} y={478} width={150} height={44} rx={12} fill="var(--wh-teal)" />
      <rect x={262} y={470} width={18} height={50} rx={8} fill="#0f5a5f" />
      <rect x={410} y={470} width={18} height={50} rx={8} fill="#0f5a5f" />
      <rect x={284} y={468} width={58} height={22} rx={8} fill="#1b8088" />
      <rect x={348} y={468} width={58} height={22} rx={8} fill="#1b8088" />
      <rect x={444} y={500} width={18} height={22} rx={3} fill="#c89b6d" />
      <path d="M453 500 C440 486 444 470 453 462 C462 470 466 486 453 500 Z" fill="#5f8f6a" />
    </g>
  );
}

function Garage() {
  return (
    <g>
      <rect x={483} y={364} width={234} height={176} fill="#e8e3da" />
      <rect x={510} y={420} width={182} height={120} fill="#cfc8bb" />
      <rect x={510} y={420} width={182} height={58} fill="#ddd6c9" />
      {[434, 448, 462].map((y) => (
        <line key={y} x1={510} y1={y} x2={692} y2={y} stroke="#c3bbad" strokeWidth={2} />
      ))}
      <rect x={540} y={486} width={130} height={44} rx={10} fill="var(--wh-teal)" />
      <rect x={552} y={492} width={34} height={16} rx={3} fill="#dcecee" />
      <rect x={592} y={492} width={34} height={16} rx={3} fill="#dcecee" />
      <circle cx={566} cy={532} r={9} fill="#2b2f3a" />
      <circle cx={646} cy={532} r={9} fill="#2b2f3a" />
    </g>
  );
}

// ── 이벤트 연출 ─────────────────────────────────────────────
function EventLayer({ event }) {
  if (!event) return null;
  const { anim, character } = event.config;
  switch (anim) {
    case 'kit':
      return (
        <g className="ev ev-kit">
          <rect className="ev-room-glow" x={83} y={199} width={334} height={157} fill="#ffe3b5" />
          <g transform="translate(200,292)">
            <WelcomeKit className="ev-drop" />
          </g>
        </g>
      );
    case 'arrive':
      return (
        <g className="ev ev-arrive">
          <g transform="translate(396,356)">
            <g className="ev-walk-left">
              <Character kind={character} className="is-walking ev-arms-up" />
              <g transform="translate(14,0)">
                <Suitcase className="ev-putdown" />
              </g>
            </g>
          </g>
        </g>
      );
    case 'greet':
    case 'supporter':
      return (
        <g className={`ev ev-${anim}`}>
          <g transform="translate(40,540)">
            <g className="ev-walk-right">
              <Character kind={character} className="is-walking ev-arms-up" />
            </g>
          </g>
        </g>
      );
    case 'letter':
      return (
        <g className="ev ev-letter">
          <g transform="translate(40,454)">
            <Letter className="ev-letter-fly" />
          </g>
        </g>
      );
    case 'tailor':
      return (
        <g className="ev ev-tailor">
          <g transform="translate(440,356)">
            <g className="ev-walk-tailor">
              <Character kind="pastor" suit className="is-walking ev-arms-up" />
              <ellipse className="ev-measure" cx={0} cy={-30} rx={15} ry={5} fill="none" stroke="#f0c9a0" strokeWidth={2.5} strokeDasharray="3 3" />
            </g>
          </g>
        </g>
      );
    default:
      return null;
  }
}

function HouseScene({ playing, selectedRoom, onSelectRoom, paused }) {
  const activeRoom = playing?.config.room;
  const porchLit = playing?.config.anim === 'supporter';
  const flagRaised = playing?.config.anim === 'letter';

  const roomHit = (id) => {
    const b = ROOM_BOX[id];
    const isActive = activeRoom === id;
    const isSelected = selectedRoom === id;
    return (
      <rect
        key={id}
        className={`hh-hit${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}`}
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        onClick={() => onSelectRoom(id)}
      />
    );
  };

  const summary = Object.values(ROOMS)
    .map((r) => `${r.name}(${r.ministry}) ${r.status === 'live' ? '진행 중' : '준비 중'}`)
    .join(', ');

  return (
    <svg
      className={`hh-scene${paused ? ' is-paused' : ''}`}
      viewBox="0 0 800 580"
      role="img"
      aria-label={`WEWE 하우스 단면도: ${summary}`}
    >
      <defs>
        <radialGradient id="hhLampGlow">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hhPorchGlow">
          <stop offset="0%" stopColor="#ffe08f" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffe08f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 하늘·땅 */}
      <rect x={0} y={0} width={800} height={580} fill="var(--wh-bg-soft)" />
      <rect x={0} y={540} width={800} height={40} fill="#e3ecdf" />

      {/* 지붕 + 다락 창(W) */}
      <rect x={560} y={96} width={30} height={64} fill="#9c5a33" />
      <polygon points="62,198 400,52 738,198" fill="var(--wh-orange-deep)" />
      <polygon points="96,190 400,64 704,190" fill="#c97445" />
      <circle cx={400} cy={140} r={24} fill="#fdf6ec" stroke="#8a4b25" strokeWidth={4} />
      <text x={400} y={150} textAnchor="middle" className="hh-attic-w">W</text>

      <GuestRoom />
      <TailorRoom />
      <Porch lit={porchLit} />
      <LivingRoom />
      <Garage />
      <Mailbox raised={flagRaised} />

      {/* 구조(벽·바닥) */}
      <rect x={80} y={196} width={640} height={347} fill="none" stroke="#6b5a48" strokeWidth={6} />
      <rect x={80} y={356} width={640} height={8} fill="#6b5a48" />
      <rect x={417} y={196} width={6} height={162} fill="#6b5a48" />
      <rect x={217} y={362} width={6} height={180} fill="#6b5a48" />
      <rect x={477} y={362} width={6} height={180} fill="#6b5a48" />

      {/* 기획 예정 방 */}
      {Object.values(ROOMS)
        .filter((r) => r.status !== 'live')
        .map((r) => <PlannedOverlay key={r.id} box={ROOM_BOX[r.id]} />)}

      <EventLayer key={playing?.key} event={playing} />

      {Object.values(ROOMS).map((r) => (
        <RoomLabel key={r.id} room={r} box={ROOM_BOX[r.id]} />
      ))}
      {Object.keys(ROOM_BOX).map(roomHit)}
    </svg>
  );
}

export default HouseScene;
