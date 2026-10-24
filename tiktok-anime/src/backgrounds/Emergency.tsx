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

// 滑り降りる人（横から）
const Slider: React.FC<{x: number; y: number; ang: number; shirt: string; hair: string}> = ({x, y, ang, shirt, hair}) => (
  <g transform={`translate(${x}, ${y}) rotate(${ang})`}>
    <line x1={10} y1={-10} x2={90} y2={-14} stroke="#2E2A28" strokeWidth={8} strokeLinecap="round" />
    <rect x={-30} y={-80} width={50} height={74} rx={18} fill={shirt} />
    <line x1={10} y1={-70} x2={60} y2={-96} stroke="#2E2A28" strokeWidth={7} strokeLinecap="round" />
    <circle cx={-6} cy={-118} r={34} fill="#F1D6C1" />
    <path d="M -40,-122 A 34 34 0 0 1 28,-124 L 20,-130 Q -6,-150 -34,-130 Z" fill={hair} />
    <circle cx={6} cy={-118} r={4.5} fill="#2A2522" />
  </g>
);

// 脱出スライド（機体の横から）。sliding で人が次々に滑り降りる、you で主人公が at 秒に滑る
export const EvacSlide: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const sky = skyKind(p.sky);
  const sliding = bool(p.sliding);
  const youAt = num(p.youAt, -1);
  // スライドの上端（ドア）と下端
  const top: [number, number] = [330, 820];
  const bottom: [number, number] = [930, 1420];
  const ang = (Math.atan2(bottom[1] - top[1], bottom[0] - top[0]) * 180) / Math.PI;
  const at = (u: number): [number, number] => [top[0] + (bottom[0] - top[0]) * u, top[1] + (bottom[1] - top[1]) * u];
  const people = sliding
    ? [0, 1, 2].map((i) => {
        const u = (t * 0.55 + i / 3) % 1;
        return {u, shirt: ['#8E6F6A', '#6F8A7A', '#A08B6A'][i], hair: ['#3A3330', '#5A463A', '#8C8984'][i]};
      })
    : [];
  const yu = youAt >= 0 ? interpolate(t, [youAt, youAt + 1.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)}) : -1;
  return (
    <g>
      <defs>
        <Grad id="es-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
        <Grad id="es-slide" from="#F2C14E" to="#E3A93A" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#es-sky)" />
      <rect x={0} y={1180} width={1080} height={740} fill="#4C5058" />
      <rect x={0} y={1180} width={1080} height={14} fill="#3C4048" />
      <g transform="translate(0, -200)">
      {/* 機体 */}
      <rect x={-200} y={420} width={1500} height={430} rx={200} fill="#EDEAE3" />
      <rect x={-200} y={700} width={1500} height={30} fill="#5C7088" />
      {[-120, 0, 520, 640, 760, 880].map((x) => (
        <rect key={x} x={x} y={560} width={56} height={72} rx={26} fill="#5C7088" />
      ))}
      {/* 開いたドア */}
      <rect x={240} y={500} width={170} height={330} rx={20} fill="#2A2D33" />
      <rect x={250} y={520} width={150} height={300} rx={14} fill="#F6EFD6" opacity={0.9} />
      <rect x={410} y={505} width={36} height={320} rx={10} fill="#C9C6BF" />
      {/* スライド */}
      <path d={`M ${top[0] - 70},${top[1]} L ${top[0] + 70},${top[1]} L ${bottom[0] + 60},${bottom[1] - 30} L ${bottom[0] - 40},${bottom[1] + 30} Z`} fill="url(#es-slide)" stroke="#C98F24" strokeWidth={8} strokeLinejoin="round" />
      <path d={`M ${top[0] - 70},${top[1]} L ${bottom[0] - 40},${bottom[1] + 30}`} stroke="#D99B2B" strokeWidth={26} strokeLinecap="round" />
      <path d={`M ${top[0] + 70},${top[1]} L ${bottom[0] + 60},${bottom[1] - 30}`} stroke="#D99B2B" strokeWidth={26} strokeLinecap="round" />
      <path d={`M ${bottom[0] - 60},${bottom[1] + 34} Q ${bottom[0] + 40},${bottom[1] + 60} ${bottom[0] + 120},${bottom[1] - 10}`} fill="none" stroke="#C98F24" strokeWidth={14} />
      {people.map((pp, i) => {
        const [x, y] = at(pp.u);
        return <Slider key={i} x={x} y={y - 10} ang={ang} shirt={pp.shirt} hair={pp.hair} />;
      })}
      {yu >= 0 && yu < 1 && (() => {
        const [x, y] = at(yu);
        return <Slider x={x} y={y - 10} ang={ang} shirt="#4A5D7E" hair="#3A3330" />;
      })()}
      {yu >= 1 && <Slider x={bottom[0] + 60} y={bottom[1] - 20} ang={0} shirt="#4A5D7E" hair="#3A3330" />}
      </g>
    </g>
  );
};

