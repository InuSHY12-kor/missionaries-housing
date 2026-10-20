import React from 'react';
import { ROOMS } from './houseConfig';
import { Character, Suitcase, WelcomeKit, Letter, Paper } from './Characters';
import { P, pts, Floor, Box, WallRect, Desk, Monitor, Chair, Plant, NameCard, Bubble } from './iso';

// WEWE 하우스 — 아이소메트릭 사무실(2026-10-20 개편).
// 바닥 30 × 22칸. 뒤쪽 벽: 오른쪽 위(y = 0), 왼쪽 위(x = 0).
//   대표이사실(크게, 유리벽) · 김바름 웹 관리실 · 재단사 작업실(전투복) · 게스트룸(WEWE 스테이)
//   현관·우편함(후원·사역 소식) · 거실(준비 중) · 차고(준비 중)
// 그리는 순서는 뒤(작은 x + y)에서 앞으로. 평상시 움직임·연출은 wewe-house.css.

export const ZONES = {
  ceo: { x: 0, y: 0, w: 11, d: 9 },
  web: { x: 12, y: 0, w: 7, d: 6 },
  tailor: { x: 20, y: 0, w: 10, d: 8 },
  guest: { x: 20, y: 9, w: 10, d: 8 },
  porch: { x: 0, y: 13, w: 6.5, d: 9 },
  living: { x: 7.5, y: 11, w: 11, d: 11 },
  garage: { x: 20, y: 18, w: 10, d: 4 },
};

const at = (x, y, z = 0) => {
  const [sx, sy] = P(x, y, z);
  return `translate(${sx.toFixed(1)},${sy.toFixed(1)})`;
};

