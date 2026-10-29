import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, Grad, num, str} from './common';
import {PlaneIcon} from './JapanMap';

// 東アジア〜東南アジアのざっくり地図（成田 → シンガポール便のダイバート用）
const proj = (lon: number, lat: number): [number, number] => [(lon - 98) * 22, 200 + (38 - lat) * 24];

const poly = (pts: number[][]) =>
  pts
    .map(([lon, lat], i) => {
      const [x, y] = proj(lon, lat);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

const LANDS = [
  // 本州・九州（デフォルメ）
  [[129.5, 33.2], [131.0, 31.3], [131.9, 33.4], [135.2, 33.6], [137.0, 34.5], [139.8, 34.9], [140.9, 35.7], [141.0, 38.0], [142.0, 40.0], [140.0, 40.5], [139.0, 38.0], [136.7, 37.2], [133.0, 35.5], [130.8, 34.3]],
  // 中国大陸〜インドシナ半島〜マレー半島
  [[98, 38], [122.0, 38.0], [121.5, 36.8], [120.0, 35.5], [121.8, 31.0], [121.0, 28.0], [119.5, 25.5], [116.5, 23.0], [113.5, 22.2], [110.0, 21.0], [108.0, 21.5], [106.5, 20.0], [105.5, 18.0], [107.5, 16.0], [109.2, 12.5], [109.0, 11.0], [105.0, 8.7], [104.8, 10.5], [103.0, 11.0], [100.9, 12.7], [99.2, 10.0], [100.3, 7.0], [102.3, 6.0], [103.4, 4.0], [104.2, 1.4], [103.4, 1.3], [101.0, 2.8], [100.2, 5.5], [98.3, 8.0], [98, 10]],
  // 台湾
  [[121.0, 25.3], [122.0, 25.0], [121.5, 23.0], [120.8, 21.9], [120.1, 23.0]],
  // ルソン島
  [[120.6, 18.5], [122.3, 18.4], [122.1, 16.5], [121.6, 15.0], [124.0, 13.0], [123.0, 13.2], [120.6, 13.8], [120.0, 16.0]],
  // ミンダナオなど
  [[122.0, 9.5], [126.5, 9.3], [126.3, 6.5], [125.0, 5.8], [122.0, 6.9]],
  // ボルネオ
  [[109.0, 1.5], [111.0, 2.8], [115.5, 5.2], [117.5, 6.9], [119.0, 5.0], [117.8, 1.0], [116.5, -2.0], [111.0, -3.0], [109.5, -1.0]],
  // スマトラ
  [[95.3, 5.6], [98, 4.0], [101.0, 2.0], [104.0, -1.0], [106.0, -3.0], [104.5, -5.9], [101.0, -3.0], [98, 0.5], [95, 3]],
  // 海南島
  [[108.6, 19.2], [110.5, 20.1], [111.0, 19.6], [110.0, 18.3], [109.0, 18.4]],
];

export const ASIA_AIRPORTS: Record<string, {name: string; lon: number; lat: number}> = {
  NRT: {name: '成田', lon: 140.39, lat: 35.77},
  OKA: {name: '那覇', lon: 127.65, lat: 26.2},
  TPE: {name: '台北', lon: 121.23, lat: 25.08},
  HKG: {name: '香港', lon: 113.92, lat: 22.31},
  MNL: {name: 'マニラ', lon: 121.02, lat: 14.51},
  SIN: {name: 'シンガポール', lon: 103.99, lat: 1.36},
};

export const AsiaMap: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;

  const from = ASIA_AIRPORTS[str(p.from, 'NRT')];
  const to = ASIA_AIRPORTS[str(p.to, 'SIN')];
  const a = proj(from.lon, from.lat);
  const b = proj(to.lon, to.lat);
  // 予定ルートは少し東にふくらむ曲線
  const rc: [number, number] = [(a[0] + b[0]) / 2 + 160, (a[1] + b[1]) / 2 - 20];
  const onRoute = (u: number): [number, number] => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * rc[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * rc[1] + u * u * b[1],
  ];
  const progress = num(p.planeAt, 0.4);
  const start = onRoute(progress);
  const ahead = onRoute(progress + 0.01);
  let plane = start;
  let rot = (Math.atan2(ahead[1] - start[1], ahead[0] - start[0]) * 180) / Math.PI + 90;

  const divertKey = typeof p.divertTo === 'string' ? p.divertTo : null;
  const divertTo = divertKey ? ASIA_AIRPORTS[divertKey] : null;
  const divertAt = num(p.divertAt, 1.0);
  let dPath = '';
  let dp = 0;
  if (divertTo) {
    const d = proj(divertTo.lon, divertTo.lat);
    const ctrl: [number, number] = [(start[0] + d[0]) / 2 + 40, (start[1] + d[1]) / 2 + 60];
    dPath = `M ${start[0]},${start[1]} Q ${ctrl[0]},${ctrl[1]} ${d[0]},${d[1]}`;
    dp = interpolate(t, [divertAt, divertAt + num(p.divertDur, 2.5)], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    const q = (u: number): [number, number] => [
      (1 - u) * (1 - u) * start[0] + 2 * (1 - u) * u * ctrl[0] + u * u * d[0],
      (1 - u) * (1 - u) * start[1] + 2 * (1 - u) * u * ctrl[1] + u * u * d[1],
    ];
    plane = q(dp);
    const nx = q(Math.min(1, dp + 0.01));
    if (dp > 0) rot = (Math.atan2(nx[1] - plane[1], nx[0] - plane[0]) * 180) / Math.PI + 90;
  }
  const routeD = `M ${a[0]},${a[1]} Q ${rc[0]},${rc[1]} ${b[0]},${b[1]}`;

  return (
    <g>
      <defs>
        <Grad id="asia-sea" from="#1E2A3C" to="#131B28" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#asia-sea)" />
      {Array.from({length: 12}).map((_, i) => (
        <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={1920} stroke="#2C3A50" strokeWidth={2} />
      ))}
      {Array.from({length: 20}).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 100} x2={1080} y2={i * 100} stroke="#2C3A50" strokeWidth={2} />
      ))}
      {LANDS.map((pts, i) => (
        <path key={i} d={poly(pts)} fill="#3E4C60" stroke="#5B6C84" strokeWidth={4} strokeLinejoin="round" />
      ))}
      <path d={routeD} stroke="#9FB0C4" strokeWidth={5} fill="none" strokeDasharray="14 14" opacity={0.6} />
      {Object.entries(ASIA_AIRPORTS).map(([code, ap]) => {
        const [x, y] = proj(ap.lon, ap.lat);
        const isTarget = code === divertKey;
        const lit = isTarget && t >= divertAt;
        const pulse = lit ? 0.5 + 0.5 * Math.sin((t - divertAt) * Math.PI * 2 * 1.2) : 0;
        const main = code === str(p.from, 'NRT') || code === str(p.to, 'SIN');
        return (
          <g key={code}>
            {lit && <circle cx={x} cy={y} r={30 + pulse * 22} fill="#F2C14E" opacity={0.25 * (1 - pulse * 0.5)} />}
            <circle cx={x} cy={y} r={lit ? 14 : 10} fill={lit ? '#F2C14E' : '#9FB0C4'} />
            <text x={x + (code === 'SIN' || code === 'HKG' ? -10 : 22)} y={y + (code === 'SIN' ? 52 : 10)} textAnchor={code === 'SIN' || code === 'HKG' ? (code === 'HKG' ? 'end' : 'start') : 'start'} fontSize={lit ? 40 : 30} fontWeight={700} fill={lit ? '#F2C14E' : main ? '#EDE7DA' : '#8695A8'} fontFamily="Noto Sans JP">
              {ap.name}
            </text>
          </g>
        );
      })}
      {divertTo && dp > 0 && <path d={dPath} stroke="#F2C14E" strokeWidth={6} fill="none" strokeDasharray="10 10" opacity={0.9} />}
      <PlaneIcon x={plane[0]} y={plane[1]} rot={rot} s={1.1} />
    </g>
  );
};
