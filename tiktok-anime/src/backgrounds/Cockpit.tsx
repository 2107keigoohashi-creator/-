import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, Cloud, Grad, SKY, skyKind} from './common';

// 計器（PFD）の簡略表現
const Pfd: React.FC<{x: number; y: number; w: number; h: number; roll: number}> = ({x, y, w, h, roll}) => (
  <g>
    <clipPath id={`pfd-${x}`}>
      <rect x={x} y={y} width={w} height={h} rx={8} />
    </clipPath>
    <g clipPath={`url(#pfd-${x})`}>
      <g transform={`rotate(${roll}, ${x + w / 2}, ${y + h / 2})`}>
        <rect x={x - w} y={y - h} width={w * 3} height={h * 1.5} fill="#5F86A6" />
        <rect x={x - w} y={y + h / 2} width={w * 3} height={h * 1.5} fill="#8A6A4F" />
        <line x1={x - w} y1={y + h / 2} x2={x + w * 2} y2={y + h / 2} stroke="#F2EEE6" strokeWidth={3} />
      </g>
      <path d={`M ${x + w / 2 - 34},${y + h / 2} L ${x + w / 2 - 12},${y + h / 2} L ${x + w / 2},${y + h / 2 + 10} L ${x + w / 2 + 12},${y + h / 2} L ${x + w / 2 + 34},${y + h / 2}`} stroke="#E8C547" strokeWidth={5} fill="none" />
    </g>
    <rect x={x} y={y} width={w} height={h} rx={8} fill="none" stroke="#1A1C20" strokeWidth={6} />
  </g>
);

const Nd: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={8} fill="#1D252C" stroke="#1A1C20" strokeWidth={6} />
    <path d={`M ${x + 16},${y + h - 16} A ${w / 2 - 16} ${w / 2 - 16} 0 0 1 ${x + w - 16},${y + h - 16}`} stroke="#7FB89A" strokeWidth={3} fill="none" />
    <path d={`M ${x + w / 2},${y + h - 30} L ${x + w / 2 - 10},${y + h - 10} L ${x + w / 2 + 10},${y + h - 10} Z`} fill="#E8E2D4" />
    <line x1={x + w / 2} y1={y + h - 30} x2={x + w / 2 + 20} y2={y + 30} stroke="#C88BC8" strokeWidth={3} />
  </g>
);

// コックピット（左右2席を正面から）。正面から見ているので、機長（左席）は画面の右 x≈780、副操縦士（右席）は画面の左 x≈300。
// y≈1120 に座らせ、"yoke": true で操縦桿を付ける
export const Cockpit: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sky = skyKind(p.sky);

  if (layer === 'front') {
    const roll = Math.sin(t * 0.8) * 1.5;
    return (
      <g>
        {/* 計器盤 */}
        <path d="M -20,1290 Q 540,1230 1100,1290 L 1100,1940 L -20,1940 Z" fill="#3A3E45" />
        <path d="M -20,1290 Q 540,1230 1100,1290 L 1100,1320 Q 540,1260 -20,1320 Z" fill="#2A2D33" />
        <Pfd x={70} y={1350} w={200} h={170} roll={roll} />
        <Nd x={290} y={1350} w={200} h={170} />
        <rect x={510} y={1345} width={60} height={180} rx={6} fill="#2C3036" />
        <Nd x={590} y={1350} w={200} h={170} />
        <Pfd x={810} y={1350} w={200} h={170} roll={roll} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={130 + i * 164} cy={1580} r={14} fill="#55595F" />
        ))}
        {/* スロットル */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${540 + s * 22}, 1250)`}>
            <rect x={-6} y={0} width={12} height={70} fill="#2A2D33" />
            <rect x={-16} y={-14} width={32} height={22} rx={6} fill="#8B9096" />
          </g>
        ))}
      </g>
    );
  }

  return (
    <g>
      <defs>
        <Grad id="ck-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
        <Grad id="ck-wall" from="#4A4F57" to="#3C4048" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#ck-wall)" />
      {/* 横の窓 */}
      <path d="M 0,420 L 170,380 L 190,860 L 0,980 Z" fill="url(#ck-sky)" />
      <path d="M 1080,420 L 910,380 L 890,860 L 1080,980 Z" fill="url(#ck-sky)" />
      {sky !== 'night' && (
        <>
          <Cloud x={60 + ((t * 30) % 200)} y={760} s={0.8} />
          <Cloud x={1000 - ((t * 30) % 200)} y={800} s={0.7} />
        </>
      )}
      {sky === 'night' &&
        [0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={40 + i * 36} cy={500 + ((i * 97) % 300)} r={2.5} fill="#DAD6CA" opacity={0.7} />
            <circle cx={1040 - i * 36} cy={520 + ((i * 71) % 300)} r={2.5} fill="#DAD6CA" opacity={0.7} />
          </g>
        ))}
      <path d="M 0,420 L 170,380 L 190,860 L 0,980" fill="none" stroke="#2E3238" strokeWidth={18} />
      <path d="M 1080,420 L 910,380 L 890,860 L 1080,980" fill="none" stroke="#2E3238" strokeWidth={18} />
      {/* 天井のオーバーヘッドパネル */}
      <path d="M 120,0 L 960,0 L 900,300 L 180,300 Z" fill="#565C64" />
      {Array.from({length: 5}).map((_, r) =>
        Array.from({length: 9}).map((__, c) => {
          const x = 220 + c * 80 - r * 0;
          const y = 40 + r * 52;
          const on = (r * 9 + c) % 7 === 0;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x - 22} y={y} width={44} height={30} rx={5} fill="#3F444B" />
              <rect x={x - 10} y={y + 9} width={20} height={12} rx={3} fill={on ? '#E8C547' : '#8A9098'} opacity={on ? 0.9 : 0.6} />
            </g>
          );
        }),
      )}
      {/* 後ろの壁と仕切り */}
      <rect x={430} y={330} width={220} height={1100} fill="#353940" />
      <rect x={470} y={380} width={140} height={260} rx={10} fill="#2E3238" />
      <circle cx={590} cy={520} r={8} fill="#9AA1A8" />
    </g>
  );
};
