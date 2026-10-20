import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, bool, Grad, num, SKY, skyKind} from './common';

export const Airliner: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -230,-10 Q -240,-40 -200,-44 L 170,-44 Q 240,-40 250,-6 Q 240,20 170,22 L -200,22 Q -236,18 -230,-10 Z" fill="#EDEAE3" />
    <path d="M -200,-44 L -250,-140 L -205,-140 L -150,-44 Z" fill="#5C7088" />
    <path d="M -40,6 L -120,70 L -80,70 L 40,6 Z" fill="#C9C6BF" />
    <rect x={-60} y={22} width={70} height={22} rx={10} fill="#B9B6AF" />
    <path d="M 200,-30 Q 236,-28 244,-10 L 212,-10 Z" fill="#3A4558" />
    {Array.from({length: 12}).map((_, i) => (
      <circle key={i} cx={-160 + i * 28} cy={-20} r={6} fill="#5C7088" />
    ))}
    <line x1={-30} y1={22} x2={-30} y2={56} stroke="#3A3E45" strokeWidth={6} />
    <circle cx={-30} cy={60} r={9} fill="#2A2D33" />
    <line x1={170} y1={22} x2={170} y2={52} stroke="#3A3E45" strokeWidth={5} />
    <circle cx={170} cy={56} r={8} fill="#2A2D33" />
  </g>
);

const Vehicle: React.FC<{x: number; y: number; kind: 'ambulance' | 'fire'; on: boolean; s?: number}> = ({x, y, kind, on, s = 1}) => {
  const body = kind === 'ambulance' ? '#EEEBE4' : '#B7473F';
  const stripe = kind === 'ambulance' ? '#C9483F' : '#E9E2D2';
  const len = kind === 'ambulance' ? 300 : 380;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {on && <circle cx={len * 0.55} cy={-140} r={60} fill="#FF8A80" opacity={0.35} />}
      <rect x={0} y={-130} width={len * 0.7} height={130} rx={12} fill={body} />
      <path d={`M ${len * 0.7},-90 L ${len * 0.92},-90 L ${len},-40 L ${len},0 L ${len * 0.7},0 Z`} fill={body} />
      <path d={`M ${len * 0.74},-82 L ${len * 0.9},-82 L ${len * 0.96},-46 L ${len * 0.74},-46 Z`} fill="#4E5E72" />
      <rect x={0} y={-60} width={len} height={14} fill={stripe} />
      {kind === 'ambulance' && (
        <g transform={`translate(${len * 0.33}, -96)`}>
          <rect x={-8} y={-22} width={16} height={44} fill="#C9483F" />
          <rect x={-22} y={-8} width={44} height={16} fill="#C9483F" />
        </g>
      )}
      {kind === 'fire' && <rect x={20} y={-160} width={len * 0.55} height={16} rx={6} fill="#9AA1A8" />}
      <rect x={len * 0.5} y={-150} width={60} height={20} rx={8} fill={on ? '#FF5A4E' : '#7A2E2A'} />
      {on && <rect x={len * 0.5} y={-150} width={60} height={20} rx={8} fill="#FFD0C8" opacity={0.6} />}
      {[0.18, 0.8].map((u) => (
        <g key={u}>
          <circle cx={len * u} cy={0} r={30} fill="#2A2D33" />
          <circle cx={len * u} cy={0} r={12} fill="#8A9098" />
        </g>
      ))}
    </g>
  );
};

// 滑走路と救急車
export const Runway: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sky = skyKind(p.sky ?? 'dusk');
  const landAt = num(p.landAt, 2.2);
  const landing = bool(p.landing, true);
  const on = Math.floor(t * 3) % 2 === 0;

  if (layer === 'front') {
    return (
      <g>
        <Vehicle x={90} y={1580} kind="ambulance" on={on} s={1.15} />
        <Vehicle x={560} y={1620} kind="fire" on={!on} s={1.05} />
      </g>
    );
  }

  // 降下 → 接地 → 減速
  const descend = interpolate(t, [0, landAt], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const roll = Math.max(0, t - landAt);
  const px = landing ? interpolate(descend, [0, 1], [-200, 470]) + (1 - Math.exp(-roll * 0.8)) * 380 : 540;
  const py = landing ? interpolate(descend, [0, 1], [700, 1080]) : 1080;
  const rot = landing ? interpolate(descend, [0, 0.9, 1], [8, 6, 0]) : 0;

  return (
    <g>
      <defs>
        <Grad id="rw-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
        <Grad id="rw-ground" from="#7D8B6E" to="#66735A" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#rw-sky)" />
      <path d="M 0,960 Q 200,880 420,940 Q 640,870 860,930 Q 980,900 1080,940 L 1080,1000 L 0,1000 Z" fill="#8E95A6" opacity={0.7} />
      <rect x={0} y={990} width={1080} height={930} fill="url(#rw-ground)" />
      {/* 滑走路 */}
      <path d="M -40,1060 L 1120,1060 L 1120,1240 L -40,1240 Z" fill="#4C5058" />
      <rect x={-40} y={1060} width={1160} height={8} fill="#E9E4DA" />
      <rect x={-40} y={1232} width={1160} height={8} fill="#E9E4DA" />
      {Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={-20 + i * 160} y={1146} width={90} height={8} fill="#E9E4DA" />
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <circle key={i} cx={20 + i * 80} cy={1260} r={6} fill={i % 2 ? '#F2C14E' : '#E9E4DA'} opacity={0.8} />
      ))}
      {bool(p.smoke) &&
        Array.from({length: 6}).map((_, i) => {
          const u = (t * 0.8 + i / 6) % 1;
          return <circle key={i} cx={px - 60 - u * 380} cy={py + 60 - u * 60} r={16 + u * 44} fill="#6B6E73" opacity={0.45 * (1 - u)} />;
        })}
      <Airliner x={px} y={py} rot={rot} s={1.1} />
    </g>
  );
};
