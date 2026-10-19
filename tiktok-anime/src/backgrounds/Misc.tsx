import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, Grad, num, str} from './common';

// コックピットのドア（前方ギャレー側から）
export const CockpitDoor: Background = ({layer}) => {
  if (layer === 'front') return null;
  return (
    <g>
      <defs>
        <Grad id="door-wall" from="#E3DCCF" to="#CFC6B6" />
        <Grad id="door-door" from="#8C96A0" to="#76808A" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#door-wall)" />
      <path d="M 0,0 L 1080,0 L 1080,260 Q 540,320 0,260 Z" fill="#EFEAE1" />
      {/* カーテン */}
      <path d="M 0,280 L 190,300 Q 170,900 210,1560 L 0,1560 Z" fill="#7C8B9A" />
      <path d="M 1080,280 L 890,300 Q 910,900 870,1560 L 1080,1560 Z" fill="#7C8B9A" />
      {[60, 120].map((x) => (
        <line key={x} x1={x} y1={300} x2={x + 10} y2={1560} stroke="#6D7B89" strokeWidth={6} />
      ))}
      {[960, 1020].map((x) => (
        <line key={x} x1={x} y1={300} x2={x - 10} y2={1560} stroke="#6D7B89" strokeWidth={6} />
      ))}
      {/* ドア */}
      <rect x={300} y={420} width={480} height={1140} rx={14} fill="#5E6872" />
      <rect x={320} y={440} width={440} height={1100} rx={10} fill="url(#door-door)" />
      <circle cx={540} cy={700} r={20} fill="#3A4048" />
      <circle cx={540} cy={700} r={10} fill="#1F2328" />
      <rect x={670} y={900} width={60} height={110} rx={8} fill="#3E454D" />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => <rect key={`${r}${c}`} x={680 + c * 22} y={914 + r * 30} width={16} height={20} rx={3} fill="#A9B0B7" />),
      )}
      <circle cx={700} cy={1080} r={6} fill="#7FB89A" />
      <rect x={640} y={1120} width={90} height={22} rx={10} fill="#C9CED3" />
      <rect x={430} y={520} width={220} height={50} rx={6} fill="#E9E4DA" />
      <text x={540} y={555} textAnchor="middle" fontSize={28} fontWeight={900} fill="#5E6872" fontFamily="Noto Sans JP">
        CREW ONLY
      </text>
      <rect x={0} y={1560} width={1080} height={360} fill="#857B6E" />
    </g>
  );
};

// 夜の暗転＋無線の波形
export const NightRadio: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const amp = num(p.amp, 1);
  const color = str(p.color, '#7FC4B0');
  const cy = num(p.y, 860);
  const n = 64;
  const bars = Array.from({length: n}).map((_, i) => {
    const x = 90 + (i * 900) / (n - 1);
    const e = Math.sin(i * 0.35 + t * 7) * 0.5 + Math.sin(i * 1.7 - t * 13) * 0.3 + Math.sin(i * 0.9 + t * 3.1) * 0.2;
    const noise = (Math.sin(i * 12.9898 + frame * 78.233) * 43758.5453) % 1;
    const env = Math.sin((Math.PI * i) / (n - 1));
    const h = Math.max(6, Math.abs(e + noise * 0.5) * 160 * env * amp);
    return {x, h};
  });
  return (
    <g>
      <defs>
        <Grad id="night-bg" from="#141B2A" to="#05070C" />
        <radialGradient id="night-glow" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor={color} stopOpacity={0.18} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#night-bg)" />
      <rect x={0} y={cy - 500} width={1080} height={1000} fill="url(#night-glow)" />
      <line x1={60} y1={cy} x2={1020} y2={cy} stroke={color} strokeOpacity={0.25} strokeWidth={2} />
      {bars.map((b, i) => (
        <rect key={i} x={b.x - 4} y={cy - b.h / 2} width={8} height={b.h} rx={4} fill={color} opacity={0.85} />
      ))}
      <text x={540} y={cy + 230} textAnchor="middle" fontSize={34} fontWeight={700} fill={color} opacity={0.6} fontFamily="Noto Sans JP" letterSpacing={6}>
        {str(p.label, 'COM1  118.725')}
      </text>
    </g>
  );
};

// 単色の背景（機内食など小物の説明用）
export const Plain: Background = ({layer, p}) => {
  if (layer === 'front') return null;
  const from = str(p.from, '#D8D0C2');
  const to = str(p.to, '#C4BBAA');
  return (
    <g>
      <defs>
        <Grad id="plain-bg" from={from} to={to} />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#plain-bg)" />
    </g>
  );
};

export const Black: Background = ({layer}) => (layer === 'front' ? null : <rect x={0} y={0} width={1080} height={1920} fill="#000" />);

// 操縦桿を握る手のアップ
export const YokeCloseup: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const at = num(p.gripAt, 0.3);
  const g = Math.min(1, Math.max(0, (t - at) / 0.4));
  const ease = 1 - Math.pow(1 - g, 3);
  if (layer === 'front') return null;
  const skin = '#F1D6C1';
  const cy = 1050;
  const handL: [number, number] = [238 + (1 - ease) * -100, cy - 70 + (1 - ease) * 300];
  const handR: [number, number] = [842 + (1 - ease) * 100, cy - 70 + (1 - ease) * 300];
  return (
    <g>
      <defs>
        <Grad id="yc-bg" from="#3C4048" to="#2A2D33" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#yc-bg)" />
      {/* 奥の計器 */}
      <rect x={140} y={300} width={360} height={300} rx={14} fill="#1D252C" />
      <rect x={160} y={320} width={320} height={130} fill="#5F86A6" />
      <rect x={160} y={450} width={320} height={130} fill="#8A6A4F" />
      <line x1={160} y1={450} x2={480} y2={450} stroke="#F2EEE6" strokeWidth={4} />
      <rect x={580} y={300} width={360} height={300} rx={14} fill="#1D252C" />
      <path d="M 620,560 A 140 140 0 0 1 900,560" stroke="#7FB89A" strokeWidth={4} fill="none" />
      {/* 操縦桿 */}
      <rect x={510} y={cy} width={60} height={900} rx={12} fill="#1E2024" />
      <path d={`M 200,${cy - 140} Q 190,${cy + 90} 330,${cy + 100} L 750,${cy + 100} Q 890,${cy + 90} 880,${cy - 140} L 800,${cy - 150} Q 800,${cy + 10} 720,${cy + 16} L 360,${cy + 16} Q 280,${cy + 10} 280,${cy - 150} Z`} fill="#5A6069" stroke="#1E2024" strokeWidth={6} />
      <rect x={440} y={cy + 10} width={200} height={80} rx={12} fill="#6A717B" />
      <rect x={480} y={cy + 34} width={120} height={22} rx={6} fill="#9AA1A8" />
      {/* 腕と手 */}
      <line x1={120} y1={1920} x2={handL[0]} y2={handL[1]} stroke="#2E2A28" strokeWidth={22} strokeLinecap="round" />
      <line x1={960} y1={1920} x2={handR[0]} y2={handR[1]} stroke="#2E2A28" strokeWidth={22} strokeLinecap="round" />
      <path d={`M 40,1920 L 120,1700 L 230,1740 L 200,1920 Z`} fill="#F2F0EA" />
      <path d={`M 1040,1920 L 960,1700 L 850,1740 L 880,1920 Z`} fill="#F2F0EA" />
      <circle cx={handL[0]} cy={handL[1]} r={46} fill={skin} />
      <circle cx={handR[0]} cy={handR[1]} r={46} fill={skin} />
    </g>
  );
};
