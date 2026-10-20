import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Background, bool, Cloud, Grad, num, SKY, skyKind} from './common';

// 揺らめく炎（x, y が根元。左へなびく）
export const Flame: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  if (s <= 0.01) return null;
  const w = (k: number) => Math.sin(t * 13 + k) * 6 + Math.sin(t * 21 + k * 2) * 4;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <path d={`M 0,-26 Q ${-60 + w(1)},${-40 + w(2)} ${-130 + w(3)},${-6 + w(4)} Q ${-70 + w(5)},${6} ${-150 + w(6)},${28 + w(7)} Q ${-50},${30 + w(8)} 0,26 Z`} fill="#E8692E" opacity={0.92} />
      <path d={`M 0,-16 Q ${-40 + w(9)},${-22} ${-84 + w(10)},${0 + w(11)} Q ${-40},${16 + w(12)} 0,16 Z`} fill="#F6B640" />
      <path d={`M 0,-8 Q ${-22 + w(13)},${-8} ${-44 + w(14)},${2} Q ${-20},${8} 0,8 Z`} fill="#FCE7A0" />
      {[0, 1, 2].map((i) => {
        const u = (t * 0.9 + i / 3) % 1;
        return <circle key={i} cx={-160 - u * 140} cy={10 - u * 30 + w(i)} r={14 + u * 26} fill="#4A4A4E" opacity={0.45 * (1 - u)} />;
      })}
    </g>
  );
};

// 旅客機の客室（窓側席）。キャラクターは x≈620, y≈1330 に座らせる想定
export const Cabin: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const sky = skyKind(p.sky);
  const flash = bool(p.flashRed);
  const ground = bool(p.ground) || flash;
  const pulse = flash ? (Math.sin(t * Math.PI * 2 * 1.4) > 0.2 ? 1 : 0) : 0;
  // エンジン火災：fire（true で炎）、fireAt（燃え始める秒）、fireOutAt（消え始める秒）
  const fire = bool(p.fire);
  const engine = fire || bool(p.engine);
  const fireAt = num(p.fireAt, 0);
  const fireOutAt = num(p.fireOutAt, 9999);
  const grow = Math.min(1, Math.max(0, (t - fireAt) / 0.8));
  const shrink = Math.min(1, Math.max(0, (t - fireOutAt) / 2.5));
  const fireScale = fire ? grow * (1 - shrink) * (0.95 + Math.sin(t * 17) * 0.05) : 0;

  if (layer === 'front') {
    return (
      <g>
        {flash && <rect x={0} y={0} width={1080} height={1920} fill="#E53935" opacity={0.08 * pulse} />}
        {fireScale > 0 && <rect x={0} y={0} width={1080} height={1920} fill="#F08A3C" opacity={0.07 * fireScale} />}
      </g>
    );
  }

  const win = {x: 70, y: 470, w: 300, h: 430};
  return (
    <g>
      <defs>
        <Grad id="cabin-wall" from="#E9E3D7" to="#D8D0C2" />
        <Grad id="cabin-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
        <clipPath id="cabin-win">
          <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={130} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#cabin-wall)" />
      {/* 天井と荷物棚 */}
      <path d="M 0,0 L 1080,0 L 1080,300 Q 540,380 0,330 Z" fill="#EFEAE1" />
      <path d="M 0,330 Q 540,380 1080,300 L 1080,330 Q 540,410 0,362 Z" fill="#C9C1B3" />
      {[180, 540, 900].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={200} rx={34} ry={12} fill="#F8F3E6" />
          <circle cx={x} cy={200} r={6} fill="#E3D8B8" />
        </g>
      ))}
      {/* 窓 */}
      <rect x={win.x - 26} y={win.y - 26} width={win.w + 52} height={win.h + 52} rx={150} fill="#CFC6B6" />
      <g clipPath="url(#cabin-win)">
        <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="url(#cabin-sky)" />
        {sky === 'night' &&
          [0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={win.x + 30 + i * 47} cy={win.y + 40 + ((i * 53) % 120)} r={2.5} fill="#E9E6DA" opacity={0.7} />)}
        {!ground &&
          [0, 1, 2].map((i) => {
            const x = win.x + 360 - ((t * 40 + i * 140) % 520);
            return <Cloud key={i} x={x} y={win.y + 290 + i * 40} s={0.9 + i * 0.2} fill={sky === 'night' ? '#3A4560' : '#F4F1EA'} />;
          })}
        {!ground && (
          <path d={`M ${win.x + 20},${win.y + 330} L ${win.x + 330},${win.y + 250} L ${win.x + 330},${win.y + 290} L ${win.x + 60},${win.y + 350} Z`} fill={sky === 'night' ? '#4A5266' : '#D9DDE0'} />
        )}
        {!ground && engine && (
          <g>
            <rect x={win.x + 168} y={win.y + 300} width={14} height={30} fill="#B9BEC3" />
            <rect x={win.x + 120} y={win.y + 322} width={110} height={52} rx={26} fill="#C9CED3" />
            <ellipse cx={win.x + 228} cy={win.y + 348} rx={12} ry={24} fill="#5E646D" />
            <Flame x={win.x + 124} y={win.y + 348} s={fireScale} t={t} />
          </g>
        )}
        {ground && (
          <g>
            <rect x={win.x} y={win.y + 250} width={win.w} height={win.h} fill={sky === 'night' ? '#1C2230' : '#6F7A63'} />
            <rect x={win.x} y={win.y + 300} width={win.w} height={40} fill="#4C5058" />
            {flash && (
              <g>
                <circle cx={win.x + 210} cy={win.y + 280} r={60} fill="#E53935" opacity={0.35 * pulse} />
                <circle cx={win.x + 210} cy={win.y + 280} r={14} fill="#FF6B5E" opacity={0.4 + 0.6 * pulse} />
                <circle cx={win.x + 120} cy={win.y + 286} r={10} fill="#F5F0E0" opacity={0.3 + 0.7 * (1 - pulse)} />
              </g>
            )}
          </g>
        )}
      </g>
      <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={130} fill="none" stroke="#B8AE9C" strokeWidth={10} />
      {/* シェード */}
      <rect x={win.x + 20} y={win.y - 16} width={win.w - 40} height={34} rx={14} fill="#DCD4C6" />
      {/* 床と通路 */}
      <rect x={0} y={1540} width={1080} height={380} fill="#857B6E" />
      <path d="M 0,1540 L 1080,1540 L 1080,1560 L 0,1560 Z" fill="#6F665B" />
      {/* 隣の空席 22B */}
      <g transform="translate(980, 1330) scale(1.3)">
        <rect x={-108} y={-390} width={216} height={430} rx={40} fill="#6F8496" />
        <rect x={-92} y={-376} width={184} height={70} rx={22} fill="#E9E4DA" />
      </g>
      {flash && <rect x={0} y={0} width={1080} height={1540} fill="#E53935" opacity={0.06 * pulse} />}
    </g>
  );
};
