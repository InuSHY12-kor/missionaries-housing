import React from 'react';

// WEWE 하우스 캐릭터 — 실사풍 3D SD 캐릭터 (2026-10-21 개편, 사용자 레퍼런스 "3D Character Modeling" 참고).
// 큰 머리(약 2.5등신)·윤기 있는 큰 갈색 눈·결이 보이는 앞머리·래글런 티셔츠·밑단 접은 바지·운동화.
// 피부·머리카락·옷 모두 빛 방향(위 왼쪽)에 맞춘 그라데이션과 하이라이트로 입체감을 냅니다.
// 발끝이 (0, 0)에 오도록 그리고 바깥에서 translate로 위치를 정합니다.
// 팔(hc-arm-l / hc-arm-r)은 어깨 기준 회전 → "두 손을 받쳐 올리는" 동작(아론과 훌)·타이핑·작업 동작.
// 그라데이션 정의(<CharacterDefs />)는 SVG의 <defs> 안에 한 번 넣어야 합니다.

const KINDS = {
  missionary: { shirt: ['#48b2b5', '#127076'], sleeve: ['#e4e1da', '#aaa69d'], hair: ['#7a5638', '#3a2416'], shoe: '#e9c54f', style: 'short' },
  host: { shirt: ['#f6ad6e', '#c9692c'], sleeve: ['#f3ead9', '#c9bea8'], hair: ['#6a4630', '#2e1c10'], shoe: '#d97b3f', style: 'hat', hat: ['#eed3aa', '#b8925f'] },
  pastor: { shirt: ['#4d5876', '#1f2430'], sleeve: ['#4d5876', '#1f2430'], hair: ['#c2bdb4', '#7d786f'], shoe: '#3a3330', style: 'short', glasses: true, collar: true },
  supporter: { shirt: ['#f4a9b6', '#c9667a'], sleeve: ['#ece8e1', '#b4afa5'], hair: ['#4a3428', '#1e130b'], shoe: '#f4a9b6', style: 'beanie', hat: ['#fbd2d9', '#e08c9c'] },
  ceo: { shirt: ['#62779f', '#2c3a58'], sleeve: ['#62779f', '#2c3a58'], hair: ['#8a5a3a', '#3e2414'], shoe: '#3a3330', style: 'long', inner: '#f6f2ea' },
  dev: { shirt: ['#555b68', '#24272f'], sleeve: ['#555b68', '#24272f'], hair: ['#4a3a30', '#16100b'], shoe: '#e9e6df', style: 'short', headset: true },
  tailor: { shirt: ['#e3d3b8', '#a8957a'], sleeve: ['#e3d3b8', '#a8957a'], hair: ['#6a4630', '#2a1a10'], shoe: '#6b4a36', style: 'bun', apron: true },
  stay: { shirt: ['#4fc0b2', '#16756c'], sleeve: ['#f1efea', '#bdb8ae'], hair: ['#8a5e3c', '#3e2616'], shoe: '#e9e6df', style: 'ponytail' },
  donation: { shirt: ['#f8cf5a', '#c9902a'], sleeve: ['#c9c4b9', '#8f8a80'], hair: ['#7a5236', '#33200f'], shoe: '#f8cf5a', style: 'short', heart: true },
};

export const CHARACTER_KINDS = Object.keys(KINDS);

function Lin({ id, c, vertical }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2="1">
      <stop offset="0%" stopColor={c[0]} />
      <stop offset="100%" stopColor={c[1]} />
    </linearGradient>
  );
}
function Rad({ id, c, cx = 0.35, cy = 0.3, r = 0.85 }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      <stop offset="0%" stopColor={c[0]} />
      <stop offset="100%" stopColor={c[1]} />
    </radialGradient>
  );
}

