import React from 'react';

// WEWE 하우스 캐릭터 — 3D 느낌의 SD(2.5등신) 캐릭터 (2026-10-20 개편).
// 큰 머리·짧은 몸, 그라데이션 음영(위 왼쪽이 밝고 아래 오른쪽이 어두움)과 하이라이트로 입체감을 냅니다.
// 발끝이 (0, 0)에 오도록 그리고 바깥에서 translate로 위치를 정합니다.
// 팔(hc-arm-l / hc-arm-r)은 어깨 기준 회전 → "두 손을 받쳐 올리는" 동작(아론과 훌)·타이핑·작업 동작에 씁니다.
// 그라데이션 정의(<CharacterDefs />)는 SVG의 <defs> 안에 한 번 넣어야 합니다.

const KINDS = {
  missionary: { body: ['#35a1a5', '#0f5a5f'], hair: ['#5a4030', '#2e2018'], style: 'beanie', hat: ['#2a8a8f', '#0f5a5f'] },
  host: { body: ['#f4a868', '#c9692c'], hair: ['#6a4630', '#3a2618'], style: 'hat', hat: ['#e6c49a', '#b8925f'] },
  pastor: { body: ['#47506a', '#1f2430'], hair: ['#b9b4ab', '#7d786f'], style: 'short', glasses: true },
  supporter: { body: ['#e8915c', '#a8501f'], hair: ['#4a3428', '#24180f'], style: 'beanie', hat: ['#f8c4cc', '#e08c9c'] },
  ceo: { body: ['#566a96', '#2c3a58'], hair: ['#6e4630', '#3a2216'], style: 'bob' },
  dev: { body: ['#47506a', '#20252f'], hair: ['#3a302a', '#15100c'], style: 'short', headset: true },
  tailor: { body: ['#d8c6a8', '#9c8a6e'], hair: ['#5a3a28', '#2a1a10'], style: 'bun', apron: true },
  stay: { body: ['#3bb3aa', '#13716b'], hair: ['#7a5236', '#3e2616'], style: 'ponytail' },
  donation: { body: ['#f0aa72', '#c06a35'], hair: ['#4a3428', '#20150d'], style: 'curly', heart: true },
};

export const CHARACTER_KINDS = Object.keys(KINDS);

function Grad({ id, c, radial }) {
  if (radial) {
    return (
      <radialGradient id={id} cx="0.35" cy="0.3" r="0.85">
        <stop offset="0%" stopColor={c[0]} />
        <stop offset="100%" stopColor={c[1]} />
      </radialGradient>
    );
  }
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={c[0]} />
      <stop offset="100%" stopColor={c[1]} />
    </linearGradient>
  );
}

export function CharacterDefs() {
  return (
    <>
      <Grad id="sd-skin" c={['#ffeee2', '#f1bc9c']} radial />
      <Grad id="sd-pants" c={['#5a5a66', '#2f2f38']} />
      <Grad id="sd-shoe" c={['#5a4a44', '#2a201c']} />
      {Object.entries(KINDS).map(([k, v]) => (
        <React.Fragment key={k}>
          <Grad id={`sd-body-${k}`} c={v.body} />
          <Grad id={`sd-hair-${k}`} c={v.hair} radial />
          {v.hat && <Grad id={`sd-hat-${k}`} c={v.hat} radial />}
        </React.Fragment>
      ))}
    </>
  );
}

function Arm({ side, kind }) {
  const x = side === 'l' ? -15 : 10;
  return (
    <g className={`hc-arm hc-arm-${side}`}>
      <rect x={x} y={-26} width={5} height={13} rx={2.5} fill={`url(#sd-body-${kind})`} />
      <circle cx={x + 2.5} cy={-12.5} r={3.3} fill="url(#sd-skin)" />
    </g>
  );
}