// ── 구조 ─────────────────────────────────────────────────────
function Shell() {
  const planks = [];
  for (let j = 1; j < 22; j += 1) {
    const a = P(0, j);
    const b = P(30, j);
    planks.push(<line key={j} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#e2cfb1" strokeWidth={1} />);
  }
  return (
    <g>
      {/* 벽 */}
      <polygon points={pts(P(0, 0, 0), P(0, 22, 0), P(0, 22, 7), P(0, 0, 7))} fill="#e9e5de" />
      <polygon points={pts(P(0, 0, 0), P(30, 0, 0), P(30, 0, 7), P(0, 0, 7))} fill="#f3f0ea" />
      <polygon points={pts(P(0, 0, 7), P(30, 0, 7), P(30, -0.4, 7), P(-0.4, -0.4, 7), P(-0.4, 22, 7), P(0, 22, 7))} fill="#dcd6cc" />
      {/* 바닥 */}
      <polygon points={pts(P(0, 0), P(30, 0), P(30, 22), P(0, 22))} fill="#ecdcc2" />
      {planks}
      {/* 바닥 두께 */}
      <polygon points={pts(P(0, 22), P(30, 22), P(30, 22, -0.5), P(0, 22, -0.5))} fill="#d9c7a8" />
      <polygon points={pts(P(30, 0), P(30, 22), P(30, 22, -0.5), P(30, 0, -0.5))} fill="#cbb894" />
      {/* 걸레받이 */}
      <polygon points={pts(P(0, 0, 0), P(30, 0, 0), P(30, 0, 0.25), P(0, 0, 0.25))} fill="#e3ded5" />
      <polygon points={pts(P(0, 0, 0), P(0, 22, 0), P(0, 22, 0.25), P(0, 0, 0.25))} fill="#dbd5cb" />
      {/* 벽 장식: 달력·시계 */}
      <WallRect wall="back-left" a={9.6} z={2.4} len={1.8} h={2.3} fill="#ffffff" stroke="#c9c3b8" />
      <WallRect wall="back-left" a={9.6} z={4.1} len={1.8} h={0.6} fill="#2f5b4f" stroke="#2f5b4f" />
      <g transform={at(0.05, 12.6, 3.8)}>
        <ellipse rx={13} ry={15} fill="#ffffff" stroke="#3a3f47" strokeWidth={2.4} transform="skewY(30)" />
      </g>
    </g>
  );
}

// ── 대표이사실 ───────────────────────────────────────────────
function CeoOffice({ busy }) {
  const books = [];
  [1.1, 2.3, 3.5].forEach((z, row) => {
    for (let i = 0; i < 6; i += 1) {
      const y0 = 1.0 + i * 0.5 + (row % 2) * 0.12;
      const colors = ['#146b71', '#d97b3f', '#c9b79c', '#2b2f3a', '#b8622c', '#8a9a7a'];
      books.push(
        <polygon
          key={`${row}-${i}`}
          points={pts(P(0.86, y0, z), P(0.86, y0 + 0.38, z), P(0.86, y0 + 0.38, z + 0.85 - (i % 3) * 0.12), P(0.86, y0, z + 0.85 - (i % 3) * 0.12))}
          fill={colors[(i + row) % colors.length]}
        />,
      );
    }
  });
  return (
    <g>
      <Floor x={0.4} y={0.4} w={10.3} d={8.3} fill="#e7dfd2" />
      <Floor x={1.5} y={5.8} w={8.6} d={2.6} fill="#d9cdbb" opacity={0.7} />
      {/* 창문·액자 */}
      <WallRect wall="back-right" a={1.6} z={2} len={4} h={3} fill="#dcecee" stroke="#c9b79c" strokeWidth={3} />
      <polygon points={pts(P(3.6, 0.03, 2), P(3.6, 0.03, 5))} stroke="#c9b79c" strokeWidth={2} fill="none" />
      <WallRect wall="back-right" a={7} z={2.6} len={2.8} h={1.9} fill="#ffffff" stroke="#c89b6d" strokeWidth={3} />
      <g transform={at(8.4, 0.05, 3.25)}>
        <text textAnchor="middle" className="iso-wall-logo">WEWE</text>
      </g>
      {/* 책장 */}
      <Box x={0.05} y={0.8} w={0.8} d={3.6} h={4.4} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      {books}
      {[1.0, 2.2, 3.4, 4.4].map((z) => (
        <polygon key={z} points={pts(P(0.86, 0.8, z), P(0.86, 4.4, z))} stroke="#8a6a4a" strokeWidth={2} fill="none" />
      ))}
      <Plant x={10.2} y={1.1} scale={1.15} />
      {/* 소파 + 탁자 */}
      <Box x={1.0} y={5.9} w={1.2} d={2.6} h={0.75} top="#e9e6e0" left="#d8d3ca" right="#cfc9be" />
      <Box x={1.0} y={5.9} z={0.75} w={0.35} d={2.6} h={0.75} top="#e9e6e0" left="#d8d3ca" right="#d8d3ca" />
      <Box x={1.5} y={6.6} z={0.75} w={0.5} d={0.6} h={0.3} top="#7a2b2b" left="#6a2424" right="#5a1f1f" />
      <g transform={at(3.3, 7.4, 0.6)}>
        <ellipse rx={20} ry={10} fill="#efe9df" stroke="#d6cfc2" />
      </g>

      {/* 의자 등받이 → 홍현지 → 책상 */}
      <Box x={5.2} y={2.9} z={0.9} w={1.3} d={0.2} h={1.9} top="#3a3f47" left="#33373e" right="#2b2f36" />
      <Box x={5.2} y={3.1} z={0.75} w={1.3} d={1.1} h={0.16} top="#3a3f47" left="#33373e" right="#2b2f36" />
      <g transform={at(5.85, 3.75, 0.9)}>
        <g transform="scale(1.12)">
          <Character kind="ceo" seated className={busy ? 'is-busy' : ''} />
        </g>
      </g>
      <Box x={3.4} y={4.5} w={4.9} d={1.8} h={1.6} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
      {/* 책상 위: 노트북(뒷면), 서류함, 서류 더미, 머그 */}
      <Box x={5.2} y={4.75} z={1.6} w={1.3} d={0.85} h={0.05} top="#cfd3d8" left="#b9bec4" right="#aeb3b9" />
      <polygon points={pts(P(5.2, 5.6, 1.65), P(6.5, 5.6, 1.65), P(6.5, 5.6, 2.4), P(5.2, 5.6, 2.4))} fill="#c9ced4" stroke="#aeb3b9" />
      <g transform={at(5.85, 5.6, 2.02)}><circle r={3.2} fill="#ffffff" opacity={0.8} /></g>
      <Box x={7.3} y={4.7} z={1.6} w={0.8} d={0.9} h={0.18} top="#e6e2da" left="#d4cfc5" right="#c9c3b8" />
      <Box x={7.35} y={4.75} z={1.78} w={0.7} d={0.8} h={0.12} top="#ffffff" left="#f1ede6" right="#e8e3da" />
      <Box x={3.7} y={4.8} z={1.6} w={0.8} d={0.9} h={0.32} top="#ffffff" left="#f1ede6" right="#e8e3da" />
      <g transform={at(4.9, 5.9, 1.6)}>
        <rect x={-4} y={-9} width={8} height={9} rx={1.5} fill="#d97b3f" />
        <path className="iso-steam" d="M-1 -11 q-3 -4 0 -8 q3 -4 0 -8" stroke="#ffffff" strokeWidth={1.6} fill="none" opacity={0.8} />
      </g>
      {busy && (
        <g className="iso-papers">
          <g transform={at(7.7, 5.15, 1.95)}><Paper className="iso-paper iso-paper-1" /></g>
          <g transform={at(7.7, 5.15, 1.95)}><Paper className="iso-paper iso-paper-2" /></g>
        </g>
      )}
      {/* 명패 */}
      <Box x={4.3} y={6.0} z={1.6} w={1.4} d={0.2} h={0.3} top="#2b2f3a" left="#2b2f3a" right="#23272d" />
    </g>
  );
}

function CeoGlass() {
  const panel = (a, b, axis) => {
    const p = axis === 'x'
      ? [P(a, 9, 0), P(b, 9, 0), P(b, 9, 3.4), P(a, 9, 3.4)]
      : [P(11, a, 0), P(11, b, 0), P(11, b, 3.4), P(11, a, 3.4)];
    return <polygon key={`${axis}${a}`} points={pts(...p)} fill="rgba(205,228,232,0.32)" stroke="#a9bfc2" strokeWidth={1.4} />;
  };
  return (
    <g aria-hidden="true">
      {panel(0, 3, 'x')}
      {panel(3, 5.8, 'x')}
      {panel(8, 11, 'x')}
      {panel(0, 4.5, 'y')}
      {panel(4.5, 9, 'y')}
      <polygon points={pts(P(0, 9, 3.4), P(11, 9, 3.4), P(11, 0, 3.4))} fill="none" stroke="#8fa7aa" strokeWidth={2} />
    </g>
  );
}

// ── 김바름 웹 관리실 ─────────────────────────────────────────
function codeLines(x0, y, zTop, rows, widthUnits) {
  const lines = [];
  for (let i = 0; i < rows; i += 1) {
    const indent = [0, 0.12, 0.24, 0.12, 0, 0.24][i % 6];
    const len = [0.7, 0.55, 0.8, 0.4, 0.65, 0.5][i % 6] * widthUnits;
    const z = zTop - i * 0.11;
    const a = P(x0 + indent, y, z);
    const b = P(x0 + indent + len * 0.8, y, z);
    const colors = ['#7fd1c7', '#f0c9a0', '#c9d1dc', '#e9a06d', '#9fb7f0', '#c9d1dc'];
    lines.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={colors[i % 6]} strokeWidth={1.6} strokeLinecap="round" />);
  }
  return lines;
}

