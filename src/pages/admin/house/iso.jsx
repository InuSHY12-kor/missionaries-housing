import React from 'react';

// 아이소메트릭(비스듬히 내려다보는) 사무실 그림용 도우미.
// 바닥 좌표 (x, y)는 칸 단위, z는 높이(칸 단위). x는 화면 오른쪽 아래, y는 왼쪽 아래로 뻗습니다.
// 뒤쪽 벽은 y = 0(오른쪽 위 벽)과 x = 0(왼쪽 위 벽)에 있습니다.

export const S = 22; // 1칸의 화면 크기
export const OX = 500; // (0,0) 바닥 꼭짓점의 화면 위치
export const OY = 150;
const C = 0.866;

export function P(x, y, z = 0) {
  return [OX + (x - y) * S * C, OY + (x + y) * S * 0.5 - z * S];
}

export const pts = (...ps) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// 바닥 위 사각형 영역(러그·구역 표시 등)
export function Floor({ x, y, w, d, z = 0, fill, stroke, strokeWidth, className, opacity }) {
  return (
    <polygon
      className={className}
      points={pts(P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z))}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
}

// 상자: w는 x 방향, d는 y 방향, h는 높이. top/left/right는 각 면의 색.
// left 면 = y + d 쪽(화면 왼쪽 아래), right 면 = x + w 쪽(화면 오른쪽 아래)
export function Box({ x, y, z = 0, w, d, h, top, left, right, className, stroke = 'rgba(60,50,40,0.12)' }) {
  return (
    <g className={className}>
      <polygon points={pts(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h))} fill={left} stroke={stroke} strokeWidth={0.6} />
      <polygon points={pts(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h))} fill={right} stroke={stroke} strokeWidth={0.6} />
      <polygon points={pts(P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h))} fill={top} stroke={stroke} strokeWidth={0.6} />
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

// 책상(흰 상판 + 회색 옆판) — 앞쪽(+y)을 보고 앉는 자리
export function Desk({ x, y, w = 2.6, d = 1.3, h = 1.5, top = '#fbfaf7', side = '#e6e2da', dark = '#d4cfc5' }) {
  return (
    <g>
      <Box x={x} y={y} w={0.12} d={d} h={h - 0.08} top={side} left={side} right={dark} />
      <Box x={x + w - 0.12} y={y} w={0.12} d={d} h={h - 0.08} top={side} left={side} right={dark} />
      <Box x={x} y={y} w={w} d={0.1} h={h - 0.08} top={side} left={dark} right={dark} />
      <Box x={x} y={y} z={h - 0.08} w={w} d={d} h={0.08} top={top} left={side} right={dark} />
    </g>
  );
}

// 모니터(뒷면이 보이는 방향이 아니라, 화면이 앞(+y)을 향하게)
export function Monitor({ x, y, z, w = 1.1, h = 0.75, screen = '#2b3340', className, children }) {
  const p = [P(x, y, z + 0.18), P(x + w, y, z + 0.18), P(x + w, y, z + 0.18 + h), P(x, y, z + 0.18 + h)];
  const stand = P(x + w / 2, y, z);
  const neck = P(x + w / 2, y, z + 0.2);
  return (
    <g className={className}>
      <line x1={stand[0]} y1={stand[1]} x2={neck[0]} y2={neck[1]} stroke="#9a958c" strokeWidth={3} />
      <polygon points={pts(...p)} fill="#3a3f47" stroke="#2b2f36" strokeWidth={1} />
      <polygon points={pts(
        P(x + 0.06, y + 0.01, z + 0.24), P(x + w - 0.06, y + 0.01, z + 0.24),
        P(x + w - 0.06, y + 0.01, z + 0.12 + h), P(x + 0.06, y + 0.01, z + 0.12 + h),
      )} fill={screen} />
      {children}
    </g>
  );
}

export function Chair({ x, y, color = '#d9d5cd', dark = '#bdb8ae' }) {
  return (
    <g>
      <Box x={x + 0.35} y={y + 0.35} w={0.1} d={0.1} h={0.8} top={dark} left={dark} right={dark} />
      <Box x={x} y={y} z={0.8} w={0.8} d={0.8} h={0.14} top={color} left={dark} right={dark} />
      <Box x={x} y={y + 0.7} z={0.94} w={0.8} d={0.12} h={0.9} top={color} left={color} right={dark} />
    </g>
  );
}

export function Plant({ x, y, scale = 1 }) {
  const [cx, cy] = P(x, y, 0);
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      <path d="M-9 0 L9 0 L7 -14 L-7 -14 Z" fill="#c9784a" />
      <path d="M0 -14 C-18 -24 -16 -42 -4 -46 C-2 -34 -2 -24 0 -14 Z" fill="#5f8f5f" />
      <path d="M0 -14 C16 -22 20 -40 6 -48 C2 -36 2 -24 0 -14 Z" fill="#4f7f52" />
      <path d="M0 -14 C-6 -30 0 -52 2 -58 C6 -44 6 -28 0 -14 Z" fill="#6a9d68" />
    </g>
  );
}

// 이름표(레퍼런스의 흰 말풍선 카드). (x, y, z)는 붙일 위치, 카드는 그 위에 가운데 정렬
export function NameCard({ x, y, z = 3.6, title, sub, highlight = false, className = '' }) {
  const [cx, cy] = P(x, y, z);
  const width = Math.max(title.length * 12.5, (sub || '').length * 9.5) + 22;
  return (
    <g className={`iso-card ${className}`} transform={`translate(${cx},${cy})`}>
      <rect x={-width / 2} y={-34} width={width} height={sub ? 36 : 24} rx={7} fill="#ffffff" stroke={highlight ? '#2b2f36' : 'rgba(0,0,0,0.08)'} strokeWidth={highlight ? 2 : 1} filter="url(#isoCardShadow)" />
      <text x={0} y={-17} textAnchor="middle" className="iso-card-title">{title}</text>
      {sub && <text x={0} y={-4} textAnchor="middle" className="iso-card-sub">{sub}</text>}
    </g>
  );
}

export function Bubble({ x, y, z = 4.6, text, className = '' }) {
  const [cx, cy] = P(x, y, z);
  const width = text.length * 12 + 26;
  // 위치(transform 속성)와 움직임(CSS 애니메이션)을 다른 g에 둡니다 — CSS transform이 속성을 덮어쓰기 때문
  return (
    <g transform={`translate(${cx},${cy})`}>
      <g className={`iso-bubble ${className}`}>
        <rect x={-width / 2} y={-30} width={width} height={28} rx={14} fill="#ffffff" filter="url(#isoCardShadow)" />
        <path d="M-6 -3 L0 6 L6 -3 Z" fill="#ffffff" />
        <text x={0} y={-11} textAnchor="middle" className="iso-bubble-text">{text}</text>
      </g>
    </g>
  );
}
