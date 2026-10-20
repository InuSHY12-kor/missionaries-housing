import React from 'react';
import { ROOMS } from './houseConfig';
import { Character, CharacterDefs, Suitcase, WelcomeKit, Letter, Paper, Heart } from './Characters';
import { P, pts, Floor, Box, WallRect, GlassWall, Desk, Monitor, Chair, Plant, NameCard, Bubble, Card, IsoDefs } from './iso';

// WEWE 하우스 — 사역별 룸으로 나눈 아이소메트릭 사무실(2026-10-20 2차 개편).
// 룸 구성은 claude/wewe-projects-and-roles-2026-10-20.md와 같습니다(한 룸 = 한 사역 = 담당자 1명).
// 바닥 36 × 27칸, 3줄(운영·목회자/선교사 사역·로비) 사이에 복도.
// 진행 중인 룸: 조명 켜짐 + 담당자가 일하고 룸 안을 오감. 준비 중인 룸: 조명 꺼짐(어둡게) + 담당자 없음.

export const ZONES = {
  ceo: { x: 0, y: 0, w: 12, d: 8 },
  web: { x: 12, y: 0, w: 6, d: 8 },
  donation: { x: 18, y: 0, w: 8, d: 8 },
  tailor: { x: 26, y: 0, w: 10, d: 8 },
  academy: { x: 0, y: 10, w: 9, d: 7 },
  pastorcare: { x: 9, y: 10, w: 7, d: 7 },
  guest: { x: 16, y: 10, w: 11, d: 7 },
  poiema: { x: 27, y: 10, w: 9, d: 7 },
  porch: { x: 0, y: 19, w: 9, d: 8 },
  connect: { x: 9, y: 19, w: 9, d: 8 },
  garage: { x: 18, y: 19, w: 18, d: 8 },
};

// 룸 바닥 재질: wood(원목 마루) · carpet(카펫) · concrete(콘크리트 그대로)
const FLOOR = {
  ceo: ['wood', '#c9a27a'], web: ['carpet', '#c9cfd2'], donation: ['carpet', '#d9cbbd'], tailor: ['wood', '#d2b08a'],
  academy: ['carpet', '#c9c6be'], pastorcare: ['wood', '#c49d76'], guest: ['wood', '#d4b48e'], poiema: ['carpet', '#c9d3c3'],
  porch: ['wood', '#c79f78'], connect: ['carpet', '#d8c98f'], garage: ['concrete', null],
};
// 창이 있는 뒤쪽 벽 구간(y = 0 벽) — 햇빛이 바닥으로 들어옵니다
const WINDOW_BAYS = [[0.4, 3.6], [3.6, 6.8], [6.8, 10.0], [26.4, 29.6], [29.6, 32.8], [32.8, 35.6]];

const at = (x, y, z = 0) => {
  const [sx, sy] = P(x, y, z);
  return `translate(${sx.toFixed(1)},${sy.toFixed(1)})`;
};
const delta = (a, b) => {
  const p = P(a[0], a[1]);
  const q = P(b[0], b[1]);
  return [Math.round(q[0] - p[0]), Math.round(q[1] - p[1])];
};

// ── 건물 ─────────────────────────────────────────────────────
function Shell() {
  const windows = WINDOW_BAYS.map(([a, b]) => {
    const panes = [];
    const mid = (a + b) / 2;
    [[a, mid], [mid, b]].forEach(([s, e]) => {
      [[0.6, 3.2], [3.2, 5.6]].forEach(([z0, z1]) => {
        panes.push(<polygon key={`${s}-${z0}`} points={pts(P(s, 0.03, z0), P(e, 0.03, z0), P(e, 0.03, z1), P(s, 0.03, z1))} fill="url(#isoSky)" stroke="#2a2a2e" strokeWidth={2.2} />);
      });
    });
    return (
      <g key={a}>
        {panes}
        <polygon points={pts(P(a + 0.2, 0.04, 0.8), P(a + 0.9, 0.04, 0.8), P(a + 1.6, 0.04, 5.4), P(a + 0.9, 0.04, 5.4))} fill="#ffffff" opacity={0.28} />
      </g>
    );
  });
  return (
    <g>
      {/* 벽: 흰 벽 + 큰 창(오른쪽 위 벽) + 콘크리트 기둥 */}
      <polygon points={pts(P(0, 0, 0), P(0, 27, 0), P(0, 27, 6), P(0, 0, 6))} fill="#ecebe8" />
      <polygon points={pts(P(0, 0, 0), P(0, 27, 0), P(0, 27, 6), P(0, 0, 6))} fill="url(#isoShadeLeft)" />
      <polygon points={pts(P(0, 0, 0), P(36, 0, 0), P(36, 0, 6), P(0, 0, 6))} fill="#f6f5f2" />
      {windows}
      <polygon points={pts(P(0, 0, 6), P(36, 0, 6), P(36, -0.45, 6), P(-0.45, -0.45, 6), P(-0.45, 27, 6), P(0, 27, 6))} fill="#cfccc6" />
      {/* 콘크리트 바닥 */}
      <polygon points={pts(P(0, 0), P(36, 0), P(36, 27), P(0, 27))} fill="#d7d5d1" filter="url(#isoConcrete)" />
      <polygon points={pts(P(0, 27), P(36, 27), P(36, 27, -0.5), P(0, 27, -0.5))} fill="#b9b6b0" />
      <polygon points={pts(P(36, 0), P(36, 27), P(36, 27, -0.5), P(36, 0, -0.5))} fill="#a8a59f" />
      {/* 벽과 바닥이 만나는 곳의 그늘 */}
      <polygon points={pts(P(0, 0), P(36, 0), P(36, 0.9), P(0, 0.9))} fill="rgba(40,34,28,0.16)" filter="url(#isoSoftShadow)" />
      <polygon points={pts(P(0, 0), P(0, 27), P(0.9, 27), P(0.9, 0))} fill="rgba(40,34,28,0.12)" filter="url(#isoSoftShadow)" />
      {[[0, 9.0], [0, 18.0], [11.0, 0], [25.4, 0]].map(([x, y]) => (
        <Box key={`${x}-${y}`} x={x} y={y} w={0.7} d={0.7} h={6} top="#c9c6c0" left="#dedcd8" right="#c4c1bb" />
      ))}
    </g>
  );
}