function WebRoom({ active }) {
  const screenClip = pts(P(14.46, 1.06, 1.74), P(15.64, 1.06, 1.74), P(15.64, 1.06, 2.37), P(14.46, 1.06, 2.37));
  return (
    <g className={active ? 'iso-web is-active' : 'iso-web'}>
      <defs>
        <clipPath id="isoCodeClip"><polygon points={screenClip} /></clipPath>
      </defs>
      <Floor x={12.4} y={0.4} w={6.6} d={5.2} fill="#e3eeec" />
      {/* 메모 보드 */}
      {[['#f6e3a1', 12.6, 4.2], ['#bfe0dc', 13.4, 4.4], ['#f2c6b4', 14.2, 4.1], ['#f6e3a1', 13.0, 3.3], ['#d9d2f0', 13.8, 3.4]].map(([c, a, z]) => (
        <WallRect key={`${a}-${z}`} wall="back-right" a={a} z={z} len={0.65} h={0.6} fill={c} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
      ))}
      {/* 서버 랙 */}
      <Box x={18.0} y={0.3} w={0.9} d={0.9} h={3.3} top="#3a3f47" left="#2b2f36" right="#23272d" />
      {[0.7, 1.2, 1.7, 2.2, 2.7].map((z, i) => (
        <g key={z} transform={at(18.25, 1.2, z)}>
          <circle className={`iso-led iso-led-${i % 3}`} r={1.8} fill={i % 2 ? '#7fd1c7' : '#f0c9a0'} />
          <circle className={`iso-led iso-led-${(i + 1) % 3}`} cx={7} cy={4} r={1.8} fill="#7fd1c7" />
        </g>
      ))}
      <Desk x={12.8} y={0.9} w={4.9} d={1.4} h={1.5} />
      {/* 모니터 3대: 홈페이지 미리보기 · 코드 · Claude */}
      <Monitor x={13.05} y={1.05} z={1.5} w={1.3} h={0.72} screen={active ? '#fbf7f1' : '#2b3340'}>
        {active && (
          <g>
            <polygon points={pts(P(13.12, 1.07, 2.32), P(14.28, 1.07, 2.32), P(14.28, 1.07, 2.1), P(13.12, 1.07, 2.1))} fill="#d97b3f" />
            <polygon points={pts(P(13.2, 1.07, 2.0), P(13.65, 1.07, 2.0), P(13.65, 1.07, 1.78), P(13.2, 1.07, 1.78))} fill="#bfe0dc" />
            <polygon points={pts(P(13.75, 1.07, 2.0), P(14.2, 1.07, 2.0), P(14.2, 1.07, 1.78), P(13.75, 1.07, 1.78))} fill="#f2e0c8" />
          </g>
        )}
      </Monitor>
      <Monitor x={14.4} y={1.05} z={1.5} w={1.3} h={0.72} screen={active ? '#1e2430' : '#2b3340'}>
        <g clipPath="url(#isoCodeClip)">
          <g className={active ? 'iso-code is-scrolling' : 'iso-code'}>
            {codeLines(14.5, 1.07, 2.32, active ? 14 : 0, 1.1)}
          </g>
        </g>
      </Monitor>
      <Monitor x={15.75} y={1.05} z={1.5} w={1.3} h={0.72} screen={active ? '#f7f3ee' : '#2b3340'}>
        {active && (
          <g>
            <g transform={at(16.05, 1.07, 2.12)}>
              <path className="iso-claude-mark" d="M0 -6 L1.3 -1.3 L6 0 L1.3 1.3 L0 6 L-1.3 1.3 L-6 0 L-1.3 -1.3 Z" fill="#d97757" />
            </g>
            {[2.24, 2.04, 1.86].map((z, i) => {
              const a = P(16.25, 1.07, z);
              const b = P(16.25 + [0.6, 0.45, 0.55][i], 1.07, z);
              return <line key={z} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#c9bfb2" strokeWidth={1.6} strokeLinecap="round" className={`iso-chat iso-chat-${i}`} />;
            })}
          </g>
        )}
      </Monitor>
      {/* 키보드·머그 */}
      <Box x={14.6} y={1.75} z={1.5} w={1.0} d={0.35} h={0.04} top="#e9e6e0" left="#d4cfc5" right="#c9c3b8" />
      <g transform={at(17.2, 2.0, 1.5)}>
        <rect x={-3.5} y={-8} width={7} height={8} rx={1.5} fill="#146b71" />
        {!active && <path className="iso-steam" d="M-1 -10 q-3 -4 0 -7 q3 -4 0 -7" stroke="#ffffff" strokeWidth={1.5} fill="none" opacity={0.8} />}
      </g>
      {/* 김바름(등을 보이고 앉음) → 의자 */}
      <g transform={at(15.05, 3.0, 0.95)}>
        <Character kind="dev" seated className={active ? 'is-typing' : 'is-resting'} />
      </g>
      <Chair x={14.65} y={2.6} color="#3a3f47" dark="#2b2f36" />
    </g>
  );
}