export function CharacterDefs() {
  return (
    <>
      <Rad id="sd-skin" c={['#fff1e6', '#efb894']} cx={0.38} cy={0.32} r={0.8} />
      <Rad id="sd-iris" c={['#b07a42', '#2e1a0e']} cx={0.5} cy={0.68} r={0.75} />
      <Lin id="sd-pants" c={['#b9b5ac', '#7d7a72']} />
      <filter id="sd-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
      {Object.entries(KINDS).map(([k, v]) => (
        <React.Fragment key={k}>
          <Lin id={`sd-shirt-${k}`} c={v.shirt} />
          <Lin id={`sd-sleeve-${k}`} c={v.sleeve} vertical />
          <Rad id={`sd-hair-${k}`} c={v.hair} cx={0.35} cy={0.25} r={0.9} />
          {v.hat && <Rad id={`sd-hat-${k}`} c={v.hat} />}
        </React.Fragment>
      ))}
    </>
  );
}

function Arm({ side, kind }) {
  const x = side === 'l' ? -18 : 12;
  return (
    <g className={`hc-arm hc-arm-${side}`}>
      <rect x={x} y={-30} width={6} height={15} rx={3} fill={`url(#sd-sleeve-${kind})`} />
      <circle cx={x + 3} cy={-14.5} r={3.6} fill="url(#sd-skin)" />
    </g>
  );
}

const FRINGE = 'M-18.5 -49 Q-19.5 -70 0 -70 Q19.5 -70 18.5 -49 Q17 -55 13 -57.5 L11.5 -50.5 L8 -58.5 L4.5 -51.5 L0.5 -59.5 L-3.5 -51.5 L-7.5 -58.5 L-10.5 -50.5 L-13 -57.5 Q-17 -55 -18.5 -49 Z';

function Hair({ kind, style, back }) {
  const fill = `url(#sd-hair-${kind})`;
  if (back) {
    return (
      <g fill={fill}>
        <circle cx={0} cy={-50} r={19} />
        {style === 'long' && <path d="M-18 -50 Q-19 -30 -12 -28 L12 -28 Q19 -30 18 -50 Z" />}
        {style === 'ponytail' && <path d="M-3 -40 Q0 -22 4 -26 Q6 -34 3 -40 Z" />}
        {style === 'bun' && <circle cx={0} cy={-70} r={6.5} />}
      </g>
    );
  }
  return (
    <g>
      {style === 'long' && <path d="M-19 -50 Q-21 -26 -13 -26 Q-12 -38 -14 -48 Z M19 -50 Q21 -26 13 -26 Q12 -38 14 -48 Z" fill={fill} />}
      {style === 'ponytail' && <path d="M15 -60 Q31 -58 27 -38 Q25 -30 20 -28 Q24 -38 20 -48 Q18 -54 14 -56 Z" fill={fill} />}
      {style === 'bun' && <circle cx={0} cy={-71} r={7} fill={fill} />}
      <path d={FRINGE} fill={fill} />
      {/* 옆머리 */}
      <path d="M-18.5 -49 Q-20 -42 -17 -36 Q-16 -44 -15 -49 Z" fill={fill} />
      <path d="M18.5 -49 Q20 -42 17 -36 Q16 -44 15 -49 Z" fill={fill} />
      {/* 머리카락 결·윤기 */}
      <path d="M-12 -64 Q-4 -68 6 -66" stroke="#ffffff" strokeWidth={2.2} fill="none" opacity={0.28} strokeLinecap="round" />
      <path d="M-6 -62 Q-2 -58 -3 -52 M4 -63 Q7 -59 6 -53" stroke="rgba(0,0,0,0.18)" strokeWidth={1} fill="none" />
    </g>
  );
}