// 창으로 들어오는 햇빛(바닥 위 밝은 띠)
function Sunlight() {
  return (
    <g className="iso-sun" aria-hidden="true" style={{ mixBlendMode: 'screen' }} opacity={0.5}>
      {WINDOW_BAYS.map(([a, b]) => (
        <polygon key={a} points={pts(P(a + 0.3, 0.4), P(b - 0.3, 0.4), P(b + 1.6, 7.6), P(a + 2.2, 7.6))} fill="#fff1cf" filter="url(#isoSunBlur)" />
      ))}
    </g>
  );
}

function RoomFloor({ id }) {
  const z = ZONES[id];
  const [kind, color] = FLOOR[id] || ['concrete', null];
  if (kind === 'concrete') return null;
  const lines = [];
  if (kind === 'wood') {
    for (let j = z.y + 0.6; j < z.y + z.d - 0.2; j += 0.6) {
      const a = P(z.x + 0.15, j);
      const b = P(z.x + z.w - 0.15, j);
      lines.push(<line key={j} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(90,60,30,0.16)" strokeWidth={1} />);
    }
  }
  return (
    <g>
      <Floor x={z.x + 0.15} y={z.y + 0.15} w={z.w - 0.3} d={z.d - 0.3} fill={color} filter={kind === 'carpet' ? 'url(#isoConcrete)' : undefined} />
      {lines}
      <Floor x={z.x + 0.15} y={z.y + 0.15} w={z.w - 0.3} d={z.d - 0.3} fill="url(#isoSheenTop)" />
    </g>
  );
}

// 룸 바닥·낮은 벽(뒤쪽 두 면, 바깥벽에 붙은 면 제외)·조명 웅덩이
function RoomShell({ id, live }) {
  const z = ZONES[id];
  const [cx, cy] = P(z.x + z.w / 2, z.y + z.d / 2);
  // 뒤쪽 두 면은 검은 프레임 유리벽(바깥벽에 붙은 면 제외)
  return (
    <g>
      <RoomFloor id={id} />
      {live && <ellipse cx={cx} cy={cy} rx={z.w * 9 + 40} ry={z.d * 5 + 24} fill="url(#roomGlow)" />}
      {z.y > 0 && <GlassWall axis="x" at={z.y} a={z.x} b={z.x + z.w} h={3.2} />}
      {z.x > 0 && <GlassWall axis="y" at={z.x} a={z.y} b={z.y + z.d} h={3.2} />}
    </g>
  );
}

function Pendant({ x, y, lit }) {
  const top = P(x, y, 6);
  const b = P(x, y, 5.1);
  return (
    <g aria-hidden="true">
      <line x1={top[0]} y1={top[1]} x2={b[0]} y2={b[1]} stroke="#4a4a46" strokeWidth={1.1} />
      {lit && <circle cx={b[0]} cy={b[1] + 12} r={20} fill="url(#lampGlowSmall)" />}
      <path d={`M${b[0] - 12} ${b[1] + 10} L${b[0] + 12} ${b[1] + 10} L${b[0] + 4} ${b[1]} L${b[0] - 4} ${b[1]} Z`} fill={lit ? '#5f5f5a' : '#3a3a38'} />
      <ellipse cx={b[0]} cy={b[1] + 10} rx={12} ry={2.5} fill={lit ? '#ffe7a8' : '#55534e'} />
    </g>
  );
}

function PlannedSign({ x, y }) {
  return (
    <g transform={at(x, y, 0)} aria-hidden="true">
      <line x1={-8} y1={0} x2={-8} y2={-26} stroke="#8a857b" strokeWidth={2} />
      <line x1={8} y1={0} x2={8} y2={-26} stroke="#8a857b" strokeWidth={2} />
      <rect x={-16} y={-40} width={32} height={16} rx={3} fill="#f6e3a1" stroke="#c9b06a" />
      <text x={0} y={-28.5} textAnchor="middle" className="iso-sign-text">준비 중</text>
    </g>
  );
}

// 담당자가 룸 안 두 지점(from ↔ to)을 오가며 일함. 카드도 함께 움직임.
function Walker({ kind, from, to, dur, delay = 0, title, sub }) {
  const [dx, dy] = delta(from, to);
  const style = { '--dx': `${dx}px`, '--dy': `${dy}px`, '--route-dur': `${dur}s`, '--route-delay': `${delay}s` };
  return (
    <g transform={at(from[0], from[1])}>
      <g className="sd-route" style={style}>
        <Character kind={kind} className="sd-walker" />
        <Card title={title} sub={sub} dy={-90} />
      </g>
    </g>
  );
}

// ── 운영: 대표이사실 ─────────────────────────────────────────
function CeoOffice() {
  const books = [];
  [1.1, 2.3, 3.5].forEach((z, row) => {
    for (let i = 0; i < 6; i += 1) {
      const y0 = 1.0 + i * 0.5 + (row % 2) * 0.12;
      const colors = ['#146b71', '#d97b3f', '#c9b79c', '#2b2f3a', '#b8622c', '#8a9a7a'];
      const h = 0.85 - (i % 3) * 0.12;
      books.push(<polygon key={`${row}-${i}`} points={pts(P(0.86, y0, z), P(0.86, y0 + 0.38, z), P(0.86, y0 + 0.38, z + h), P(0.86, y0, z + h))} fill={colors[(i + row) % colors.length]} />);
    }
  });
  return (
    <g>
      <Floor x={1.6} y={5.2} w={9.4} d={2.4} fill="#d9cdbb" opacity={0.7} />
      {/* 원목 루버 벽 + WEWE 액자(왼쪽 벽) */}
      {[4.8, 5.1, 5.4, 5.7, 6.0, 6.3, 6.6, 6.9, 7.2].map((y) => (
        <polygon key={y} points={pts(P(0.03, y, 0.3), P(0.03, y + 0.18, 0.3), P(0.03, y + 0.18, 5.4), P(0.03, y, 5.4))} fill="#b98a5c" />
      ))}
      <WallRect wall="back-left" a={5.2} z={2.6} len={1.8} h={1.4} inset={0.05} fill="#1c1c20" stroke="#0f0f12" />
      <g transform={at(0.06, 6.1, 3.2)}><text textAnchor="middle" className="iso-wall-logo iso-wall-logo--light">WEWE</text></g>
      <Box x={0.05} y={0.8} w={0.8} d={3.6} h={4.4} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      {books}
      {[1.0, 2.2, 3.4, 4.4].map((z) => <polygon key={z} points={pts(P(0.86, 0.8, z), P(0.86, 4.4, z))} stroke="#8a6a4a" strokeWidth={2} fill="none" />)}
      <Plant x={11.3} y={1.1} scale={1.15} />
      <Box x={1.0} y={5.0} w={1.2} d={2.6} h={0.75} top="#e9e6e0" left="#d8d3ca" right="#cfc9be" />
      <Box x={1.0} y={5.0} z={0.75} w={0.35} d={2.6} h={0.75} top="#e9e6e0" left="#d8d3ca" right="#d8d3ca" />
      <Box x={1.5} y={5.7} z={0.75} w={0.5} d={0.6} h={0.3} top="#7a2b2b" left="#6a2424" right="#5a1f1f" />
      {/* 의자 등받이 → 홍현지 → 책상 */}
      <Box x={6.4} y={2.6} z={0.9} w={1.4} d={0.2} h={2.0} top="#3a3f47" left="#33373e" right="#2b2f36" />
      <Box x={6.4} y={2.8} z={0.75} w={1.4} d={1.1} h={0.16} top="#3a3f47" left="#33373e" right="#2b2f36" />
      <g transform={at(7.1, 3.45, 0.9)}>
        <Character kind="ceo" seated className="is-busy" />
      </g>
      <Box x={4.5} y={4.2} w={5.2} d={1.8} h={1.6} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
      <Box x={6.45} y={4.45} z={1.6} w={1.3} d={0.85} h={0.05} top="#cfd3d8" left="#b9bec4" right="#aeb3b9" />
      <polygon points={pts(P(6.45, 5.3, 1.65), P(7.75, 5.3, 1.65), P(7.75, 5.3, 2.4), P(6.45, 5.3, 2.4))} fill="#c9ced4" stroke="#aeb3b9" />
      <Box x={8.6} y={4.4} z={1.6} w={0.8} d={0.9} h={0.18} top="#e6e2da" left="#d4cfc5" right="#c9c3b8" />
      <Box x={8.65} y={4.45} z={1.78} w={0.7} d={0.8} h={0.12} top="#ffffff" left="#f1ede6" right="#e8e3da" />
      <Box x={4.8} y={4.5} z={1.6} w={0.8} d={0.9} h={0.32} top="#ffffff" left="#f1ede6" right="#e8e3da" />
      <g transform={at(6.0, 5.6, 1.6)}>
        <rect x={-4} y={-9} width={8} height={9} rx={1.5} fill="#d97b3f" />
        <path className="iso-steam" d="M-1 -11 q-3 -4 0 -8 q3 -4 0 -8" stroke="#ffffff" strokeWidth={1.6} fill="none" opacity={0.8} />
      </g>
      <g className="iso-papers">
        <g transform={at(9.0, 4.85, 1.95)}><Paper className="iso-paper iso-paper-1" /></g>
        <g transform={at(9.0, 4.85, 1.95)}><Paper className="iso-paper iso-paper-2" /></g>
      </g>
      <Box x={5.5} y={5.7} z={1.6} w={1.4} d={0.2} h={0.3} top="#2b2f3a" left="#2b2f3a" right="#23272d" />
    </g>
  );
}

// 대표이사실 앞쪽 유리벽(가운데 출입문 틈)
function CeoGlass() {
  return (
    <g aria-hidden="true">
      <GlassWall axis="x" at={8} a={0} b={6} h={3.4} />
      <GlassWall axis="x" at={8} a={8.2} b={12} h={3.4} />
    </g>
  );
}

// ── 운영: 김바름 웹 관리실 ───────────────────────────────────
function codeLines(x0, y, zTop, rows, widthUnits) {
  const lines = [];
  const colors = ['#7fd1c7', '#f0c9a0', '#c9d1dc', '#e9a06d', '#9fb7f0', '#c9d1dc'];
  for (let i = 0; i < rows; i += 1) {
    const indent = [0, 0.12, 0.24, 0.12, 0, 0.24][i % 6];
    const len = [0.7, 0.55, 0.8, 0.4, 0.65, 0.5][i % 6] * widthUnits;
    const a = P(x0 + indent, y, zTop - i * 0.11);
    const b = P(x0 + indent + len * 0.8, y, zTop - i * 0.11);
    lines.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={colors[i % 6]} strokeWidth={1.6} strokeLinecap="round" />);
  }
  return lines;
}