// 座席のすき間のアップ。phoneAt で隣の人のスマホが滑り込み、crushAt で座席が動いてつぶれる、smokeAt で煙
export const SeatGap: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const phoneAt = num(p.phoneAt, -1);
  const crushAt = num(p.crushAt, 9999);
  const smokeAt = num(p.smokeAt, 9999);
  const dim = bool(p.dim, true);
  const slide = phoneAt < 0 ? 1 : interpolate(t, [phoneAt, phoneAt + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const crush = interpolate(t, [crushAt, crushAt + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const spark = t > crushAt + 0.5 && t < crushAt + 1.6 && Math.floor(t * 12) % 2 === 0;
  const smoke = Math.max(0, Math.min(1, (t - smokeAt) / 0.8));
  const px = 540;
  const py = 700 + slide * 520;
  return (
    <g>
      <defs>
        <Grad id="sg-bg" from="#3B4656" to="#232A35" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sg-bg)" />
      {/* 座面（左右）とすき間 */}
      <rect x={-40} y={900} width={520} height={600} rx={60} fill="#6F8496" />
      <rect x={600} y={900} width={520} height={600} rx={60} fill="#6F8496" />
      <rect x={-40} y={900} width={520} height={90} rx={40} fill="#7D93A6" />
      <rect x={600} y={900} width={520} height={90} rx={40} fill="#7D93A6" />
      <rect x={470} y={960} width={140} height={700} fill="#151A21" />
      {/* 座席の機械（リクライニングの金具） */}
      <g transform={`translate(0, ${-crush * 90})`}>
        <rect x={430} y={1290} width={220} height={36} rx={8} fill="#8A9098" />
        <rect x={500} y={1240} width={80} height={130} rx={10} fill="#5E646D" />
        <circle cx={540} cy={1305} r={22} fill="#3A3F47" />
      </g>
      {/* スマホ */}
      <g transform={`translate(${px}, ${py}) rotate(${8 + crush * 18}) scale(${1}, ${1 - crush * 0.35})`}>
        <rect x={-34} y={-70} width={68} height={140} rx={12} fill="#2A2D33" stroke="#11141A" strokeWidth={4} />
        <rect x={-26} y={-58} width={52} height={112} rx={6} fill={crush > 0.5 ? '#3B2A2A' : '#7AB6C4'} opacity={0.9} />
        {crush > 0.5 && <path d="M -20,-40 L 10,0 L -8,20 L 22,50" stroke="#C9C6BF" strokeWidth={3} fill="none" />}
      </g>
      {spark && (
        <g transform={`translate(${px}, ${py - 60})`}>
          {[0, 50, 110, 170, 230, 290].map((a) => (
            <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 70} y2={Math.sin((a * Math.PI) / 180) * 70} stroke="#FFD25A" strokeWidth={6} strokeLinecap="round" />
          ))}
          <circle cx={0} cy={0} r={18} fill="#FFF2B0" />
        </g>
      )}
      {smoke > 0 &&
        Array.from({length: 8}).map((_, i) => {
          const u = (t * 0.5 + i / 8) % 1;
          return <circle key={i} cx={px + Math.sin(t * 2 + i) * 40 * u} cy={py - 60 - u * 700} r={(24 + u * 110) * smoke} fill={i % 3 ? '#D9D9DC' : '#8A8D92'} opacity={0.7 * (1 - u) * smoke} />;
        })}
      {dim && <rect x={0} y={0} width={1080} height={1920} fill="#0B1020" opacity={0.2} />}
    </g>
  );
};

// 気象レーダー（雨雲は映るが、晴天乱気流は映らない）。cat で「見えない乱気流」を点線で示す
export const WeatherRadar: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const cat = num(p.catAt, -1);
  const catShow = cat >= 0 ? Math.min(1, Math.max(0, (t - cat) / 0.6)) : 0;
  const cx = 540;
  const cy = 1260;
  const sweep = (t * 60) % 120 - 60;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#0F1620" />
      <rect x={90} y={300} width={900} height={1060} rx={30} fill="#1D252C" stroke="#33373E" strokeWidth={12} />
      <clipPath id="radar-clip">
        <path d={`M ${cx},${cy} L ${cx - 520},${cy - 900} A 1040 1040 0 0 1 ${cx + 520},${cy - 900} Z`} />
      </clipPath>
      <g clipPath="url(#radar-clip)">
        {[300, 600, 900].map((r) => (
          <path key={r} d={`M ${cx - r * 0.5},${cy - r * 0.866} A ${r} ${r} 0 0 1 ${cx + r * 0.5},${cy - r * 0.866}`} stroke="#3F7F68" strokeWidth={3} fill="none" opacity={0.7} />
        ))}
        {/* 雨雲（映る） */}
        <g transform="translate(300, 620)">
          <ellipse cx={0} cy={0} rx={120} ry={80} fill="#3E9E5A" opacity={0.85} />
          <ellipse cx={20} cy={10} rx={70} ry={45} fill="#E8C547" />
          <ellipse cx={30} cy={14} rx={30} ry={20} fill="#D9473C" />
        </g>
        <g transform={`rotate(${sweep}, ${cx}, ${cy})`}>
          <path d={`M ${cx},${cy} L ${cx - 60},${cy - 1000} L ${cx + 60},${cy - 1000} Z`} fill="#7FB89A" opacity={0.12} />
        </g>
        {catShow > 0 && (
          <g opacity={catShow}>
            <ellipse cx={620} cy={800} rx={170} ry={110} fill="none" stroke="#FF6B5E" strokeWidth={8} strokeDasharray="22 16" />
            <text x={620} y={815} textAnchor="middle" fontSize={64} fontWeight={900} fill="#FF6B5E" fontFamily="Noto Sans JP">？</text>
          </g>
        )}
      </g>
      <text x={300} y={760} textAnchor="middle" fontSize={34} fontWeight={900} fill="#E8E2D4" fontFamily="Noto Sans JP">雨雲</text>
      <path d={`M ${cx},${cy - 40} L ${cx - 24},${cy + 10} L ${cx + 24},${cy + 10} Z`} fill="#E8E2D4" />
      <text x={540} y={390} textAnchor="middle" fontSize={40} fontWeight={900} fill="#7FB89A" fontFamily="Noto Sans JP" letterSpacing={6}>WEATHER RADAR</text>
    </g>
  );
};
