import React from 'react';

// 아이소메트릭(비스듬히 내려다보는) 사무실 그림용 도우미 (2026-10-21 실사 느낌 개편).
// 바닥 좌표 (x, y)는 칸 단위, z는 높이(칸 단위). x는 화면 오른쪽 아래, y는 왼쪽 아래로 뻗습니다.
// 뒤쪽 벽은 y = 0(오른쪽 위, 큰 창)과 x = 0(왼쪽 위)에 있습니다.
// 실사 느낌: 면마다 빛 방향에 맞춘 그라데이션(윗면 하이라이트·옆면 음영)과 바닥 물체의 부드러운 그림자.

export const S = 22; // 1칸의 화면 크기
export const OX = 545; // (0,0) 바닥 꼭짓점의 화면 위치(바닥 36 × 27칸 기준)
export const OY = 165;
const C = 0.866;

export function P(x, y, z = 0) {
  return [OX + (x - y) * S * C, OY + (x + y) * S * 0.5 - z * S];
}

export const pts = (...ps) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// 장면 공통 정의(그라데이션·필터) — OfficeScene의 <defs> 안에 한 번
export function IsoDefs() {
  return (
    <>
      <linearGradient id="isoSheenTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="isoShadeLeft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
      </linearGradient>
      <linearGradient id="isoShadeRight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.26" />
      </linearGradient>
      <linearGradient id="isoGlass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e8f3f5" stopOpacity="0.32" />
        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.34" />
        <stop offset="100%" stopColor="#d4e4e8" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="isoSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#dbe9f0" />
        <stop offset="100%" stopColor="#f4f1e8" />
      </linearGradient>
      <filter id="isoSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.2" />
      </filter>
      <filter id="isoSunBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
      {/* 콘크리트 바닥 질감(미세한 얼룩) */}
      <filter id="isoConcrete" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.41  0 0 0 0 0.39  0 0 0 0.16 0" result="spots" />
        <feComposite in="spots" in2="SourceGraphic" operator="in" result="clipped" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="clipped" /></feMerge>
      </filter>
      <filter id="isoCardShadow" x="-20%" y="-30%" width="140%" height="180%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1c1814" floodOpacity="0.22" />
      </filter>
    </>
  );
}

// 바닥 위 사각형 영역(러그·구역 표시 등)
export function Floor({ x, y, w, d, z = 0, fill, stroke, strokeWidth, className, opacity, filter }) {
  return (
    <polygon
      className={className}
      points={pts(P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z))}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      filter={filter}
    />
  );
}

// 상자: w는 x 방향, d는 y 방향, h는 높이. top/left/right는 각 면의 기본색.
// left 면 = y + d 쪽(화면 왼쪽 아래), right 면 = x + w 쪽(화면 오른쪽 아래)
// 바닥에 놓인 상자(z = 0)는 부드러운 그림자를 함께 그립니다(shadow={false}로 끔).
export function Box({ x, y, z = 0, w, d, h, top, left, right, className, stroke = 'rgba(40,34,28,0.14)', shadow = true, gloss = true }) {
  const fLeft = pts(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h));
  const fRight = pts(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h));
  const fTop = pts(P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h));
  return (
    <g className={className}>
      {shadow && z === 0 && (
        <polygon
          points={pts(P(x + 0.05, y + 0.2), P(x + w + 0.25, y + 0.2), P(x + w + 0.25, y + d + 0.45), P(x + 0.05, y + d + 0.45))}
          fill="rgba(30,24,18,0.26)"
          filter="url(#isoSoftShadow)"
        />
      )}
      <polygon points={fLeft} fill={left} stroke={stroke} strokeWidth={0.6} />
      {gloss && <polygon points={fLeft} fill="url(#isoShadeLeft)" />}
      <polygon points={fRight} fill={right} stroke={stroke} strokeWidth={0.6} />
      {gloss && <polygon points={fRight} fill="url(#isoShadeRight)" />}
      <polygon points={fTop} fill={top} stroke={stroke} strokeWidth={0.6} />
      {gloss && <polygon points={fTop} fill="url(#isoSheenTop)" />}
    </g>
  );
}