// ── 재단사 작업실(전투복) ───────────────────────────────────
function TailorRoom() {
  const garments = ['#1f2c4a', '#3a3f47', '#c9b79c', '#146b71', '#6b4a36', '#2b2f3a'].map((c, i) => {
    const x = 21.4 + i * 0.52;
    return (
      <g key={c + i}>
        <polygon points={pts(P(x, 1.06, 3.45), P(x + 0.05, 1.06, 3.6))} stroke="#8a6a4a" strokeWidth={1.2} fill="none" />
        <polygon points={pts(P(x - 0.22, 1.08, 3.4), P(x + 0.22, 1.08, 3.4), P(x + 0.27, 1.08, 1.5), P(x - 0.27, 1.08, 1.5))} fill={c} stroke="rgba(0,0,0,0.12)" />
      </g>
    );
  });
  return (
    <g>
      <Floor x={20.4} y={0.4} w={9.2} d={7.4} fill="#efe6da" />
      <WallRect wall="back-right" a={25} z={0.4} len={1.5} h={4} fill="#dfe9ea" stroke="#c89b6d" strokeWidth={3} />
      <WallRect wall="back-right" a={27.1} z={2} len={2.5} h={2.8} fill="#dcecee" stroke="#c9b79c" strokeWidth={3} />
      {/* 옷걸이 */}
      <Box x={21.0} y={0.8} w={3.6} d={0.5} h={0.12} top="#a87a4f" left="#8a6a4a" right="#8a6a4a" />
      <Box x={21.0} y={1.0} w={0.1} d={0.1} h={3.7} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      <Box x={24.5} y={1.0} w={0.1} d={0.1} h={3.7} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      <Box x={21.0} y={1.0} z={3.6} w={3.6} d={0.1} h={0.1} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      {garments}
      <g transform={at(24.55, 1.1, 3.5)}>
        <path className="hh-tape" d="M0 0 Q-6 18 -1 34" fill="none" stroke="#f0c9a0" strokeWidth={4} strokeLinecap="round" strokeDasharray="2 4" />
      </g>
      {/* 작업대 + 재봉틀 */}
      <Box x={26.2} y={3.2} w={3.2} d={1.3} h={1.5} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
      <Box x={27.1} y={3.45} z={1.5} w={1.3} d={0.6} h={0.22} top="#3a3f47" left="#2b2f36" right="#23272d" />
      <Box x={27.15} y={3.55} z={1.72} w={0.25} d={0.4} h={0.55} top="#3a3f47" left="#2b2f36" right="#23272d" />
      <Box x={27.15} y={3.55} z={2.27} w={1.05} d={0.4} h={0.22} top="#3a3f47" left="#2b2f36" right="#23272d" />
      <Box x={27.5} y={3.6} z={2.49} w={0.2} d={0.2} h={0.18} top="#d97b3f" left="#b8622c" right="#a0531f" />
      <g transform={at(28.05, 3.95, 2.27)}>
        <rect className="hh-needle" x={-1} y={0} width={2} height={7} fill="#c9c3b8" />
      </g>
      {/* 마네킹 */}
      <g transform={at(22.7, 5.0, 0)}>
        <ellipse rx={11} ry={4} fill="#8a6a4a" />
        <line x1={0} y1={0} x2={0} y2={-40} stroke="#8a6a4a" strokeWidth={3} />
        <path d="M-12 -64 Q0 -73 12 -64 L10 -38 L-10 -38 Z" fill="#1f2c4a" />
        <path d="M-3 -69 L0 -56 L3 -69" fill="#ffffff" />
        <circle cx={0} cy={-72} r={4} fill="#8a6a4a" />
      </g>
    </g>
  );
}