function WebRoom({ active }) {
  const clip = pts(P(14.26, 1.06, 1.74), P(15.44, 1.06, 1.74), P(15.44, 1.06, 2.37), P(14.26, 1.06, 2.37));
  return (
    <g className={active ? 'iso-web is-active' : 'iso-web'}>
      <defs><clipPath id="isoCodeClip"><polygon points={clip} /></clipPath></defs>
      {[['#f6e3a1', 12.4, 4.0], ['#bfe0dc', 13.2, 4.2], ['#f2c6b4', 14.0, 3.9], ['#f6e3a1', 12.8, 3.1], ['#d9d2f0', 13.6, 3.2]].map(([c, a, z]) => (
        <WallRect key={`${a}-${z}`} wall="back-right" a={a} z={z} len={0.65} h={0.6} fill={c} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
      ))}
      <Box x={16.9} y={4.3} w={0.9} d={0.9} h={3.0} top="#3a3f47" left="#2b2f36" right="#23272d" />
      {[0.6, 1.1, 1.6, 2.1, 2.6].map((z, i) => (
        <g key={z} transform={at(17.1, 5.2, z)}>
          <circle className={`iso-led iso-led-${i % 3}`} r={1.8} fill={i % 2 ? '#7fd1c7' : '#f0c9a0'} />
          <circle className={`iso-led iso-led-${(i + 1) % 3}`} cx={7} cy={4} r={1.8} fill="#7fd1c7" />
        </g>
      ))}
      <Desk x={12.6} y={0.9} w={4.9} d={1.4} h={1.5} />
      <Monitor x={12.85} y={1.05} z={1.5} w={1.3} h={0.72} screen={active ? '#fbf7f1' : '#2b3340'}>
        {active && (
          <g>
            <polygon points={pts(P(12.92, 1.07, 2.32), P(14.08, 1.07, 2.32), P(14.08, 1.07, 2.1), P(12.92, 1.07, 2.1))} fill="#d97b3f" />
            <polygon points={pts(P(13.0, 1.07, 2.0), P(13.45, 1.07, 2.0), P(13.45, 1.07, 1.78), P(13.0, 1.07, 1.78))} fill="#bfe0dc" />
            <polygon points={pts(P(13.55, 1.07, 2.0), P(14.0, 1.07, 2.0), P(14.0, 1.07, 1.78), P(13.55, 1.07, 1.78))} fill="#f2e0c8" />
          </g>
        )}
      </Monitor>
      <Monitor x={14.2} y={1.05} z={1.5} w={1.3} h={0.72} screen={active ? '#1e2430' : '#2b3340'}>
        <g clipPath="url(#isoCodeClip)">
          <g className={active ? 'iso-code is-scrolling' : 'iso-code'}>{codeLines(14.3, 1.07, 2.32, active ? 14 : 0, 1.1)}</g>
        </g>
      </Monitor>
      <Monitor x={15.55} y={1.05} z={1.5} w={1.3} h={0.72} screen={active ? '#f7f3ee' : '#2b3340'}>
        {active && (
          <g>
            <g transform={at(15.85, 1.07, 2.12)}>
              <path className="iso-claude-mark" d="M0 -6 L1.3 -1.3 L6 0 L1.3 1.3 L0 6 L-1.3 1.3 L-6 0 L-1.3 -1.3 Z" fill="#d97757" />
            </g>
            {[2.24, 2.04, 1.86].map((z, i) => {
              const a = P(16.05, 1.07, z);
              const b = P(16.05 + [0.6, 0.45, 0.55][i], 1.07, z);
              return <line key={z} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#c9bfb2" strokeWidth={1.6} strokeLinecap="round" className={`iso-chat iso-chat-${i}`} />;
            })}
          </g>
        )}
      </Monitor>
      <Box x={14.4} y={1.75} z={1.5} w={1.0} d={0.35} h={0.04} top="#e9e6e0" left="#d4cfc5" right="#c9c3b8" />
      <g transform={at(17.0, 2.0, 1.5)}>
        <rect x={-3.5} y={-8} width={7} height={8} rx={1.5} fill="#146b71" />
        {!active && <path className="iso-steam" d="M-1 -10 q-3 -4 0 -7 q3 -4 0 -7" stroke="#ffffff" strokeWidth={1.5} fill="none" opacity={0.8} />}
      </g>
      <g transform={at(14.85, 3.0, 0.95)}>
        <Character kind="dev" seated back className={active ? 'is-typing' : 'is-resting'} />
      </g>
      <Chair x={14.45} y={2.6} color="#3a3f47" dark="#2b2f36" />
      <Plant x={12.8} y={7.2} />
    </g>
  );
}