function Hair({ kind, style, back }) {
  const fill = `url(#sd-hair-${kind})`;
  if (back) return <circle cx={0} cy={-42} r={16.6} fill={fill} />;
  switch (style) {
    case 'bob':
      return <path d="M-16.8 -42 Q-18.5 -62 0 -62 Q18.5 -62 16.8 -42 L16.5 -29 Q12.5 -27 11.5 -33 Q12.5 -49 0 -51 Q-12.5 -49 -11.5 -33 Q-12.5 -27 -16.5 -29 Z" fill={fill} />;
    case 'bun':
      return (
        <g>
          <circle cx={0} cy={-62} r={6} fill={fill} />
          <path d="M-16.5 -42 Q-17.5 -61 0 -61 Q17.5 -61 16.5 -42 Q12 -51 0 -51.5 Q-12 -51 -16.5 -42 Z" fill={fill} />
        </g>
      );
    case 'ponytail':
      return (
        <g>
          <path d="M13 -50 Q24 -44 18 -30 Q16 -38 12 -42 Z" fill={fill} />
          <path d="M-16.5 -42 Q-17.5 -61 0 -61 Q17.5 -61 16.5 -42 Q12 -51 0 -51.5 Q-12 -51 -16.5 -42 Z" fill={fill} />
        </g>
      );
    case 'curly':
      return (
        <g fill={fill}>
          {[-13, -7, 0, 7, 13].map((x, i) => <circle key={x} cx={x} cy={-54 + (i % 2) * 2 - (x === 0 ? 3 : 0)} r={6.5} />)}
          <path d="M-16.5 -42 Q-15 -50 -10 -52 L10 -52 Q15 -50 16.5 -42 Q12 -49 0 -49.5 Q-12 -49 -16.5 -42 Z" />
        </g>
      );
    default:
      return <path d="M-16.5 -42 Q-17.5 -61 0 -61 Q17.5 -61 16.5 -42 Q12 -51 0 -51.5 Q-12 -51 -16.5 -42 Z" fill={fill} />;
  }
}

function Face({ glasses }) {
  return (
    <g>
      <ellipse cx={-5.6} cy={-40} rx={2.3} ry={3} fill="#2b2220" />
      <ellipse cx={5.6} cy={-40} rx={2.3} ry={3} fill="#2b2220" />
      <circle cx={-4.9} cy={-41.3} r={0.9} fill="#ffffff" />
      <circle cx={6.3} cy={-41.3} r={0.9} fill="#ffffff" />
      <ellipse cx={-9.5} cy={-35} rx={3.2} ry={1.8} fill="#f49a9a" opacity={0.5} />
      <ellipse cx={9.5} cy={-35} rx={3.2} ry={1.8} fill="#f49a9a" opacity={0.5} />
      <path d="M-2.2 -34.2 Q0 -32.4 2.2 -34.2" stroke="#9a5240" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {glasses && (
        <g stroke="#3a3530" strokeWidth={1.1} fill="none">
          <circle cx={-5.6} cy={-40} r={4.4} />
          <circle cx={5.6} cy={-40} r={4.4} />
          <path d="M-1.2 -40 L1.2 -40" />
        </g>
      )}
    </g>
  );
}

function Hat({ kind, style }) {
  const fill = `url(#sd-hat-${kind})`;
  if (style === 'hat') {
    return (
      <g>
        <ellipse cx={0} cy={-51} rx={21} ry={5} fill={fill} />
        <path d="M-12 -51 Q-12 -64 0 -64 Q12 -64 12 -51 Z" fill={fill} />
      </g>
    );
  }
  return (
    <g>
      <path d="M-16.8 -44 Q-17.5 -63 0 -63 Q17.5 -63 16.8 -44 Z" fill={fill} />
      <rect x={-17.5} y={-47} width={35} height={6} rx={3} fill={fill} />
      <circle cx={0} cy={-64} r={4} fill={fill} />
    </g>
  );
}