function Face({ glasses }) {
  const eye = (cx) => (
    <g>
      <ellipse cx={cx} cy={-45} rx={4.4} ry={5.3} fill="url(#sd-iris)" />
      <ellipse cx={cx} cy={-44.4} rx={2} ry={2.6} fill="#1a0f08" />
      <circle cx={cx - 1.7} cy={-47.2} r={1.6} fill="#ffffff" />
      <circle cx={cx + 1.6} cy={-42.6} r={0.75} fill="#ffffff" opacity={0.85} />
      <path d={`M${cx - 4.8} -48.6 Q${cx} -52 ${cx + 4.8} -48.6`} stroke="#2a1a12" strokeWidth={1.7} fill="none" strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {eye(-7)}
      {eye(7)}
      <path d="M-10 -55 Q-7 -56.5 -4 -55.5 M4 -55.5 Q7 -56.5 10 -55" stroke="#5a3a26" strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.8} />
      <ellipse cx={0} cy={-39.5} rx={1.2} ry={0.8} fill="#e2a283" />
      <path d="M-2.2 -36.2 Q0 -34.8 2.2 -36.2" stroke="#b0614a" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <ellipse cx={-11.5} cy={-39} rx={3.4} ry={2} fill="#f39a8f" opacity={0.42} />
      <ellipse cx={11.5} cy={-39} rx={3.4} ry={2} fill="#f39a8f" opacity={0.42} />
      {glasses && (
        <g stroke="#3a3530" strokeWidth={1.1} fill="rgba(255,255,255,0.08)">
          <rect x={-12.5} y={-50.5} width={11} height={10} rx={3.5} />
          <rect x={1.5} y={-50.5} width={11} height={10} rx={3.5} />
          <path d="M-1.5 -46 L1.5 -46" fill="none" />
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
        <ellipse cx={0} cy={-60} rx={24} ry={5.5} fill={fill} />
        <path d="M-13.5 -60 Q-13.5 -75 0 -75 Q13.5 -75 13.5 -60 Z" fill={fill} />
        <path d="M-13.5 -62 Q0 -59 13.5 -62 L13.5 -60 Q0 -57 -13.5 -60 Z" fill="#8a6a4a" opacity={0.6} />
      </g>
    );
  }
  return (
    <g>
      <path d="M-19 -52 Q-19.5 -73 0 -73 Q19.5 -73 19 -52 Z" fill={fill} />
      <rect x={-19.5} y={-55} width={39} height={6.5} rx={3.2} fill={fill} />
      <path d="M-12 -70 Q-4 -73 5 -71" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.35} strokeLinecap="round" />
      <circle cx={0} cy={-74} r={4.2} fill={fill} />
    </g>
  );
}

function Leg({ side, shoe }) {
  const x = side === 'l' ? -9 : 1.5;
  return (
    <g className={`hc-leg hc-leg-${side}`}>
      <rect x={x} y={-17} width={7.5} height={13} rx={3.4} fill="url(#sd-pants)" />
      <rect x={x - 0.3} y={-7.5} width={8.1} height={3.2} rx={1.5} fill="#8f8b82" />
      <path d={`M${x - 1.2} -1.5 Q${x - 1.2} -5 ${x + 3.8} -5 Q${x + 9} -5 ${x + 9.2} -1.5 Z`} fill={shoe} />
      <rect x={x - 1.4} y={-1.8} width={10.8} height={2} rx={1} fill="#ffffff" />
    </g>
  );
}

