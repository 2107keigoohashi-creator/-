import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Flame} from './Cabin';
import {Background, bool, Cloud, Grad, num, SKY, skyKind} from './common';
import {Airliner} from './Runway';

// 火災ハンドルのアップ。pullAt 秒で手が伸びて引き、rotateAt 秒で回して消火（DISCH が点灯）
export const FireHandle: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const pullAt = num(p.pullAt, 0.6);
  const rotateAt = num(p.rotateAt, 9999);
  const reach = interpolate(t, [pullAt - 0.5, pullAt], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pull = interpolate(t, [pullAt, pullAt + 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const rot = interpolate(t, [rotateAt, rotateAt + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const blink = Math.floor(t * 4) % 2 === 0;
  const lit = bool(p.lit, true);
  const handles = [
    {x: 300, label: 'ENG 1', fire: lit},
    {x: 780, label: 'ENG 2', fire: false},
  ];
  const hx = 300;
  const hy = 860 + pull * 110;
  return (
    <g>
      <defs>
        <Grad id="fh-bg" from="#3E434B" to="#2C3036" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#fh-bg)" />
      <rect x={90} y={520} width={900} height={760} rx={30} fill="#33373E" stroke="#22252A" strokeWidth={10} />
      {Array.from({length: 18}).map((_, i) => (
        <circle key={i} cx={130 + (i % 9) * 103} cy={i < 9 ? 560 : 1240} r={9} fill="#22252A" />
      ))}
      <text x={540} y={640} textAnchor="middle" fontSize={44} fontWeight={900} fill="#B9BEC3" fontFamily="Noto Sans JP" letterSpacing={8}>
        ENGINE FIRE
      </text>
      {handles.map((h) => {
        const pulled = h.x === hx ? pull * 110 : 0;
        const r = h.x === hx ? rot * 40 : 0;
        return (
          <g key={h.label}>
            <rect x={h.x - 40} y={760} width={80} height={300} rx={14} fill="#1F2226" />
            <text x={h.x} y={1120} textAnchor="middle" fontSize={40} fontWeight={900} fill="#D9DDE0" fontFamily="Noto Sans JP">
              {h.label}
            </text>
            <g transform={`translate(${h.x}, ${860 + pulled}) rotate(${r})`}>
              {h.fire && blink && <rect x={-150} y={-60} width={300} height={120} rx={30} fill="#FF4D3D" opacity={0.35} />}
              <rect x={-12} y={-40} width={24} height={100} fill="#5A5F66" />
              <rect x={-130} y={-46} width={260} height={92} rx={22} fill={h.fire ? (blink ? '#FF5A4E' : '#C93A31') : '#8C2F29'} stroke="#3A1512" strokeWidth={6} />
              <text x={0} y={16} textAnchor="middle" fontSize={44} fontWeight={900} fill="#FFF2EE" fontFamily="Noto Sans JP">
                FIRE
              </text>
            </g>
            <rect x={h.x - 60} y={1160} width={120} height={50} rx={8} fill={h.x === hx && rot > 0.9 ? '#F2C14E' : '#4A4F57'} />
            <text x={h.x} y={1196} textAnchor="middle" fontSize={30} fontWeight={900} fill={h.x === hx && rot > 0.9 ? '#2A2D33' : '#7D838B'} fontFamily="Noto Sans JP">
              DISCH
            </text>
          </g>
        );
      })}
      {/* 手 */}
      <g opacity={reach > 0.01 ? 1 : 0}>
      <line x1={-40} y1={1920} x2={hx - 30 + (1 - reach) * -260} y2={hy + 70 + (1 - reach) * 500} stroke="#2E2A28" strokeWidth={22} strokeLinecap="round" />
      <path d="M -80,1920 L -10,1680 L 120,1730 L 90,1920 Z" fill="#F2F0EA" opacity={reach > 0 ? 1 : 0} />
      <circle cx={hx - 30 + (1 - reach) * -260} cy={hy + 70 + (1 - reach) * 500} r={50} fill="#F1D6C1" />
      </g>
    </g>
  );
};

// 空を飛ぶ旅客機（横から）。smoke で片方のエンジンから煙、fire で炎
export const SkyPlane: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const sky = skyKind(p.sky);
  const smoke = bool(p.smoke);
  const fire = bool(p.fire);
  const bob = Math.sin(t * 1.3) * 8;
  const x = 520;
  const y = 860 + bob;
  return (
    <g>
      <defs>
        <Grad id="sp-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sp-sky)" />
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 1300 - ((t * 160 + i * 330) % 1700);
        return <Cloud key={i} x={cx} y={420 + ((i * 271) % 900)} s={1.4 + (i % 3) * 0.5} opacity={0.75} />;
      })}
      {smoke &&
        Array.from({length: 7}).map((_, i) => {
          const u = (t * 0.7 + i / 7) % 1;
          return <circle key={i} cx={x - 40 - u * 520} cy={y + 40 - u * 40} r={18 + u * 50} fill="#6B6E73" opacity={0.5 * (1 - u)} />;
        })}
      <g transform={`translate(${x}, ${y}) scale(1.6)`}>
        <Airliner x={0} y={0} rot={-2} s={1} />
      </g>
      {fire && <Flame x={x - 50} y={y + 80} s={1.1} t={t} />}
    </g>
  );
};
