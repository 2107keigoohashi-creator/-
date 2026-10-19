import React from 'react';

export type BgProps = {
  layer: 'back' | 'front';
  p: Record<string, unknown>;
};

export type Background = React.FC<BgProps>;

export const num = (v: unknown, d: number) => (typeof v === 'number' ? v : d);
export const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
export const bool = (v: unknown, d = false) => (typeof v === 'boolean' ? v : d);

export const SKY = {
  day: ['#9DB7C6', '#C9D6DA'],
  dusk: ['#8C94AE', '#D2B9A6'],
  night: ['#141B2A', '#26324A'],
} as const;

export type SkyKind = keyof typeof SKY;

export const skyKind = (v: unknown): SkyKind => (v === 'night' || v === 'dusk' ? v : 'day');

export const Grad: React.FC<{id: string; from: string; to: string; vertical?: boolean}> = ({id, from, to, vertical = true}) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
    <stop offset="0" stopColor={from} />
    <stop offset="1" stopColor={to} />
  </linearGradient>
);

export const Cloud: React.FC<{x: number; y: number; s?: number; fill?: string; opacity?: number}> = ({x, y, s = 1, fill = '#F4F1EA', opacity = 0.9}) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={opacity}>
    <ellipse cx={0} cy={0} rx={70} ry={26} fill={fill} />
    <ellipse cx={-34} cy={-12} rx={34} ry={24} fill={fill} />
    <ellipse cx={22} cy={-20} rx={40} ry={30} fill={fill} />
  </g>
);