// ── 게스트룸(WEWE 스테이) ───────────────────────────────────
function GuestRoom() {
  return (
    <g>
      <Floor x={20.6} y={9.6} w={9} d={7} fill="#f3e9da" />
      <Floor x={22} y={13.4} w={4.4} d={2.6} fill="#e6c9a5" opacity={0.6} />
      <Box x={29.4} y={10.2} w={0.25} d={3.1} h={2.1} top="#a87a4f" left="#8a6a4a" right="#8a6a4a" />
      <Box x={25.4} y={10.2} w={4.0} d={3.1} h={0.7} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      <Box x={25.5} y={10.3} w={3.85} d={2.9} z={0.7} h={0.35} top="#ffffff" left="#f1ece4" right="#e6e0d6" />
      <Box x={25.5} y={11.7} w={3.0} d={1.5} z={1.05} h={0.08} top="#146b71" left="#0f5a5f" right="#0f5a5f" />
      <Box x={28.5} y={10.5} w={0.75} d={1.1} z={1.05} h={0.28} top="#f4e9da" left="#e9dcc8" right="#e2d3bc" />
      <Box x={28.5} y={11.8} w={0.75} d={1.1} z={1.05} h={0.28} top="#f4e9da" left="#e9dcc8" right="#e2d3bc" />
      <Box x={28.9} y={13.6} w={0.8} d={0.8} h={0.95} top="#c89b6d" left="#b5865a" right="#a87a4f" />
      <g transform={at(29.3, 14.0, 0.95)}>
        <circle className="hh-lamp-glow" cx={0} cy={-22} r={46} fill="url(#hhLampGlow)" />
        <rect x={-1.5} y={-12} width={3} height={12} fill="#8a6a4a" />
        <path d="M-9 -12 L9 -12 L6 -24 L-6 -24 Z" fill="#f0c9a0" />
      </g>
      <Plant x={21} y={16.4} />
      {/* 짐 받침대 */}
      <Box x={22.2} y={10.4} w={1.4} d={0.8} h={0.6} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
    </g>
  );
}

