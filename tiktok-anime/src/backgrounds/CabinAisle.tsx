import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, bool, Grad} from './common';

const HAIR = ['#3A3330', '#5A463A', '#2E2926', '#8C8984', '#6B4E3A'];
const SHIRT = ['#8E6F6A', '#6F8A7A', '#A08B6A', '#7A7F99', '#9A7C8E'];

// 通路から見た客室（乗客が座っている）
export const CabinAisle: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const murmur = bool(p.murmur);

  const rows = [0, 1, 2, 3, 4];
  return (
    <g>
      <defs>
        <Grad id="aisle-wall" from="#E9E3D7" to="#D3CABA" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#aisle-wall)" />
      <path d="M 0,0 L 1080,0 L 1080,260 L 640,560 L 440,560 L 0,260 Z" fill="#EFEAE1" />
      <path d="M 0,260 L 440,560 L 440,590 L 0,300 Z" fill="#C9C1B3" />
      <path d="M 1080,260 L 640,560 L 640,590 L 1080,300 Z" fill="#C9C1B3" />
      <path d="M 440,1000 L 640,1000 L 1080,1920 L 0,1920 Z" fill="#857B6E" />
      <path d="M 520,1000 L 560,1000 L 600,1920 L 480,1920 Z" fill="#9A8F81" opacity={0.6} />
      {bool(p.exit) && (
        <g>
          <rect x={455} y={640} width={170} height={360} rx={16} fill="#F6F1DC" />
          <rect x={455} y={640} width={170} height={360} rx={16} fill="#FFF7C8" opacity={0.6 + 0.4 * Math.sin(t * 3) ** 2} />
          <rect x={470} y={585} width={140} height={46} rx={8} fill="#2E9E5B" />
          <text x={540} y={620} textAnchor="middle" fontSize={30} fontWeight={900} fill="#FFFFFF" fontFamily="Noto Sans JP">非常口</text>
        </g>
      )}
      {rows
        .slice()
        .reverse()
        .map((r) => {
          const s = 0.42 + r * 0.2;
          const yBase = 780 + r * r * 34 + r * 90;
          return [-1, 1].map((side) => {
            const cx = 540 + side * (120 + r * 55);
            return [0, 1].map((k) => {
              const sx = cx + side * k * 215 * s;
              const idx = (r * 4 + k * 2 + (side > 0 ? 1 : 0)) % 5;
              const turn = murmur ? Math.sin(t * 2.2 + idx * 1.7 + r) : 0;
              const look = turn > 0.4 ? 10 : turn < -0.4 ? -10 : 0;
              const bob = murmur ? Math.abs(Math.sin(t * 3 + idx)) * -6 : 0;
              return (
                <g key={`${r}${side}${k}`} transform={`translate(${sx}, ${yBase}) scale(${s})`}>
                  <rect x={-100} y={-330} width={200} height={460} rx={34} fill="#6F8496" />
                  <rect x={-86} y={-318} width={172} height={46} rx={16} fill="#E9E4DA" />
                  <g transform={`translate(0, ${bob})`}>
                    <path d="M -70,-120 Q -70,-150 -40,-150 L 40,-150 Q 70,-150 70,-120 L 70,0 L -70,0 Z" fill={SHIRT[idx]} />
                    <circle cx={0} cy={-210} r={60} fill="#F1D6C1" />
                    <path d="M -62,-206 A 62 62 0 0 1 62,-206 L 56,-214 Q 20,-236 -2,-228 Q -30,-238 -56,-212 Z" fill={HAIR[idx]} />
                    <circle cx={-20 + look} cy={-204} r={7} fill="#2A2522" />
                    <circle cx={20 + look} cy={-204} r={7} fill="#2A2522" />
                  </g>
                  <rect x={-120} y={20} width={240} height={110} rx={20} fill="#5D7183" />
                </g>
              );
            });
          });
        })}
    </g>
  );
};
