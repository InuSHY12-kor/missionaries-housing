import React from 'react';

// WEWE 하우스 캐릭터 4종(선교사·숙소 제공자·목회자·후원자)과 소품.
// 모든 캐릭터는 발끝이 (0, 0)에 오도록 그립니다(바깥에서 translate로 위치 지정).
// 팔(hc-arm-l / hc-arm-r)은 어깨를 기준으로 회전하므로, CSS에서 "두 손을 받쳐 올리는" 동작
// (WEWE 로고의 아래에서 위로 올리는 두 손 — 아론과 훌)을 만들 수 있습니다.

const SKIN = '#f1cfae';
const HAIR = '#4a3a2c';

export const CHARACTER_COLORS = {
  missionary: { body: '#146b71', legs: '#33433f' },
  host: { body: '#d97b3f', legs: '#5a4636' },
  pastor: { body: '#2b2f3a', legs: '#2b2f3a' },
  supporter: { body: '#b8622c', legs: '#4a3a2c' },
};

function Arm({ side, color }) {
  const x = side === 'l' ? -15 : 10;
  return (
    <g className={`hc-arm hc-arm-${side}`}>
      <rect x={x} y={-42} width={5} height={20} rx={2.5} fill={color} />
      <circle cx={x + 2.5} cy={-21} r={2.8} fill={SKIN} />
    </g>
  );
}

export function Character({ kind = 'missionary', className = '', suit = false }) {
  const c = CHARACTER_COLORS[kind] || CHARACTER_COLORS.missionary;
  return (
    <g className={`hc hc--${kind} ${className}`}>
      <ellipse cx={0} cy={1} rx={12} ry={2.6} fill="rgba(28,28,26,0.14)" />
      <rect className="hc-leg hc-leg-l" x={-7} y={-18} width={5} height={18} rx={2} fill={c.legs} />
      <rect className="hc-leg hc-leg-r" x={2} y={-18} width={5} height={18} rx={2} fill={c.legs} />
      <path d="M-10 -16 L-10 -37 Q-10 -44 -3 -44 L3 -44 Q10 -44 10 -37 L10 -16 Z" fill={c.body} />

      {kind === 'host' && <rect x={-6} y={-36} width={12} height={18} rx={2} fill="#fff7ee" opacity={0.9} />}
      {kind === 'pastor' && <rect x={-2.5} y={-44} width={5} height={4} rx={1} fill="#ffffff" />}
      {kind === 'supporter' && (
        <path d="M0 -26 C-5 -30 -6 -35 -2.5 -36 C-1 -36.4 0 -35.2 0 -34.3 C0 -35.2 1 -36.4 2.5 -36 C6 -35 5 -30 0 -26 Z" fill="#ffffff" />
      )}
      {kind === 'missionary' && <path d="M-7 -43 L5 -18" stroke="#0e4f53" strokeWidth={2} strokeLinecap="round" />}

      {/* 전투복(맞춤 양복) — 재단사 작업실 연출에서 서서히 나타납니다 */}
      {suit && (
        <g className="hc-suit">
          <path d="M-11 -15 L-11 -37 Q-11 -45 -3 -45 L3 -45 Q11 -45 11 -37 L11 -15 Z" fill="#1f2c4a" />
          <path d="M-3 -45 L0 -32 L3 -45" fill="#ffffff" />
          <path d="M-3 -45 L-6 -36 L0 -32 M3 -45 L6 -36 L0 -32" stroke="#3a4a6e" strokeWidth={1.2} fill="none" />
          <rect x={-1} y={-33} width={2} height={6} fill="#b8622c" />
        </g>
      )}

      <Arm side="l" color={c.body} />
      <Arm side="r" color={c.body} />
      <circle cx={0} cy={-52} r={8} fill={SKIN} />
      <path d="M-8 -53 Q-8 -61 0 -61 Q8 -61 8 -53 Q4 -57 -8 -53 Z" fill={kind === 'pastor' ? '#6b6b6b' : HAIR} />
    </g>
  );
}

export function Suitcase({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-1} y={-17} width={14} height={4} rx={2} fill="none" stroke="#5a4636" strokeWidth={1.6} />
      <rect x={-4} y={-14} width={20} height={14} rx={3} fill="#c89b6d" />
      <rect x={-4} y={-8} width={20} height={2} fill="#a87a4f" />
    </g>
  );
}

export function WelcomeKit({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-14} y={-18} width={28} height={18} rx={2} fill="#146b71" />
      <rect x={-2} y={-18} width={4} height={18} fill="#d97b3f" />
      <rect x={-16} y={-22} width={32} height={6} rx={2} fill="#1b8088" />
      <path d="M0 -22 C-6 -30 -11 -24 0 -22 C11 -24 6 -30 0 -22 Z" fill="#d97b3f" />
    </g>
  );
}

export function Letter({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-11} y={-8} width={22} height={15} rx={1.5} fill="#ffffff" stroke="#b8622c" strokeWidth={1.4} />
      <path d="M-11 -8 L0 1 L11 -8" fill="none" stroke="#b8622c" strokeWidth={1.4} />
    </g>
  );
}