// ── 운영: 후원 관리실 ───────────────────────────────────────
function DonationRoom({ supporters }) {
  return (
    <g>
      {/* 후원 캠페인 보드(진행 막대) */}
      <WallRect wall="back-right" a={22.6} z={1.8} len={2} h={2.6} fill="#ffffff" stroke="#c89b6d" strokeWidth={3} />
      <WallRect wall="back-right" a={23.0} z={2.1} len={0.35} h={1.8} fill="#f1e6d8" stroke="none" />
      <WallRect wall="back-right" a={23.0} z={2.1} len={0.35} h={1.2} fill="#e8607a" stroke="none" />
      <WallRect wall="back-right" a={23.6} z={3.4} len={0.8} h={0.25} fill="#c9bfb2" stroke="none" />
      <WallRect wall="back-right" a={23.6} z={2.9} len={0.6} h={0.25} fill="#c9bfb2" stroke="none" />
      <WallRect wall="back-right" a={23.6} z={2.4} len={0.7} h={0.25} fill="#c9bfb2" stroke="none" />
      <Desk x={18.8} y={0.9} w={3.4} d={1.4} h={1.5} />
      <Monitor x={19.4} y={1.05} z={1.5} w={1.3} h={0.72} screen="#fbf7f1">
        <polygon points={pts(P(19.5, 1.07, 2.3), P(20.6, 1.07, 2.3), P(20.6, 1.07, 2.1), P(19.5, 1.07, 2.1))} fill="#e9a06d" />
        <polygon points={pts(P(19.5, 1.07, 2.0), P(20.3, 1.07, 2.0), P(20.3, 1.07, 1.85), P(19.5, 1.07, 1.85))} fill="#c9bfb2" />
      </Monitor>
      {/* 감사 편지 더미 */}
      <Box x={21.1} y={1.3} z={1.5} w={0.8} d={0.6} h={0.25} top="#ffffff" left="#f1ede6" right="#e8e3da" />
      <Box x={24.4} y={0.4} w={1.1} d={0.9} h={2.4} top="#c9c3b8" left="#e6e2da" right="#d4cfc5" />
      {[0.5, 1.2, 1.9].map((z) => <polygon key={z} points={pts(P(24.4, 1.31, z), P(25.5, 1.31, z), P(25.5, 1.31, z + 0.45), P(24.4, 1.31, z + 0.45))} fill="#f1ede6" stroke="#c9c3b8" />)}
      <Plant x={18.8} y={7.1} />
      <Walker kind="donation" from={[20.6, 3.0]} to={[24.9, 2.2]} dur={15} delay={-2} title="후원 관리 담당" sub={`후원 관리실 · 후원자 ${supporters}`} />
    </g>
  );
}