// ── 현관·우편함 ─────────────────────────────────────────────
function Porch({ lit, flagRaised }) {
  return (
    <g>
      <WallRect wall="back-left" a={16} z={0} len={2.3} h={3.8} fill="#146b71" stroke="#0f5a5f" strokeWidth={2} />
      <WallRect wall="back-left" a={16.5} z={2.3} len={1.3} h={1.0} fill="#dcecee" stroke="#0f5a5f" strokeWidth={1} />
      <g transform={at(0.05, 18.0, 1.8)}><circle r={2.5} fill="#f0c9a0" /></g>
      <g transform={at(0.05, 17.15, 4.4)}><text textAnchor="middle" className="iso-plaque">WEWE</text></g>
      <g transform={at(0.1, 18.9, 3.9)}>
        <circle className={`hh-porch-glow${lit ? ' is-lit' : ''}`} r={44} fill="url(#hhPorchGlow)" />
        <rect x={-3} y={-8} width={6} height={9} rx={1.5} fill="#2b2f3a" />
        <circle className={`hh-porch-bulb${lit ? ' is-lit' : ''}`} cy={3} r={3.4} />
      </g>
      <Floor x={0.3} y={16} w={2.2} d={2.5} fill="#d97b3f" opacity={0.65} />
      <Box x={0.3} y={13.6} w={0.9} d={1.9} h={0.8} top="#dcbd93" left="#b98a5c" right="#a87a4f" />
      <Plant x={5.4} y={14.0} />
      {/* 우편함 */}
      <Box x={2.85} y={20.55} w={0.15} d={0.15} h={1.8} top="#8a6a4a" left="#8a6a4a" right="#6b5038" />
      <Box x={2.4} y={20.25} z={1.8} w={1.05} d={0.7} h={0.55} top="#e9a06d" left="#d97b3f" right="#b8622c" />
      <g transform={at(3.45, 20.6, 2.05)}>
        <g className={`hh-flag${flagRaised ? ' is-raised' : ''}`}>
          <rect x={0} y={-18} width={2.5} height={18} fill="#6b5a48" />
          <rect x={2.5} y={-18} width={10} height={7} fill="#146b71" />
        </g>
      </g>
    </g>
  );
}

