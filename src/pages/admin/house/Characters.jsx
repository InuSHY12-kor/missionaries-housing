import React from 'react';

// WEWE 하우스 캐릭터 — 뜨개 인형 느낌(크고 둥근 머리, 얼굴 없음, 목도리).
// 종류: 선교사·숙소 제공자·목회자·후원자 + 사무실 사람(대표 홍현지, 김바름).
// 발끝이 (0, 0)에 오도록 그리고, 바깥에서 translate로 위치를 정합니다.
// 팔(hc-arm-l / hc-arm-r)은 어깨를 기준으로 회전 → "두 손을 받쳐 올리는" 동작(아론과 훌)·타이핑에 씁니다.

const YARN = '#ece3d5';
const YARN_LINE = '#d8ccb8';

export const CHARACTER_COLORS = {
  missionary: { body: '#146b71', scarf: '#d97b3f', hat: '#146b71' },
  host: { body: '#d97b3f', scarf: '#8a2b2b', hat: '#c9a27a' },
  pastor: { body: '#2b2f3a', scarf: '#ffffff', hat: null },
  supporter: { body: '#b8622c', scarf: '#f2b8b8', hat: '#f2b8b8' },
  ceo: { body: '#3b4a6b', scarf: '#8a2b2b', hat: null },
  dev: { body: '#2b2f3a', scarf: '#d97b3f', hat: '#2f3e5c' },
};

function Arm({ side, color }) {
  const x = side === 'l' ? -12.5 : 8.5;
  return (
    <g className={`hc-arm hc-arm-${side}`}>
      <rect x={x} y={-27} width={4} height={13} rx={2} fill={color} />
      <circle cx={x + 2} cy={-13.5} r={2.6} fill={YARN} />
    </g>
  );
}

function Head({ kind, hat }) {
  return (
    <g className="hc-head">
      <circle cx={0} cy={-40} r={11} fill={YARN} />
      <path d="M-9 -45 Q0 -49 9 -45 M-10.5 -40 Q0 -44 10.5 -40 M-9.5 -35 Q0 -38 9.5 -35" stroke={YARN_LINE} strokeWidth={1.2} fill="none" />
      {kind === 'ceo' && (
        <path d="M-11 -40 Q-12 -53 0 -53 Q12 -53 11 -40 L11 -31 Q8 -34 8 -40 Q8 -47 0 -47 Q-8 -47 -8 -40 Q-8 -34 -11 -31 Z" fill="#4a3428" />
      )}
      {kind === 'pastor' && <path d="M-10 -44 Q0 -53 10 -44 Q6 -48 0 -48 Q-6 -48 -10 -44 Z" fill="#8c8880" />}
      {hat && kind !== 'host' && (
        <g>
          <path d="M-11 -42 Q-11 -54 0 -54 Q11 -54 11 -42 Z" fill={hat} />
          <rect x={-11.5} y={-44} width={23} height={4} rx={2} fill={hat} opacity={0.85} />
          <circle cx={0} cy={-55} r={3} fill={hat} />
        </g>
      )}
      {kind === 'host' && (
        <g>
          <ellipse cx={0} cy={-46} rx={15} ry={3.5} fill={hat} />
          <path d="M-9 -46 Q-9 -55 0 -55 Q9 -55 9 -46 Z" fill={hat} />
        </g>
      )}
      {kind === 'dev' && (
        <g>
          <path d="M-12 -40 Q-12 -55 0 -55 Q12 -55 12 -40" stroke="#2b2f36" strokeWidth={2.2} fill="none" />
          <rect x={-14} y={-43} width={4} height={8} rx={2} fill="#2b2f36" />
          <rect x={10} y={-43} width={4} height={8} rx={2} fill="#2b2f36" />
        </g>
      )}
    </g>
  );
}

export function Character({ kind = 'missionary', className = '', suit = false, seated = false }) {
  const c = CHARACTER_COLORS[kind] || CHARACTER_COLORS.missionary;
  return (
    <g className={`hc hc--${kind} ${className}`}>
      {!seated && <ellipse cx={0} cy={1} rx={11} ry={2.6} fill="rgba(28,28,26,0.14)" />}
      {!seated && (
        <>
          <rect className="hc-leg hc-leg-l" x={-6} y={-15} width={5} height={15} rx={2.2} fill={YARN} />
          <rect className="hc-leg hc-leg-r" x={1} y={-15} width={5} height={15} rx={2.2} fill={YARN} />
        </>
      )}
      <rect x={-8.5} y={-30} width={17} height={17} rx={6} fill={c.body} />
      {suit && (
        <g className="hc-suit">
          <rect x={-9} y={-30.5} width={18} height={18} rx={6} fill="#1f2c4a" />
          <path d="M-3 -30 L0 -21 L3 -30 Z" fill="#ffffff" />
          <rect x={-0.8} y={-24} width={1.6} height={5} fill="#b8622c" />
        </g>
      )}
      <path d="M-9 -30 Q0 -26 9 -30 L9 -27 Q0 -23 -9 -27 Z" fill={c.scarf} />
      {kind !== 'pastor' && <rect x={4} y={-28} width={4} height={9} rx={1.5} fill={c.scarf} />}
      {kind === 'pastor' && <rect x={-2} y={-31} width={4} height={3} rx={1} fill="#ffffff" />}
      <Arm side="l" color={suit ? '#1f2c4a' : c.body} />
      <Arm side="r" color={suit ? '#1f2c4a' : c.body} />
      <Head kind={kind} hat={c.hat} />
    </g>
  );
}

export function Suitcase({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-1} y={-16} width={12} height={4} rx={2} fill="none" stroke="#5a4636" strokeWidth={1.6} />
      <rect x={-4} y={-13} width={18} height={13} rx={3} fill="#c89b6d" />
      <rect x={-4} y={-8} width={18} height={2} fill="#a87a4f" />
    </g>
  );
}

export function WelcomeKit({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-13} y={-17} width={26} height={17} rx={2} fill="#146b71" />
      <rect x={-2} y={-17} width={4} height={17} fill="#d97b3f" />
      <rect x={-15} y={-21} width={30} height={6} rx={2} fill="#1b8088" />
      <path d="M0 -21 C-6 -29 -11 -23 0 -21 C11 -23 6 -29 0 -21 Z" fill="#d97b3f" />
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

export function Paper({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-6} y={-8} width={12} height={15} rx={1} fill="#ffffff" stroke="#d6d0c4" strokeWidth={1} />
      <path d="M-3.5 -4 H3.5 M-3.5 -1 H3.5 M-3.5 2 H1.5" stroke="#b9b2a5" strokeWidth={1} />
    </g>
  );
}