// ── Project 1: 재단사 작업실(전투복) ─────────────────────────
function TailorRoom() {
  const garments = ['#1f2c4a', '#3a3f47', '#c9b79c', '#146b71', '#6b4a36', '#2b2f3a'].map((c, i) => {
    const x = 27.4 + i * 0.52;
    return <polygon key={c + i} points={pts(P(x - 0.22, 1.08, 3.4), P(x + 0.22, 1.08, 3.4), P(x + 0.27, 1.08, 1.5), P(x - 0.27, 1.08, 1.5))} fill={c} stroke="rgba(0,0,0,0.12)" />;
  });
  return (
    <g>
      <Box x={27.0} y={0.8} w={3.6} d={0.5} h={0.12} top="#a87a4f" left="#8a6a4a" right="#8a6a4a" />
      <Box x={27.0} y={1.0} w={0.1} d={0.1} h={3.7} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      <Box x={30.5} y={1.0} w={0.1} d={0.1} h={3.7} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      <Box x={27.0} y={1.0} z={3.6} w={3.6} d={0.1} h={0.1} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      {garments}
      <g transform={at(30.55, 1.1, 3.5)}>
        <path className="hh-tape" d="M0 0 Q-6 18 -1 34" fill="none" stroke="#f0c9a0" strokeWidth={4} strokeLinecap="round" strokeDasharray="2 4" />
      </g>
      <Box x={32.3} y={3.4} w={3.3} d={1.3} h={1.5} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
      <Box x={33.2} y={3.65} z={1.5} w={1.3} d={0.6} h={0.22} top="#3a3f47" left="#2b2f36" right="#23272d" />
      <Box x={33.25} y={3.75} z={1.72} w={0.25} d={0.4} h={0.55} top="#3a3f47" left="#2b2f36" right="#23272d" />
      <Box x={33.25} y={3.75} z={2.27} w={1.05} d={0.4} h={0.22} top="#3a3f47" left="#2b2f36" right="#23272d" />
      <Box x={33.6} y={3.8} z={2.49} w={0.2} d={0.2} h={0.18} top="#d97b3f" left="#b8622c" right="#a0531f" />
      <g transform={at(34.15, 4.15, 2.27)}><rect className="hh-needle" x={-1} y={0} width={2} height={7} fill="#c9c3b8" /></g>
      <g transform={at(28.6, 5.0, 0)}>
        <ellipse rx={11} ry={4} fill="#8a6a4a" />
        <line x1={0} y1={0} x2={0} y2={-40} stroke="#8a6a4a" strokeWidth={3} />
        <path d="M-12 -64 Q0 -73 12 -64 L10 -38 L-10 -38 Z" fill="#1f2c4a" />
        <path d="M-3 -69 L0 -56 L3 -69" fill="#ffffff" />
        <circle cx={0} cy={-72} r={4} fill="#8a6a4a" />
      </g>
      <Walker kind="tailor" from={[29.9, 5.8]} to={[33.6, 5.6]} dur={13} delay={-5} title="전투복 담당" sub="재단사 작업실 · 근무 중" />
    </g>
  );
}

// ── Project 1: 아카데미 강의실·목회자 케어룸(준비 중) ─────────
function AcademyRoom() {
  const seats = [];
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      seats.push(<Chair key={`${r}-${c}`} x={3.6 + c * 1.5} y={12.4 + r * 1.7} color="#d9d5cd" dark="#bdb8ae" />);
    }
  }
  return (
    <g>
      <WallRect wall="back-left" a={10.8} z={1.6} len={3.4} h={2.4} fill="#ffffff" stroke="#c9c3b8" strokeWidth={3} />
      <WallRect wall="back-left" a={11.4} z={3.2} len={2.0} h={0.25} fill="#c9bfb2" stroke="none" />
      <WallRect wall="back-left" a={11.4} z={2.6} len={1.4} h={0.25} fill="#c9bfb2" stroke="none" />
      <Box x={1.2} y={11.4} w={0.9} d={1.0} h={1.6} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      {seats}
      <PlannedSign x={7.6} y={16.2} />
    </g>
  );
}