// ── 거실·차고(준비 중) ─────────────────────────────────────
function Lounge() {
  const stools = [[11.6, 14.0, '#f2b8b8'], [16.0, 14.4, '#c9d1dc'], [12.4, 17.6, '#f6e3a1'], [16.4, 17.2, '#c9d1dc']];
  return (
    <g>
      <Floor x={9} y={12.6} w={8.6} d={6.4} fill="#ebe8e2" />
      {stools.map(([x, y, c]) => (
        <g key={`${x}-${y}`} transform={at(x, y, 0)}>
          <rect x={-2} y={-14} width={4} height={14} fill="#bdb8ae" />
          <ellipse cy={-14} rx={10} ry={5} fill={c} />
        </g>
      ))}
      <g transform={at(14.1, 15.8, 0)}>
        <rect x={-3} y={-22} width={6} height={22} fill="#d6d1c8" />
        <ellipse cy={-24} rx={42} ry={21} fill="#f7f6f3" stroke="#e2ded6" />
      </g>
      <Box x={9.5} y={19.0} w={3.6} d={1.2} h={0.7} top="#ebe8e2" left="#dcd8d0" right="#d2cdc4" />
      <Box x={9.5} y={19.9} z={0.7} w={3.6} d={0.3} h={0.8} top="#ebe8e2" left="#dcd8d0" right="#d2cdc4" />
      <Box x={10.4} y={19.4} z={0.7} w={0.6} d={0.4} h={0.5} top="#7a2b2b" left="#6a2424" right="#5a1f1f" />
      <Plant x={17.8} y={20.6} scale={1.1} />
    </g>
  );
}