// 뒤쪽 벽에 붙은 평면(액자·창문·게시판 등). wall: 'back-right'(y=0 벽) | 'back-left'(x=0 벽)
export function WallRect({ wall, a, z, len, h, fill, stroke, strokeWidth = 1.5, className, inset = 0.02 }) {
  const p = wall === 'back-right'
    ? [P(a, inset, z), P(a + len, inset, z), P(a + len, inset, z + h), P(a, inset, z + h)]
    : [P(inset, a, z), P(inset, a + len, z), P(inset, a + len, z + h), P(inset, a, z + h)];
  return <polygon className={className} points={pts(...p)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

// 유리 칸막이(검은 프레임) — axis 'x'면 y=at 선을 따라 a~b, 'y'면 x=at 선을 따라 a~b
export function GlassWall({ axis, at, a, b, h = 3.4, mullion = 2.2 }) {
  const q = (t, z) => (axis === 'x' ? P(t, at, z) : P(at, t, z));
  const panes = [];
  const count = Math.max(1, Math.round((b - a) / mullion));
  const step = (b - a) / count;
  for (let i = 0; i < count; i += 1) {
    const s = a + i * step;
    const e = s + step;
    panes.push(<polygon key={i} points={pts(q(s, 0), q(e, 0), q(e, h), q(s, h))} fill="url(#isoGlass)" />);
    const m0 = q(s, 0);
    const m1 = q(s, h);
    panes.push(<line key={`m${i}`} x1={m0[0]} y1={m0[1]} x2={m1[0]} y2={m1[1]} stroke="#26262a" strokeWidth={2} />);
  }
  const e0 = q(b, 0);
  const e1 = q(b, h);
  const t0 = q(a, h);
  const b0 = q(a, 0);
  return (
    <g aria-hidden="true">
      {panes}
      <line x1={e0[0]} y1={e0[1]} x2={e1[0]} y2={e1[1]} stroke="#26262a" strokeWidth={2} />
      <line x1={t0[0]} y1={t0[1]} x2={e1[0]} y2={e1[1]} stroke="#26262a" strokeWidth={2.4} />
      <line x1={b0[0]} y1={b0[1]} x2={e0[0]} y2={e0[1]} stroke="#26262a" strokeWidth={1.6} />
    </g>
  );
}

// 책상(흰 상판 + 흰 옆판) — 레퍼런스의 화이트 데스크
export function Desk({ x, y, w = 2.6, d = 1.3, h = 1.5, top = '#fbfbfa', side = '#eeeeec', dark = '#d9d8d4' }) {
  return (
    <g>
      <Box x={x} y={y} w={0.12} d={d} h={h - 0.08} top={side} left={side} right={dark} />
      <Box x={x + w - 0.12} y={y} w={0.12} d={d} h={h - 0.08} top={side} left={side} right={dark} />
      <Box x={x} y={y} w={w} d={0.1} h={h - 0.08} top={side} left={dark} right={dark} shadow={false} />
      <Box x={x} y={y} z={h - 0.08} w={w} d={d} h={0.08} top={top} left={side} right={dark} />
    </g>
  );
}

// 모니터(화면이 앞(+y)을 향함)
export function Monitor({ x, y, z, w = 1.1, h = 0.75, screen = '#2b3340', className, children }) {
  const p = [P(x, y, z + 0.18), P(x + w, y, z + 0.18), P(x + w, y, z + 0.18 + h), P(x, y, z + 0.18 + h)];
  const stand = P(x + w / 2, y, z);
  const neck = P(x + w / 2, y, z + 0.2);
  return (
    <g className={className}>
      <line x1={stand[0]} y1={stand[1]} x2={neck[0]} y2={neck[1]} stroke="#4a4a4e" strokeWidth={3} />
      <polygon points={pts(...p)} fill="#1c1c20" stroke="#0f0f12" strokeWidth={1} />
      <polygon points={pts(
        P(x + 0.06, y + 0.01, z + 0.24), P(x + w - 0.06, y + 0.01, z + 0.24),
        P(x + w - 0.06, y + 0.01, z + 0.12 + h), P(x + 0.06, y + 0.01, z + 0.12 + h),
      )} fill={screen} />
      {children}
      <polygon points={pts(P(x + 0.06, y + 0.012, z + 0.12 + h), P(x + w * 0.45, y + 0.012, z + 0.12 + h), P(x + w * 0.25, y + 0.012, z + 0.24), P(x + 0.06, y + 0.012, z + 0.24))} fill="#ffffff" opacity={0.07} />
    </g>
  );
}

// 사무용 메쉬 의자(검정) — 등받이가 +y(앞) 쪽
export function Chair({ x, y, color = '#2e2e33', dark = '#1e1e22' }) {
  const base = P(x + 0.4, y + 0.4, 0.08);
  return (
    <g>
      <ellipse cx={base[0]} cy={base[1] + 4} rx={15} ry={6} fill="rgba(30,24,18,0.22)" filter="url(#isoSoftShadow)" />
      {[[-11, 3], [11, 3], [0, 7], [-7, -2], [7, -2]].map(([dx, dy]) => (
        <line key={`${dx}${dy}`} x1={base[0]} y1={base[1]} x2={base[0] + dx} y2={base[1] + dy} stroke="#3a3a3e" strokeWidth={2.2} strokeLinecap="round" />
      ))}
      <Box x={x + 0.35} y={y + 0.35} w={0.1} d={0.1} h={0.8} top={dark} left={dark} right={dark} shadow={false} />
      <Box x={x} y={y} z={0.8} w={0.8} d={0.8} h={0.14} top={color} left={dark} right={dark} />
      <Box x={x} y={y + 0.7} z={0.94} w={0.8} d={0.12} h={0.95} top={color} left={color} right={dark} />
    </g>
  );
}

// 화분(잎을 여러 겹으로, 빛 받는 쪽이 밝게)
export function Plant({ x, y, scale = 1 }) {
  const [cx, cy] = P(x, y, 0);
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      <ellipse cx={3} cy={2} rx={14} ry={5} fill="rgba(30,24,18,0.25)" filter="url(#isoSoftShadow)" />
      <path d="M-9 0 L9 0 L7.5 -15 L-7.5 -15 Z" fill="#ece9e3" />
      <path d="M2 0 L9 0 L7.5 -15 L2 -15 Z" fill="#d6d2ca" />
      <ellipse cx={0} cy={-15} rx={7.5} ry={2.2} fill="#5a4a3a" />
      <path d="M0 -15 C-20 -24 -20 -44 -6 -50 C-3 -36 -3 -26 0 -15 Z" fill="#3f7a46" />
      <path d="M0 -15 C18 -22 22 -42 8 -52 C3 -38 3 -26 0 -15 Z" fill="#2f6638" />
      <path d="M0 -15 C-7 -32 -1 -56 2 -62 C7 -48 7 -30 0 -15 Z" fill="#4f9258" />
      <path d="M0 -15 C-14 -18 -24 -30 -22 -36 C-14 -30 -8 -24 0 -15 Z" fill="#5aa362" />
      <path d="M0 -15 C12 -16 22 -26 22 -32 C14 -28 8 -22 0 -15 Z" fill="#3c8547" />
      <path d="M-4 -40 C-3 -32 -2 -24 0 -15" stroke="#7cc283" strokeWidth={0.8} fill="none" opacity={0.6} />
    </g>
  );
}

// 이름표 카드(현재 좌표계의 (0, dy) 위) — 글자를 키우고 대비를 높여 읽기 쉽게
export function Card({ title, sub, dy = 0, highlight = false, dim = false, className = '' }) {
  const width = Math.max(title.length * 15, (sub || '').length * 11.6) + 28;
  const height = sub ? 44 : 30;
  return (
    <g className={`iso-card ${className}`} transform={`translate(0,${dy})`}>
      <rect x={-width / 2} y={-height + 2} width={width} height={height} rx={9} fill={dim ? '#ecebe8' : '#ffffff'} stroke={highlight ? '#1c1c1a' : 'rgba(0,0,0,0.1)'} strokeWidth={highlight ? 2.2 : 1} filter="url(#isoCardShadow)" />
      <text x={0} y={sub ? -height + 21 : -8} textAnchor="middle" className="iso-card-title">{title}</text>
      {sub && <text x={0} y={-5} textAnchor="middle" className="iso-card-sub">{sub}</text>}
    </g>
  );
}

export function NameCard({ x, y, z = 3.6, ...rest }) {
  const [cx, cy] = P(x, y, z);
  return (
    <g transform={`translate(${cx},${cy})`}>
      <Card {...rest} />
    </g>
  );
}

export function Bubble({ x, y, z = 4.6, text, className = '' }) {
  const [cx, cy] = P(x, y, z);
  const width = text.length * 14 + 30;
  // 위치(transform 속성)와 움직임(CSS 애니메이션)을 다른 g에 둡니다 — CSS transform이 속성을 덮어쓰기 때문
  return (
    <g transform={`translate(${cx},${cy})`}>
      <g className={`iso-bubble ${className}`}>
        <rect x={-width / 2} y={-34} width={width} height={32} rx={16} fill="#ffffff" filter="url(#isoCardShadow)" />
        <path d="M-7 -3 L0 7 L7 -3 Z" fill="#ffffff" />
        <text x={0} y={-12.5} textAnchor="middle" className="iso-bubble-text">{text}</text>
      </g>
    </g>
  );
}