function PastorCareRoom() {
  return (
    <g>
      <Floor x={10.4} y={12.2} w={4.4} d={3.4} fill="#d8cbbf" opacity={0.7} />
      <Box x={10.6} y={11.0} w={0.9} d={2.2} h={2.8} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      <Box x={11.6} y={13.1} w={1.3} d={1.3} h={0.8} top="#c9a0a0" left="#b38585" right="#a07474" />
      <Box x={11.6} y={13.1} z={0.8} w={0.35} d={1.3} h={0.9} top="#c9a0a0" left="#b38585" right="#b38585" />
      <Box x={13.7} y={13.1} w={1.3} d={1.3} h={0.8} top="#c9a0a0" left="#b38585" right="#a07474" />
      <Box x={14.65} y={13.1} z={0.8} w={0.35} d={1.3} h={0.9} top="#c9a0a0" left="#b38585" right="#a07474" />
      <g transform={at(13.25, 15.0, 0)}>
        <rect x={-2} y={-16} width={4} height={16} fill="#bdb8ae" />
        <ellipse cy={-16} rx={14} ry={7} fill="#f7f6f3" />
      </g>
      <Plant x={15.4} y={11.2} />
      <PlannedSign x={13.0} y={16.4} />
    </g>
  );
}

// ── Project 2: 게스트룸(WEWE 스테이) ────────────────────────
function GuestRoom({ stays }) {
  return (
    <g>
      <Floor x={18} y={13.6} w={4} d={2.6} fill="#e6c9a5" opacity={0.6} />
      <Box x={26.6} y={10.6} w={0.25} d={3.1} h={2.1} top="#a87a4f" left="#8a6a4a" right="#8a6a4a" />
      <Box x={22.6} y={10.6} w={4.0} d={3.1} h={0.7} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      <Box x={22.7} y={10.7} w={3.85} d={2.9} z={0.7} h={0.35} top="#ffffff" left="#f1ece4" right="#e6e0d6" />
      <Box x={22.7} y={12.1} w={3.0} d={1.5} z={1.05} h={0.08} top="#146b71" left="#0f5a5f" right="#0f5a5f" />
      <Box x={25.7} y={10.9} w={0.75} d={1.1} z={1.05} h={0.28} top="#f4e9da" left="#e9dcc8" right="#e2d3bc" />
      <Box x={25.7} y={12.2} w={0.75} d={1.1} z={1.05} h={0.28} top="#f4e9da" left="#e9dcc8" right="#e2d3bc" />
      <Box x={26.0} y={14.0} w={0.8} d={0.8} h={0.95} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      <g transform={at(26.4, 14.4, 0.95)}>
        <circle className="hh-lamp-glow" cx={0} cy={-22} r={46} fill="url(#hhLampGlow)" />
        <rect x={-1.5} y={-12} width={3} height={12} fill="#8a6a4a" />
        <path d="M-9 -12 L9 -12 L6 -24 L-6 -24 Z" fill="#f0c9a0" />
      </g>
      <Box x={16.5} y={10.5} w={1.0} d={2.0} h={3.2} top="#d9c7a8" left="#c9b48f" right="#b9a37d" />
      <Box x={18.2} y={10.6} w={1.6} d={0.8} h={0.6} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
      <Plant x={16.8} y={16.3} />
      <Walker kind="stay" from={[19.2, 12.4]} to={[21.8, 14.8]} dur={12} delay={-1} title="스테이 담당" sub={`게스트룸 · 숙소 ${stays}`} />
    </g>
  );
}

// ── Project 2: 힐링룸·커넥트 라운지·차고(준비 중) ───────────
function PoiemaRoom() {
  return (
    <g>
      {[[28.6, 11.4, '#bfe0dc'], [28.6, 13.4, '#f2c6b4'], [30.6, 11.4, '#d9d2f0']].map(([x, y, c]) => (
        <Floor key={`${x}-${y}`} x={x} y={y} w={1.6} d={0.9} fill={c} />
      ))}
      <g transform={at(33.2, 12.6, 0)}><ellipse cy={-8} rx={16} ry={10} fill="#e9a06d" /></g>
      <g transform={at(34.4, 14.6, 0)}><ellipse cy={-8} rx={16} ry={10} fill="#8fb5a5" /></g>
      <Plant x={35.2} y={10.8} scale={1.2} />
      <Plant x={27.6} y={16.2} />
      <PlannedSign x={31.4} y={16.3} />
    </g>
  );
}

function ConnectRoom() {
  // 빈백(레퍼런스의 컬러 빈백)
  const beans = [[11.4, 21.0, ['#6cc06a', '#2f8a3a']], [15.8, 21.2, ['#f08a6a', '#c0492f']], [11.6, 24.4, ['#5a7ad0', '#2a4aa0']], [16.2, 24.2, ['#f2c94c', '#c9962a']]];
  return (
    <g>
      <defs>
        {beans.map(([x, , c]) => (
          <radialGradient key={x} id={`bean-${x}`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0%" stopColor={c[0]} />
            <stop offset="100%" stopColor={c[1]} />
          </radialGradient>
        ))}
      </defs>
      {beans.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={at(x, y, 0)}>
          <ellipse cx={3} cy={2} rx={20} ry={7} fill="rgba(30,24,18,0.25)" filter="url(#isoSoftShadow)" />
          <path d="M-18 0 Q-22 -14 -10 -24 Q0 -30 10 -24 Q22 -14 18 0 Q0 6 -18 0 Z" fill={`url(#bean-${x})`} />
          <path d="M-8 -20 Q0 -24 8 -19" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.3} strokeLinecap="round" />
        </g>
      ))}
      <g transform={at(13.8, 23.0, 0)}>
        <rect x={-3} y={-22} width={6} height={22} fill="#d6d1c8" />
        <ellipse cy={-24} rx={40} ry={20} fill="#f7f6f3" stroke="#e2ded6" />
      </g>
      <Box x={10.0} y={25.4} w={3.4} d={1.1} h={0.7} top="#ebe8e2" left="#dcd8d0" right="#d2cdc4" />
      <Box x={10.0} y={26.2} z={0.7} w={3.4} d={0.3} h={0.8} top="#ebe8e2" left="#dcd8d0" right="#d2cdc4" />
      <Plant x={17.4} y={20.0} />
      <PlannedSign x={16.6} y={26.3} />
    </g>
  );
}