export function Character({ kind = 'missionary', className = '', suit = false, seated = false, back = false }) {
  const k = KINDS[kind] ? kind : 'missionary';
  const v = KINDS[k];
  return (
    <g className={`hc hc--${k} ${className}`}>
      {!seated && <ellipse cx={0} cy={1} rx={13} ry={3.6} fill="rgba(28,24,20,0.2)" />}
      {!seated && (
        <>
          <g className="hc-leg hc-leg-l">
            <rect x={-7.5} y={-12} width={6.5} height={11} rx={3} fill="url(#sd-pants)" />
            <ellipse cx={-4.3} cy={-1.2} rx={4.6} ry={2.8} fill="url(#sd-shoe)" />
          </g>
          <g className="hc-leg hc-leg-r">
            <rect x={1} y={-12} width={6.5} height={11} rx={3} fill="url(#sd-pants)" />
            <ellipse cx={4.3} cy={-1.2} rx={4.6} ry={2.8} fill="url(#sd-shoe)" />
          </g>
        </>
      )}
      <path d="M-11 -10 Q-12 -27 0 -28 Q12 -27 11 -10 Q0 -6 -11 -10 Z" fill={`url(#sd-body-${k})`} />
      {v.apron && <path d="M-7 -24 L7 -24 L8 -9 Q0 -7 -8 -9 Z" fill="#fbf6ee" opacity={0.95} />}
      {v.apron && <path d="M-10 -27 Q-4 -20 0 -27 Q4 -20 10 -27" stroke="#f0c9a0" strokeWidth={1.6} fill="none" strokeDasharray="1.5 1.5" />}
      {v.heart && !back && <path d="M0 -14 C-5 -18 -6 -23 -2.6 -24 C-1 -24.4 0 -23.2 0 -22.3 C0 -23.2 1 -24.4 2.6 -24 C6 -23 5 -18 0 -14 Z" fill="#ffffff" opacity={0.9} />}
      {k === 'pastor' && !back && <rect x={-2.2} y={-28.5} width={4.4} height={3.4} rx={1} fill="#ffffff" />}
      {suit && (
        <g className="hc-suit">
          <path d="M-11.5 -10 Q-12.5 -27.5 0 -28.5 Q12.5 -27.5 11.5 -10 Q0 -6 -11.5 -10 Z" fill="#1f2c4a" />
          <path d="M-3.5 -28 L0 -18 L3.5 -28 Z" fill="#ffffff" />
          <rect x={-0.9} y={-22} width={1.8} height={6} fill="#b8622c" />
        </g>
      )}
      <ellipse cx={-4} cy={-21} rx={4} ry={3} fill="#ffffff" opacity={0.16} />
      <Arm side="l" kind={k} />
      <Arm side="r" kind={k} />
      <g className="hc-head">
        <circle cx={0} cy={-42} r={16} fill="url(#sd-skin)" />
        {!back && <Face glasses={v.glasses} />}
        <Hair kind={k} style={v.style} back={back} />
        {v.hat && <Hat kind={k} style={v.style} />}
        {v.headset && (
          <g>
            <path d="M-17 -42 Q-17 -64 0 -64 Q17 -64 17 -42" stroke="#2b2f36" strokeWidth={2.6} fill="none" />
            <rect x={-20} y={-46} width={5} height={10} rx={2.5} fill="#2b2f36" />
            <rect x={15} y={-46} width={5} height={10} rx={2.5} fill="#2b2f36" />
          </g>
        )}
        <ellipse cx={-6} cy={-51} rx={5} ry={2.6} fill="#ffffff" opacity={0.22} />
      </g>
    </g>
  );
}

export function Suitcase({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-1} y={-17} width={12} height={4} rx={2} fill="none" stroke="#5a4636" strokeWidth={1.6} />
      <rect x={-4} y={-14} width={18} height={14} rx={3} fill="#c89b6d" />
      <rect x={-4} y={-14} width={6} height={14} rx={3} fill="#d9b085" />
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

export function Heart({ className = '' }) {
  return (
    <g className={className}>
      <path d="M0 0 C-8 -6 -10 -14 -4 -16 C-1.6 -16.6 0 -14.8 0 -13.4 C0 -14.8 1.6 -16.6 4 -16 C10 -14 8 -6 0 0 Z" fill="#e8607a" />
    </g>
  );
}
