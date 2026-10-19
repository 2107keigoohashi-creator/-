import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, bool, Grad, num, str} from './common';

// 経度・緯度 → 画面座標（関東〜北海道が縦長画面に収まる範囲）
const LON0 = 135.6;
const LAT0 = 45.9;
const K = 104;
export const proj = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, 250 + (LAT0 - lat) * K * 1.22];

const poly = (pts: number[][]) =>
  pts
    .map(([lon, lat], i) => {
      const [x, y] = proj(lon, lat);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

// ざっくりした海岸線（デフォルメ用）
const HOKKAIDO = [
  [141.94, 45.52], [142.6, 45.05], [143.3, 44.5], [144.2, 44.05], [144.8, 43.95], [145.35, 44.35], [145.1, 43.75],
  [145.6, 43.35], [145.2, 43.15], [144.4, 42.95], [143.6, 42.6], [143.25, 41.93], [142.5, 42.25], [141.7, 42.6],
  [141.0, 42.35], [140.6, 42.55], [140.95, 42.0], [140.75, 41.75], [140.1, 41.42], [139.95, 41.7], [140.05, 42.2],
  [139.8, 42.6], [140.5, 43.0], [140.35, 43.33], [141.3, 43.2], [141.4, 43.7], [141.65, 44.3], [141.75, 44.9],
];
const HONSHU = [
  [140.35, 41.25], [140.6, 41.05], [140.85, 40.9], [141.2, 41.2], [140.9, 41.5], [141.45, 41.42], [141.4, 40.6],
  [141.8, 40.3], [142.05, 39.55], [141.7, 38.9], [141.5, 38.3], [140.95, 38.1], [141.0, 37.6], [140.95, 37.0],
  [140.6, 36.3], [140.85, 35.72], [140.4, 35.15], [139.85, 34.9], [139.78, 35.4], [139.65, 35.15], [139.15, 35.25],
  [138.85, 34.6], [138.3, 34.6], [137.0, 34.5], [136.4, 34.3], [135.5, 34.3], [135.5, 35.6], [136.0, 35.75],
  [136.1, 36.3], [136.7, 36.9], [136.75, 37.35], [137.3, 37.5], [137.2, 37.0], [137.7, 36.95], [138.5, 37.4],
  [139.1, 37.9], [139.55, 38.4], [139.85, 38.9], [140.0, 39.4], [139.7, 39.95], [140.05, 40.0], [139.95, 40.6],
];
const SADO = [[138.25, 38.3], [138.55, 38.2], [138.5, 37.85], [138.2, 37.95]];

export const AIRPORTS: Record<string, {name: string; lon: number; lat: number}> = {
  HND: {name: '羽田', lon: 139.78, lat: 35.55},
  CTS: {name: '新千歳', lon: 141.69, lat: 42.78},
  HKD: {name: '函館', lon: 140.82, lat: 41.77},
  AOJ: {name: '青森', lon: 140.69, lat: 40.73},
  MSJ: {name: '三沢', lon: 141.39, lat: 40.7},
  AXT: {name: '秋田', lon: 140.22, lat: 39.62},
  HNA: {name: '花巻', lon: 141.13, lat: 39.43},
  SDJ: {name: '仙台', lon: 140.92, lat: 38.14},
  GAJ: {name: '山形', lon: 140.37, lat: 38.41},
  KIJ: {name: '新潟', lon: 139.12, lat: 37.95},
  FKS: {name: '福島', lon: 140.43, lat: 37.23},
};

export const PlaneIcon: React.FC<{x: number; y: number; rot: number; s?: number; fill?: string}> = ({x, y, rot, s = 1, fill = '#F4F1EA'}) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0,-40 Q 7,-34 7,-18 L 7,-6 L 40,12 L 40,20 L 7,10 L 6,28 L 18,36 L 18,42 L 0,37 L -18,42 L -18,36 L -6,28 L -7,10 L -40,20 L -40,12 L -7,-6 L -7,-18 Q -7,-34 0,-40 Z" fill={fill} stroke="#1B2433" strokeWidth={3} />
  </g>
);

// 日本地図（飛行機アイコンと空港の点）
export const JapanMap: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;

  const from = AIRPORTS[str(p.from, 'HND')];
  const to = AIRPORTS[str(p.to, 'CTS')];
  const a = proj(from.lon, from.lat);
  const b = proj(to.lon, to.lat);
  const progress = num(p.planeAt, 0.55);
  const divertTo = typeof p.divertTo === 'string' ? AIRPORTS[p.divertTo] : null;
  const divertAt = num(p.divertAt, 1.5);
  const glow = Array.isArray(p.glow) ? (p.glow as string[]) : [];
  const glowAt = num(p.glowAt, 0.6);

  const start: [number, number] = [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress];
  const baseRot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
  let plane = start;
  let rot = baseRot;
  let dPath = '';
  let dp = 0;
  if (divertTo) {
    const d = proj(divertTo.lon, divertTo.lat);
    const ctrl: [number, number] = [start[0] + 120, (start[1] + d[1]) / 2 - 40];
    dPath = `M ${start[0]},${start[1]} Q ${ctrl[0]},${ctrl[1]} ${d[0]},${d[1]}`;
    dp = interpolate(t, [divertAt, divertAt + 2.5], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    const q = (u: number): [number, number] => [
      (1 - u) * (1 - u) * start[0] + 2 * (1 - u) * u * ctrl[0] + u * u * d[0],
      (1 - u) * (1 - u) * start[1] + 2 * (1 - u) * u * ctrl[1] + u * u * d[1],
    ];
    plane = q(dp);
    const n = q(Math.min(1, dp + 0.01));
    if (dp > 0) rot = (Math.atan2(n[1] - plane[1], n[0] - plane[0]) * 180) / Math.PI + 90;
  }

  const traffic = bool(p.traffic);
  const tp = interpolate(t, [divertAt, divertAt + 2.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const others = [
    {x: start[0] - 90, y: start[1] - 160, dx: -160, dy: -40, r: 200},
    {x: start[0] + 110, y: start[1] + 120, dx: 170, dy: 60, r: 20},
    {x: start[0] - 120, y: start[1] + 200, dx: -150, dy: 90, r: 160},
  ];

  return (
    <g>
      <defs>
        <Grad id="map-sea" from="#1E2A3C" to="#131B28" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#map-sea)" />
      {Array.from({length: 12}).map((_, i) => (
        <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1920} stroke="#2C3A50" strokeWidth={2} />
      ))}
      {Array.from({length: 20}).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 100} x2={1080} y2={i * 100} stroke="#2C3A50" strokeWidth={2} />
      ))}
      {[HOKKAIDO, HONSHU, SADO].map((pts, i) => (
        <path key={i} d={poly(pts)} fill="#3E4C60" stroke="#5B6C84" strokeWidth={4} strokeLinejoin="round" />
      ))}
      {/* 予定ルート */}
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#9FB0C4" strokeWidth={5} strokeDasharray="14 14" opacity={0.6} />
      {/* 空港 */}
      {Object.entries(AIRPORTS).map(([code, ap]) => {
        const [x, y] = proj(ap.lon, ap.lat);
        const lit = glow.includes(code) && t >= glowAt;
        const isTarget = divertTo === ap;
        const pulse = lit ? 0.5 + 0.5 * Math.sin((t - glowAt) * Math.PI * 2 * 1.2) : 0;
        const fill = isTarget && dp > 0 ? '#F2C14E' : lit ? '#F2C14E' : '#9FB0C4';
        return (
          <g key={code}>
            {lit && <circle cx={x} cy={y} r={30 + pulse * 22} fill="#F2C14E" opacity={0.25 * (1 - pulse * 0.5)} />}
            <circle cx={x} cy={y} r={isTarget && dp > 0 ? 14 : 10} fill={fill} />
            <text x={x + 22} y={y + 10} fontSize={30} fontWeight={700} fill={lit || code === 'HND' || code === 'CTS' ? '#EDE7DA' : '#8695A8'} fontFamily="Noto Sans JP">
              {ap.name}
            </text>
          </g>
        );
      })}
      {divertTo && dp > 0 && <path d={dPath} stroke="#F2C14E" strokeWidth={6} fill="none" strokeDasharray="10 10" opacity={0.9} />}
      {traffic &&
        others.map((o, i) => (
          <PlaneIcon key={i} x={o.x + o.dx * tp} y={o.y + o.dy * tp} rot={o.r} s={0.7} fill="#8695A8" />
        ))}
      <PlaneIcon x={plane[0]} y={plane[1]} rot={rot} s={1.2} />
    </g>
  );
};