function Garage() {
  return (
    <g>
      {[21, 27, 33].map((x) => <polygon key={x} points={pts(P(x, 19.8), P(x, 26.2))} stroke="#ffffff" strokeWidth={2} fill="none" />)}
      <Box x={22.0} y={21.0} w={3.6} d={2.0} h={1.6} top="#1b8088" left="#146b71" right="#0f5a5f" />
      <Box x={25.6} y={21.0} w={1.4} d={2.0} h={1.0} top="#1b8088" left="#146b71" right="#0f5a5f" />
      <polygon points={pts(P(25.6, 21.1, 1.6), P(25.6, 22.9, 1.6), P(25.6, 22.9, 1.0), P(25.6, 21.1, 1.0))} fill="#dcecee" />
      <polygon points={pts(P(22.4, 23.01, 1.4), P(25.2, 23.01, 1.4), P(25.2, 23.01, 0.9), P(22.4, 23.01, 0.9))} fill="#dcecee" opacity={0.9} />
      {[23.1, 26.2].map((x) => <g key={x} transform={at(x, 23.05, 0.3)}><ellipse rx={7} ry={8} fill="#2b2f3a" /></g>)}
      <Box x={34.6} y={19.6} w={1.0} d={3.0} h={2.6} top="#c9c3b8" left="#b9b2a5" right="#a9a295" />
      <PlannedSign x={30.0} y={25.6} />
    </g>
  );
}

// ── 공용: 로비·우편함 ───────────────────────────────────────
function Lobby({ flagRaised }) {
  return (
    <g>
      <WallRect wall="back-left" a={21.6} z={0} len={2.3} h={3.6} fill="#146b71" stroke="#0f5a5f" strokeWidth={2} />
      <WallRect wall="back-left" a={22.1} z={2.2} len={1.3} h={0.9} fill="#dcecee" stroke="#0f5a5f" strokeWidth={1} />
      <g transform={at(0.05, 23.6, 1.8)}><circle r={2.5} fill="#f0c9a0" /></g>
      <g transform={at(0.05, 22.75, 4.2)}><text textAnchor="middle" className="iso-plaque">WEWE</text></g>
      <Floor x={0.3} y={21.6} w={2.2} d={2.5} fill="#8a6a4a" opacity={0.55} />
      {/* 커피 바(원목 + 콘크리트 상판) */}
      <Box x={3.2} y={19.5} w={4.4} d={1.0} h={1.6} top="#b9b6b0" left="#b98a5c" right="#a87a4f" />
      <Box x={3.2} y={19.5} z={1.6} w={4.4} d={1.0} h={0.1} top="#cfcdc8" left="#bdbab4" right="#aeaba5" />
      <Box x={3.5} y={19.6} z={1.7} w={0.8} d={0.6} h={0.75} top="#3a3a3e" left="#2b2b2e" right="#222225" />
      <Box x={5.0} y={19.7} z={1.7} w={0.35} d={0.35} h={0.45} top="#f1ede6" left="#e0dbd2" right="#d4cfc5" />
      {[4.0, 5.4, 6.8].map((x) => (
        <g key={x} transform={at(x, 21.3, 0)}>
          <line x1={-5} y1={0} x2={-3} y2={-24} stroke="#8a6a4a" strokeWidth={2} />
          <line x1={5} y1={0} x2={3} y2={-24} stroke="#8a6a4a" strokeWidth={2} />
          <ellipse cy={-25} rx={8} ry={3.6} fill="#c89b6d" />
        </g>
      ))}
      <Plant x={8.3} y={19.8} scale={1.15} />
      <Box x={6.85} y={25.35} w={0.15} d={0.15} h={1.8} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      <Box x={6.4} y={25.05} z={1.8} w={1.05} d={0.7} h={0.55} top="#e9a06d" left="#d97b3f" right="#b8622c" />
      <g transform={at(7.45, 25.4, 2.05)}>
        <g className={`hh-flag${flagRaised ? ' is-raised' : ''}`}>
          <rect x={0} y={-18} width={2.5} height={18} fill="#6b5a48" />
          <rect x={2.5} y={-18} width={10} height={7} fill="#146b71" />
        </g>
      </g>
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
          <Floor className="ev-room-glow" x={16.2} y={10.2} w={10.6} d={6.6} fill="#ffe3b5" />
          <g transform={at(24.2, 12.6, 1.15)}><WelcomeKit className="ev-drop" /></g>
        </g>
      );
    case 'arrive':
      return (
        <g className="ev ev-arrive">
          <g transform={at(16.6, 15.8, 0)}>
            <g className="iso-walk-x4">
              <Character kind={character} className="is-walking ev-arms-up" />
              <g transform="translate(15,0)"><Suitcase className="ev-putdown" /></g>
            </g>
          </g>
        </g>
      );
    case 'greet':
      return (
        <g className="ev ev-greet">
          <g transform={at(0.7, 22.8, 0)}>
            <g className="iso-walk-x3"><Character kind={character} className="is-walking ev-arms-up" /></g>
          </g>
        </g>
      );
    case 'supporter':
      return (
        <g className="ev ev-supporter">
          <g transform={at(18.6, 6.6, 0)}>
            <g className="iso-walk-x3">
              <Character kind={character} className="is-walking ev-arms-up" />
              <g transform="translate(0,-70)"><Heart className="ev-heart" /></g>
            </g>
          </g>
        </g>
      );
    case 'letter':
      return (
        <g className="ev ev-letter">
          <g transform={at(6.9, 25.4, 2.45)}><Letter className="ev-letter-fly" /></g>
        </g>
      );
    case 'tailor':
      return (
        <g className="ev ev-tailor">
          <g transform={at(26.6, 7.2, 0)}>
            <g className="iso-walk-tailor">
              <Character kind="pastor" suit className="is-walking ev-arms-up" />
              <ellipse className="ev-measure" cx={0} cy={-22} rx={14} ry={5} fill="none" stroke="#f0c9a0" strokeWidth={2.5} strokeDasharray="3 3" />
            </g>
          </g>
        </g>
      );
    default:
      return null;
  }
}