function Garage() {
  return (
    <g>
      <Floor x={20.6} y={18.4} w={9} d={3.3} fill="#dcd7cd" />
      {[22, 26.5].map((x) => (
        <polygon key={x} points={pts(P(x, 18.6), P(x, 21.5))} stroke="#ffffff" strokeWidth={2} fill="none" />
      ))}
      <Box x={22.4} y={19.0} w={3.4} d={1.9} h={1.5} top="#1b8088" left="#146b71" right="#0f5a5f" />
      <Box x={25.8} y={19.0} w={1.4} d={1.9} h={1.0} top="#1b8088" left="#146b71" right="#0f5a5f" />
      <polygon points={pts(P(25.8, 19.1, 1.5), P(25.8, 20.8, 1.5), P(25.8, 20.8, 1.0), P(25.8, 19.1, 1.0))} fill="#dcecee" />
      <polygon points={pts(P(22.8, 20.91, 1.35), P(25.4, 20.91, 1.35), P(25.4, 20.91, 0.85), P(22.8, 20.91, 0.85))} fill="#dcecee" opacity={0.9} />
      {[23.2, 26.4].map((x) => (
        <g key={x} transform={at(x, 20.95, 0.3)}><ellipse rx={7} ry={8} fill="#2b2f3a" /></g>
      ))}
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
          <Floor className="ev-room-glow" x={20.6} y={9.6} w={9} d={7} fill="#ffe3b5" />
          <g transform={at(27.0, 12.2, 1.15)}><WelcomeKit className="ev-drop" /></g>
        </g>
      );
    case 'arrive':
      return (
        <g className="ev ev-arrive">
          <g transform={at(20.8, 15.4, 0)}>
            <g className="iso-walk-x4">
              <Character kind={character} className="is-walking ev-arms-up" />
              <g transform="translate(13,0)"><Suitcase className="ev-putdown" /></g>
            </g>
          </g>
        </g>
      );
    case 'greet':
    case 'supporter':
      return (
        <g className={`ev ev-${anim}`}>
          <g transform={at(0.7, 17.2, 0)}>
            <g className="iso-walk-x3">
              <Character kind={character} className="is-walking ev-arms-up" />
            </g>
          </g>
        </g>
      );
    case 'letter':
      return (
        <g className="ev ev-letter">
          <g transform={at(2.9, 20.6, 2.45)}><Letter className="ev-letter-fly" /></g>
        </g>
      );
    case 'tailor':
      return (
        <g className="ev ev-tailor">
          <g transform={at(20.8, 6.6, 0)}>
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

function zonePoints(z) {
  return pts(P(z.x, z.y), P(z.x + z.w, z.y), P(z.x + z.w, z.y + z.d), P(z.x, z.y + z.d));
}

function OfficeScene({ playing, selectedRoom, onSelectRoom, paused, counters, devActivity }) {
  const activeRoom = playing?.config.room;
  const porchLit = playing?.config.anim === 'supporter';
  const flagRaised = playing?.config.anim === 'letter';
  const devActive = !!devActivity?.working;
  const n = (k) => (counters ? Number(counters[k] || 0).toLocaleString() : '-');

  const summary = Object.values(ROOMS)
    .map((r) => `${r.name}(${r.ministry}) ${r.status === 'live' ? '진행 중' : '준비 중'}`)
    .join(', ');

  return (
    <svg
      className={`hh-scene iso-scene${paused ? ' is-paused' : ''}`}
      viewBox="66 -20 1020 760"
      role="img"
      aria-label={`WEWE 하우스 사무실: ${summary}. 김바름 ${devActive ? 'Claude와 작업 중' : '대기'}.`}
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
        <filter id="isoCardShadow" x="-20%" y="-30%" width="140%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3a3226" floodOpacity="0.16" />
        </filter>
        <filter id="isoMuted">
          <feColorMatrix type="saturate" values="0.12" />
        </filter>
      </defs>

      <Shell />
      <CeoOffice busy />
      <CeoGlass />
      <WebRoom active={devActive} />
      <TailorRoom />
      <Porch lit={porchLit} flagRaised={flagRaised} />
      <g filter="url(#isoMuted)" opacity={0.62}><Lounge /></g>
      <GuestRoom />
      <g filter="url(#isoMuted)" opacity={0.62}><Garage /></g>

      {/* 천장 조명 */}
      {[[14.5, 8.5], [24.5, 8.6]].map(([x, y]) => {
        const top = P(x, y, 7);
        const bottom = P(x, y, 4.6);
        return (
          <g key={x}>
            <line x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]} stroke="#4a4a46" strokeWidth={1.2} />
            <path d={`M${bottom[0] - 13} ${bottom[1] + 10} L${bottom[0] + 13} ${bottom[1] + 10} L${bottom[0] + 4} ${bottom[1]} L${bottom[0] - 4} ${bottom[1]} Z`} fill="#6b6b66" />
          </g>
        );
      })}

      <EventLayer key={playing?.key} event={playing} />

      {/* 선택·연출 중인 구역 표시 */}
      {Object.entries(ZONES).map(([id, z]) => (
        <polygon
          key={`ring-${id}`}
          className={`iso-ring${activeRoom === id ? ' is-active' : ''}${selectedRoom === id ? ' is-selected' : ''}`}
          points={zonePoints(z)}
        />
      ))}

      {/* 이름표 */}
      <NameCard x={5.85} y={3.75} z={4.1} title="대표 홍현지" sub="대표이사실 · 근무 중" highlight />
      <Bubble x={5.85} y={3.75} z={6.0} text="• • •" className="iso-typing-bubble" />
      {devActive && <Bubble x={15.05} y={3.0} z={6.1} text="Claude와 작업 중" className="iso-dev-bubble" />}
      <NameCard x={15.05} y={3.0} z={4.45} title="김바름" sub={devActive ? '웹 관리 · 작업 중' : '웹 관리 · 대기'} />
      <NameCard x={22.6} y={4.2} z={4.6} title="재단사 작업실" sub="전투복 프로젝트 · 진행 중" />
      <NameCard x={24.5} y={12.6} z={3.6} title="게스트룸" sub={`WEWE 스테이 · 숙소 ${n('approved_stays')}`} />
      <NameCard x={2.6} y={17.4} z={4.2} title="현관 · 우편함" sub={`후원 · 소식 ${n('published_posts')}`} />
      <NameCard x={13.2} y={16.0} z={3.4} title="거실" sub="커넥트 · Poiema · 준비 중" />
      <NameCard x={25.0} y={19.9} z={3.4} title="차고" sub="레위인의 모빌리티 · 준비 중" />

      {/* 누를 수 있는 구역(맨 위) */}
      {Object.entries(ZONES).map(([id, z]) => (
        <polygon key={`hit-${id}`} className="iso-hit" points={zonePoints(z)} onClick={() => onSelectRoom(id)} />
      ))}
    </svg>
  );
}

export default OfficeScene;