export function Character({ kind = 'missionary', className = '', suit = false, seated = false, back = false }) {
  const k = KINDS[kind] ? kind : 'missionary';
  const v = KINDS[k];
  return (
    <g className={`hc hc--${k} ${className}`}>
      {!seated && <ellipse cx={1} cy={1} rx={15} ry={4} fill="rgba(28,24,20,0.3)" filter="url(#sd-shadow)" />}
      {!seated && (
        <>
          <Leg side="l" shoe={v.shoe} />
          <Leg side="r" shoe={v.shoe} />
        </>
      )}
      {/* 몸통(래글런 티셔츠) */}
      <path d="M-12.5 -15 Q-13.5 -31.5 0 -32.5 Q13.5 -31.5 12.5 -15 Q0 -12 -12.5 -15 Z" fill={`url(#sd-shirt-${k})`} />
      <path d="M-12.5 -17.5 Q0 -14.5 12.5 -17.5 L12.5 -15 Q0 -12 -12.5 -15 Z" fill="rgba(0,0,0,0.14)" />
      {v.inner && <path d="M-4.5 -32 L0 -21 L4.5 -32 Z" fill={v.inner} />}
      {v.collar && !back && <rect x={-2.4} y={-33} width={4.8} height={3.6} rx={1} fill="#ffffff" />}
      {v.apron && <path d="M-8 -27 L8 -27 L9.5 -13.5 Q0 -11.5 -9.5 -13.5 Z" fill="#fbf6ee" />}
      {v.apron && <path d="M-11 -31 Q-5 -24 0 -31 Q5 -24 11 -31" stroke="#f0c9a0" strokeWidth={1.8} fill="none" strokeDasharray="1.6 1.6" />}
      {v.heart && !back && <path d="M0 -19 C-4.5 -22.5 -5.5 -26.5 -2.4 -27.4 C-1 -27.8 0 -26.8 0 -26 C0 -26.8 1 -27.8 2.4 -27.4 C5.5 -26.5 4.5 -22.5 0 -19 Z" fill="#e8607a" />}
      {!v.heart && !v.apron && !v.inner && !back && <circle cx={-4.5} cy={-26} r={1.6} fill="rgba(0,0,0,0.35)" />}
      {suit && (
        <g className="hc-suit">
          <path d="M-13 -15 Q-14 -32 0 -33 Q14 -32 13 -15 Q0 -12 -13 -15 Z" fill="#1f2c4a" />
          <path d="M-4 -32.5 L0 -21 L4 -32.5 Z" fill="#ffffff" />
          <rect x={-1} y={-26} width={2} height={7} fill="#b8622c" />
          <path d="M-4 -32.5 L-7 -22 L0 -21 M4 -32.5 L7 -22 L0 -21" stroke="#34436a" strokeWidth={1.2} fill="none" />
        </g>
      )}
      <ellipse cx={-5} cy={-25} rx={4.5} ry={3.2} fill="#ffffff" opacity={0.14} />
      <Arm side="l" kind={k} />
      <Arm side="r" kind={k} />
      <g className="hc-head">
        <ellipse cx={0} cy={-31.5} rx={7} ry={2.4} fill="rgba(0,0,0,0.16)" />
        {!back && <circle cx={-18} cy={-45} r={3.6} fill="url(#sd-skin)" />}
        {!back && <circle cx={18} cy={-45} r={3.6} fill="url(#sd-skin)" />}
        <circle cx={0} cy={-48} r={18.5} fill="url(#sd-skin)" />
        {!back && <Face glasses={v.glasses} />}
        <Hair kind={k} style={v.style} back={back} />
        {v.hat && <Hat kind={k} style={v.style} />}
        {v.headset && (
          <g>
            <path d="M-19.5 -48 Q-19.5 -73 0 -73 Q19.5 -73 19.5 -48" stroke="#2b2f36" strokeWidth={2.8} fill="none" />
            <rect x={-23} y={-52} width={6} height={11} rx={3} fill="#2b2f36" />
            <rect x={17} y={-52} width={6} height={11} rx={3} fill="#2b2f36" />
          </g>
        )}
      </g>
    </g>
  );
}

export function Suitcase({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-1} y={-19} width={13} height={4.5} rx={2} fill="none" stroke="#5a4636" strokeWidth={1.7} />
      <rect x={-5} y={-15} width={21} height={15} rx={3.2} fill="#c89b6d" />
      <rect x={-5} y={-15} width={7} height={15} rx={3.2} fill="#ddb589" />
      <rect x={-5} y={-9} width={21} height={2} fill="#a87a4f" />
    </g>
  );
}

export function WelcomeKit({ className = '' }) {
  return (
    <g className={className}>
      <rect x={-13} y={-17} width={26} height={17} rx={2} fill="#146b71" />
      <rect x={-13} y={-17} width={9} height={17} rx={2} fill="#1b8088" />
      <rect x={-2} y={-17} width={4} height={17} fill="#d97b3f" />
      <rect x={-15} y={-21} width={30} height={6} rx={2} fill="#1f8f97" />
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