const zonePoints = (z) => pts(P(z.x, z.y), P(z.x + z.w, z.y), P(z.x + z.w, z.y + z.d), P(z.x, z.y + z.d));

// 룸 하나: 진행 중이면 그대로, 준비 중이면 조명을 끈 것처럼 어둡게
function Room({ id, children }) {
  const live = ROOMS[id]?.status === 'live';
  return (
    <g className={`iso-room iso-room--${id} ${live ? 'is-live' : 'is-planned'}`} filter={live ? undefined : 'url(#roomDark)'}>
      <RoomShell id={id} live={live} />
      {children}
    </g>
  );
}

function OfficeScene({ playing, selectedRoom, onSelectRoom, paused, counters, devActivity }) {
  const activeRoom = playing?.config.room;
  const flagRaised = playing?.config.anim === 'letter';
  const devActive = !!devActivity?.working;
  const n = (k) => (counters ? Number(counters[k] || 0).toLocaleString() : '-');

  const summary = Object.values(ROOMS)
    .map((r) => `${r.name}(${r.ministry}, ${r.owner}) ${r.status === 'live' ? '진행 중' : '준비 중'}`)
    .join(', ');

  const plannedCards = Object.values(ROOMS).filter((r) => r.status !== 'live');

  return (
    <svg
      className={`hh-scene iso-scene${paused ? ' is-paused' : ''}`}
      viewBox="20 20 1225 850"
      role="img"
      aria-label={`WEWE 하우스 사무실: ${summary}. 김바름 ${devActive ? 'Claude와 작업 중' : '대기'}.`}
    >
      <defs>
        <IsoDefs />
        <CharacterDefs />
        <radialGradient id="hhLampGlow">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampGlowSmall">
          <stop offset="0%" stopColor="#ffe08f" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffe08f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="roomGlow">
          <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fff3d6" stopOpacity="0" />
        </radialGradient>
        {/* 준비 중인 룸: 채도를 낮추고 밝기를 절반으로(조명이 꺼진 느낌) */}
        <filter id="roomDark">
          <feColorMatrix type="saturate" values="0.45" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.48" intercept="0.02" />
            <feFuncG type="linear" slope="0.5" intercept="0.02" />
            <feFuncB type="linear" slope="0.58" intercept="0.04" />
          </feComponentTransfer>
        </filter>
      </defs>

      <Shell />
      {/* 1줄: 운영(대표이사실·웹 관리실·후원 관리실) + 전투복 */}
      <Room id="ceo"><CeoOffice /></Room>
      <CeoGlass />
      <Room id="web"><WebRoom active={devActive} /></Room>
      <Room id="donation"><DonationRoom supporters={n('supporters')} /></Room>
      <Room id="tailor"><TailorRoom /></Room>
      {/* 2줄: 목회자·선교사 사역 */}
      <Room id="academy"><AcademyRoom /></Room>
      <Room id="pastorcare"><PastorCareRoom /></Room>
      <Room id="guest"><GuestRoom stays={n('approved_stays')} /></Room>
      <Room id="poiema"><PoiemaRoom /></Room>
      {/* 3줄: 로비·커넥트·차고 */}
      <Room id="porch"><Lobby flagRaised={flagRaised} /></Room>
      <Room id="connect"><ConnectRoom /></Room>
      <Room id="garage"><Garage /></Room>

      <Sunlight />

      {Object.entries(ZONES).map(([id, z]) => (
        <Pendant key={`lamp-${id}`} x={z.x + z.w / 2} y={z.y + z.d / 2} lit={ROOMS[id]?.status === 'live'} />
      ))}

      <EventLayer key={playing?.key} event={playing} />

      {Object.entries(ZONES).map(([id, z]) => (
        <polygon
          key={`ring-${id}`}
          className={`iso-ring${activeRoom === id ? ' is-active' : ''}${selectedRoom === id ? ' is-selected' : ''}`}
          points={zonePoints(z)}
        />
      ))}

      {/* 이름표: 자리에 앉은 사람·고정 룸 */}
      <NameCard x={7.1} y={3.45} z={4.9} title="대표 홍현지" sub="대표이사실 · 근무 중" highlight />
      <Bubble x={7.1} y={3.45} z={7.3} text="• • •" className="iso-typing-bubble" />
      <NameCard x={14.85} y={3.0} z={5.0} title="김바름" sub={devActive ? '웹 관리실 · 작업 중' : '웹 관리실 · 대기'} />
      {devActive && <Bubble x={14.85} y={3.0} z={7.4} text="Claude와 작업 중" className="iso-dev-bubble" />}
      <NameCard x={4.4} y={23.4} z={3.0} title="로비 · 우편함" sub={`사역 소식 ${n('published_posts')}`} />
      {plannedCards.map((r) => {
        const z = ZONES[r.id];
        return <NameCard key={`card-${r.id}`} x={z.x + z.w / 2} y={z.y + z.d * 0.62} z={1.4} title={r.name} sub="준비 중" dim />;
      })}

      {Object.entries(ZONES).map(([id, z]) => (
        <polygon key={`hit-${id}`} className="iso-hit" points={zonePoints(z)} onClick={() => onSelectRoom(id)} />
      ))}
    </svg>
  );
}

export default OfficeScene;
