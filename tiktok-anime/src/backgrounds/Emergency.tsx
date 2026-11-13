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
  // pitch（度、マイナスで機首下げ）を pitchAt 秒から。降下中は雲が上へ流れる
  const pitchK = Math.min(1, Math.max(0, (t - num(p.pitchAt, 0)) / 1.2));
  const pitch = num(p.pitch, 0) * pitchK;
  const rise = Math.max(0, -pitch) * 26;
  return (
    <g>
      <defs>
        <Grad id="sp-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#sp-sky)" />
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 1300 - ((t * 160 + i * 330) % 1700);
        const cy = (((420 + ((i * 271) % 900) - t * rise) % 1700) + 1700) % 1700;
        return <Cloud key={i} x={cx} y={cy} s={1.4 + (i % 3) * 0.5} opacity={0.75} />;
      })}
      {smoke &&
        Array.from({length: 7}).map((_, i) => {
          const u = (t * 0.7 + i / 7) % 1;
          return <circle key={i} cx={x - 40 - u * 520} cy={y + 40 - u * 40} r={18 + u * 50} fill="#6B6E73" opacity={0.5 * (1 - u)} />;
        })}
      <g transform={`translate(${x}, ${y}) scale(1.6)`}>
        <Airliner x={0} y={0} rot={-2 - pitch} s={1} />
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

// 夜の進入（コックピットから見た滑走路）。from→to で近づく（0〜1）、intruderAt で滑走路上に別の機体、goAt でゴーアラウンド（滑走路が下へ消える）
export const Approach: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  if (layer === 'front') {
    return (
      <g>
        {/* 窓枠 */}
        <path d="M 0,0 L 1080,0 L 1080,1920 L 0,1920 Z M 70,330 L 1010,330 L 960,1130 L 120,1130 Z" fill="#2A2D33" fillRule="evenodd" />
        <rect x={0} y={1130} width={1080} height={790} fill="#33373E" />
        <rect x={140} y={1180} width={330} height={220} rx={12} fill="#1D252C" />
        <rect x={610} y={1180} width={330} height={220} rx={12} fill="#1D252C" />
      </g>
    );
  }
  const t = frame / fps;
  const from = num(p.from, 0.3);
  const to = num(p.to, 0.6);
  const goAt = num(p.goAt, -1);
  const total = durationInFrames / fps;
  const go = goAt >= 0 ? interpolate(t, [goAt, goAt + 2.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : 0;
  const prog = interpolate(t, [0, total], [from, to], {extrapolateRight: 'clamp'});
  // 近づくほど滑走路が大きく、手前に広がる。ゴーアラウンドで地面が下へ
  const horizon = 560 + go * 700;
  const near = 1130 + (1 - prog) * -380;
  const half = 60 + prog * 520;
  const farHalf = 14 + prog * 30;
  const cx = 540;
  const lights = 14;
  const intruderAt = num(p.intruderAt, -1);
  const intr = intruderAt >= 0 ? Math.min(1, Math.max(0, (t - intruderAt) / 0.6)) : 0;
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
  return (
    <g>
      <defs>
        <Grad id="ap-sky" from="#0B1020" to="#1E2A44" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#ap-sky)" />
      {[...Array(18)].map((_, i) => (
        <circle key={i} cx={(i * 197) % 1080} cy={360 + ((i * 89) % 160)} r={2} fill="#E9E6DA" opacity={0.6} />
      ))}
      <rect x={0} y={horizon} width={1080} height={1920} fill="#0E121A" />
      {/* 街の明かり */}
      {[...Array(40)].map((_, i) => (
        <circle key={i} cx={(i * 137) % 1080} cy={horizon + 10 + ((i * 53) % 60)} r={2.5} fill={i % 3 ? '#F2C14E' : '#E9E6DA'} opacity={0.7} />
      ))}
      {/* 滑走路 */}
      <path d={`M ${cx - farHalf},${horizon + 4} L ${cx + farHalf},${horizon + 4} L ${cx + half},${near + go * 700} L ${cx - half},${near + go * 700} Z`} fill="#1A1D24" />
      {[...Array(lights)].map((_, i) => {
        const u = i / (lights - 1);
        const k = u * u;
        const y = lerp(horizon + 4, near + go * 700, k);
        const hw = lerp(farHalf, half, k);
        const r = 2 + k * 9;
        return (
          <g key={i}>
            <circle cx={cx - hw} cy={y} r={r} fill="#F4F1EA" />
            <circle cx={cx + hw} cy={y} r={r} fill="#F4F1EA" />
            {i % 2 === 0 && <rect x={cx - r * 0.6} y={y - r * 0.3} width={r * 1.2} height={r * 0.6} fill="#E9E6DA" opacity={0.7} />}
          </g>
        );
      })}
      {/* 進入灯 */}
      {[...Array(5)].map((_, i) => {
        const y = near + go * 700 + 30 + i * 40;
        return <rect key={i} x={cx - 80 - i * 20} y={y} width={160 + i * 40} height={6} fill="#F2C14E" opacity={0.85} />;
      })}
      {/* 滑走路上の別の機体 */}
      {intr > 0 && (
        <g opacity={intr} transform={`translate(${cx + 6}, ${lerp(horizon + 4, near + go * 700, 0.35)}) scale(${(0.6 + prog * 1.4) * 2.2})`}>
          <rect x={-60} y={-10} width={120} height={18} rx={9} fill="#3A3F47" />
          <rect x={-8} y={-26} width={16} height={18} fill="#3A3F47" />
          <circle cx={-64} cy={-2} r={6} fill="#FF4D3D" />
          <circle cx={64} cy={-2} r={6} fill="#4DE07A" />
          {blink && <circle cx={0} cy={-30} r={9} fill="#FFFFFF" />}
          {blink && <circle cx={0} cy={-30} r={22} fill="#FFFFFF" opacity={0.25} />}
        </g>
      )}
    </g>
  );
};

// ゴーアラウンドの説明図（横から見た進入経路）。drawAt から線が描かれる
export const PathDiagram: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const at = num(p.drawAt, 0.3);
  const d = interpolate(t, [at, at + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const path = 'M 80,560 L 600,1040 Q 680,1110 760,1000 Q 900,760 980,520';
  const len = 1500;
  return (
    <g>
      <defs>
        <Grad id="pd-bg" from="#1E2A3C" to="#131B28" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#pd-bg)" />
      <rect x={40} y={1100} width={1000} height={20} fill="#4C5058" />
      <rect x={560} y={1094} width={300} height={10} fill="#E9E4DA" />
      <text x={710} y={1170} textAnchor="middle" fontSize={40} fontWeight={900} fill="#9FB0C4" fontFamily="Noto Sans JP">滑走路</text>
      <path d="M 80,560 L 680,1104" stroke="#5B6C84" strokeWidth={6} strokeDasharray="16 14" fill="none" />
      <path d={path} stroke="#F2C14E" strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={`${len * d} ${len}`} />
      {d > 0.55 && (
        <text x={850} y={720} textAnchor="middle" fontSize={50} fontWeight={900} fill="#F2C14E" fontFamily="Noto Sans JP" opacity={Math.min(1, (d - 0.55) * 4)}>
          上昇してやり直し
        </text>
      )}
      <text x={250} y={600} fontSize={44} fontWeight={900} fill="#9FB0C4" fontFamily="Noto Sans JP">進入</text>
    </g>
  );
};

// 停止線灯（ストップバー）。滑走路の手前で赤く光る。offAt で消灯、planeAt から小型機が近づいて止まる（goAt 以降は進む）
export const StopBar: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const offAt = num(p.offAt, 999);
  const lit = t < offAt;
  const glow = lit ? 0.6 + 0.4 * Math.sin(t * 6) : 0;
  const stopY = 1020;
  const go = num(p.goAt, 999);
  const approach = interpolate(t, [0, 1.6], [1650, stopY + 150], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const py = t > go ? approach - (t - go) * 320 : approach;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#141A22" />
      {/* 滑走路（横） */}
      <rect x={0} y={720} width={1080} height={220} fill="#2B2F36" />
      {[...Array(9)].map((_, i) => (
        <rect key={i} x={20 + i * 130} y={824} width={70} height={10} fill="#E9E4DA" />
      ))}
      <text x={980} y={705} textAnchor="end" fontSize={40} fontWeight={900} fill="#9FB0C4" fontFamily="Noto Sans JP">滑走路</text>
      {/* 誘導路（縦） */}
      <path d="M 400,940 L 680,940 L 760,1920 L 320,1920 Z" fill="#23272D" />
      <path d="M 540,940 L 540,1920" stroke="#E8C547" strokeWidth={8} strokeDasharray="30 20" />
      {/* 停止位置の黄色い線 */}
      <rect x={390} y={990} width={300} height={10} fill="#E8C547" />
      <rect x={390} y={1010} width={300} height={10} fill="#E8C547" />
      {/* 停止線灯 */}
      {[...Array(7)].map((_, i) => (
        <g key={i}>
          {lit && <circle cx={410 + i * 43} cy={stopY + 20} r={30} fill="#FF3B30" opacity={0.25 * glow} />}
          <circle cx={410 + i * 43} cy={stopY + 20} r={11} fill={lit ? '#FF3B30' : '#4A3A3A'} />
        </g>
      ))}
      {/* 小型機（上から） */}
      <g transform={`translate(540, ${py})`}>
        <rect x={-14} y={-70} width={28} height={140} rx={14} fill="#E9E4DA" />
        <rect x={-110} y={-20} width={220} height={26} rx={10} fill="#D2CEC6" />
        <rect x={-50} y={50} width={100} height={16} rx={6} fill="#D2CEC6" />
        <circle cx={-110} cy={-7} r={6} fill="#FF4D3D" />
        <circle cx={110} cy={-7} r={6} fill="#4DE07A" />
      </g>
      <text x={540} y={640} textAnchor="middle" fontSize={52} fontWeight={900} fill={lit ? '#FF6B5E' : '#7FD39A'} fontFamily="Noto Sans JP">
        {lit ? '停止線灯：赤＝止まれ' : '消灯＝進んでよい'}
      </text>
    </g>
  );
};

// 2017年 サンフランシスコの事例（上から見た滑走路と誘導路）。drawAt から進入、goAt で上昇
export const SfoDiagram: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const drawAt = num(p.drawAt, 0.3);
  const u = interpolate(t, [drawAt, drawAt + 2.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const goAt = num(p.goAt, 999);
  const g = interpolate(t, [goAt, goAt + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const showPlanes = bool(p.planes, true);
  // 進入する機体（右下から左上へ、誘導路の上へ）
  const x = 1000 - u * 520 - g * 200;
  const y = 1240 - u * 340 - g * 240;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#0F1620" />
      <g transform="rotate(-30, 540, 900)">
        {/* 滑走路 28R / 28L */}
        <rect x={-200} y={760} width={1480} height={90} fill="#2B2F36" />
        <rect x={-200} y={600} width={1480} height={90} fill="#2B2F36" />
        {/* 誘導路 C */}
        <rect x={-200} y={930} width={1480} height={60} fill="#23272D" />
        <line x1={-200} y1={960} x2={1280} y2={960} stroke="#E8C547" strokeWidth={4} strokeDasharray="20 14" />
        {showPlanes &&
          [0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${120 + i * 150}, 960)`}>
              <rect x={-40} y={-8} width={80} height={16} rx={8} fill="#B9BEC3" />
              <rect x={-8} y={-38} width={16} height={76} rx={6} fill="#B9BEC3" />
            </g>
          ))}
      </g>
      <text x={160} y={540} fontSize={38} fontWeight={900} fill="#9FB0C4" fontFamily="Noto Sans JP" transform="rotate(-30, 160, 540)">滑走路 28R</text>
      <text x={330} y={760} fontSize={38} fontWeight={900} fill="#E8C547" fontFamily="Noto Sans JP" transform="rotate(-30, 330, 760)">誘導路C（4機が待機）</text>
      {u > 0 && (
        <g transform={`translate(${x}, ${y}) rotate(-120)`}>
          <path d="M 0,-34 L 8,-8 L 36,6 L 36,14 L 8,8 L 6,26 L 16,34 L 0,30 L -16,34 L -6,26 L -8,8 L -36,14 L -36,6 L -8,-8 Z" fill={g > 0 ? '#7FD39A' : '#F2C14E'} stroke="#111" strokeWidth={3} />
        </g>
      )}
      {g > 0.3 && (
        <text x={540} y={420} textAnchor="middle" fontSize={56} fontWeight={900} fill="#7FD39A" fontFamily="Noto Sans JP" opacity={Math.min(1, g * 2)}>
          ゴーアラウンド！
        </text>
      )}
    </g>
  );
};

// 機体の横の壁に穴があいた図（アラスカ航空1282便）。holeAt 秒で穴、markAt 秒で空席の印
export const DoorPlug: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const holeAt = num(p.holeAt, 0);
  const markAt = num(p.markAt, 99);
  const hole = t >= holeAt;
  const pop = Math.min(1, Math.max(0, (t - markAt) / 0.3));
  const hx = 470;
  const hy = 640;
  return (
    <g>
      <defs>
        <Grad id="dp-sky" from="#8FB3D1" to="#D7E4EC" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#dp-sky)" />
      {/* 胴体の一部（横から） */}
      <rect x={-40} y={380} width={1160} height={620} rx={40} fill="#EDEAE3" />
      <rect x={-40} y={880} width={1160} height={30} fill="#2F4D7A" />
      {[90, 250, 730, 890, 1050].map((x) => (
        <rect key={x} x={x - 40} y={560} width={80} height={110} rx={36} fill="#5C7088" />
      ))}
      {/* ドアプラグ（ふさがれた非常口） */}
      {!hole && <rect x={hx - 90} y={hy - 170} width={180} height={340} rx={24} fill="none" stroke="#C9C6BF" strokeWidth={6} />}
      {hole && (
        <g>
          <rect x={hx - 92} y={hy - 172} width={184} height={344} rx={26} fill="#2A2D33" />
          {/* 中の座席 26A・26B */}
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${hx - 50 + i * 100}, ${hy + 110})`}>
              <rect x={-38} y={-150} width={76} height={160} rx={18} fill="#4E6A86" />
              <rect x={-32} y={-144} width={64} height={36} rx={10} fill="#C9C6BF" />
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const u = ((t - holeAt) * 0.9 + i / 6) % 1;
            return <line key={i} x1={hx + 60 - u * 300} y1={hy - 140 + i * 50} x2={hx - 40 - u * 420} y2={hy - 140 + i * 50} stroke="#FFFFFF" strokeWidth={6} opacity={0.6 * (1 - u)} />;
          })}
        </g>
      )}
      {pop > 0 && (
        <g transform={`translate(${hx}, ${hy + 260}) scale(${pop})`}>
          <rect x={-200} y={0} width={400} height={96} rx={20} fill="#1E1E1E" />
          <text x={0} y={64} textAnchor="middle" fontSize={50} fontWeight={900} fill="#F2C14E" fontFamily="Noto Sans JP">
            26A・26B は空席
          </text>
        </g>
      )}
    </g>
  );
};

// 雷が機体に落ちる図（横から）。strikeAt 秒で機首に落ち、電気が外側を流れて尾翼と翼の先から抜ける
// wicks で翼の先と尾翼の放電索（静電気を逃がす細い棒）を光らせる、cage で外側を囲む線
export const LightningPlane: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const at = num(p.strikeAt, 0.5);
  const u = t - at;
  const x = 540;
  const y = 860;
  const s = 1.7;
  // 機体の外側をたどる道（機首 → 胴体の上 → 尾翼）
  const nose: [number, number] = [x + 250 * s, y - 10 * s];
  const tail: [number, number] = [x - 240 * s, y - 140 * s];
  const flow = Math.min(1, Math.max(0, u / 0.8));
  const flash = u >= 0 && u < 0.25;
  const bolt = (x0: number, y0: number, x1: number, y1: number, seed: number) => {
    const pts = Array.from({length: 7}).map((_, i) => {
      const k = i / 6;
      const j = i === 0 || i === 6 ? 0 : Math.sin(seed * 13 + i * 7.3) * 40;
      return `${x0 + (x1 - x0) * k + j},${y0 + (y1 - y0) * k}`;
    });
    return `M ${pts.join(' L ')}`;
  };
  const sky = skyKind(p.sky ?? 'night');
  return (
    <g>
      <defs>
        <Grad id="lp-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#lp-sky)" />
      {[0, 1, 2].map((i) => (
        <Cloud key={i} x={200 + i * 340} y={300 + (i % 2) * 120} s={2.4} fill="#3E4558" opacity={0.9} />
      ))}
      {flash && <rect x={0} y={0} width={1080} height={1920} fill="#FFFFFF" opacity={0.35 * (1 - u / 0.25)} />}
      <g transform={`translate(${x}, ${y}) scale(${s})`}>
        <Airliner x={0} y={0} rot={0} s={1} />
      </g>
      {bool(p.cage) && (
        <path d={`M ${x - 230 * s},${y - 10 * s} Q ${x - 240 * s},${y - 44 * s} ${x - 200 * s},${y - 46 * s} L ${x + 170 * s},${y - 46 * s} Q ${x + 244 * s},${y - 42 * s} ${x + 254 * s},${y - 6 * s} Q ${x + 244 * s},${y + 22 * s} ${x + 170 * s},${y + 24 * s} L ${x - 200 * s},${y + 24 * s} Q ${x - 238 * s},${y + 20 * s} ${x - 230 * s},${y - 10 * s} Z`} stroke="#7FD3FF" strokeWidth={8} fill="none" strokeDasharray="18 12" opacity={0.9} />
      )}
      {u >= 0 && u < 0.6 && <path d={bolt(nose[0] + 40, 0, nose[0], nose[1], 1)} stroke="#FFF6C8" strokeWidth={12} fill="none" strokeLinejoin="bevel" />}
      {u >= 0 && (
        <g>
          {/* 外側を流れる電気 */}
          <path d={`M ${nose[0]},${nose[1]} L ${x + 170 * s},${y - 46 * s} L ${x - 200 * s},${y - 46 * s} L ${tail[0]},${tail[1]}`} stroke="#FFE36E" strokeWidth={10} fill="none" pathLength={1} strokeDasharray={`${flow} 1`} opacity={u < 2.5 ? 1 : 0.4} />
          {flow >= 1 && u < 1.4 && <path d={bolt(tail[0], tail[1], tail[0] - 120, -40, 2)} stroke="#FFF6C8" strokeWidth={10} fill="none" strokeLinejoin="bevel" />}
        </g>
      )}
      {bool(p.wicks) &&
        [[tail[0] + 4, tail[1] + 4], [x - 120 * s + 4, y + 70 * s]].map(([wx, wy], i) => {
          const glow = 0.5 + 0.5 * Math.sin(t * 6 + i);
          return (
            <g key={i}>
              <circle cx={wx} cy={wy} r={30 + glow * 16} fill="#7FD3FF" opacity={0.3} />
              <line x1={wx} y1={wy} x2={wx - 40} y2={wy + 6} stroke="#E9E4DA" strokeWidth={6} />
            </g>
          );
        })}
    </g>
  );
};

// 夜の駐機場で機首のアップ。burn で小さな焦げ跡、burnAt 秒から光って目立つ
export const RampNose: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const burnAt = num(p.burnAt, 0);
  const lit = bool(p.burn) && t >= burnAt;
  const ring = lit ? 0.5 + 0.5 * Math.sin((t - burnAt) * 6) : 0;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#141A26" />
      {[160, 540, 920].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={120} width={12} height={360} fill="#2C3444" />
          <ellipse cx={x} cy={120} rx={40} ry={14} fill="#F7E7B0" />
          <path d={`M ${x - 30},130 L ${x - 260},1500 L ${x + 260},1500 L ${x + 30},130 Z`} fill="#F7E7B0" opacity={0.05} />
        </g>
      ))}
      <rect x={0} y={1480} width={1080} height={440} fill="#2A2F38" />
      <rect x={0} y={1600} width={1080} height={14} fill="#C9A43A" opacity={0.6} />
      {/* 機首（右向き、画面の右からはみ出す） */}
      <path d="M -60,520 L 700,520 Q 1040,540 1120,820 Q 1040,1100 700,1120 L -60,1120 Z" fill="#E3E0D8" />
      <path d="M 820,600 Q 960,640 1010,760 L 860,760 Z" fill="#2E3A4C" />
      <rect x={-60} y={1000} width={1180} height={30} fill="#2F4D7A" />
      {[80, 260, 440].map((x) => (
        <rect key={x} x={x} y={700} width={70} height={100} rx={32} fill="#4E5E72" />
      ))}
      <rect x={560} y={600} width={150} height={360} rx={14} fill="none" stroke="#B9B5AE" strokeWidth={6} />
      <line x1={700} y1={1120} x2={700} y2={1440} stroke="#3A3E45" strokeWidth={22} />
      <circle cx={700} cy={1450} r={44} fill="#22252B" />
      {bool(p.burn) && (
        <g>
          {lit && <circle cx={930} cy={900} r={60 + ring * 30} fill="none" stroke="#F2C14E" strokeWidth={8} opacity={0.9 - ring * 0.5} />}
          <circle cx={930} cy={900} r={14} fill="#3A3330" />
          <circle cx={922} cy={894} r={7} fill="#1E1A18" />
        </g>
      )}
    </g>
  );
};

// 翼の中の燃料タンクの断面。sparkAt 秒で火花（safe なら火花は外側で止まる）
export const FuelTank: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const safe = bool(p.safe);
  const sparkAt = num(p.sparkAt, 99);
  const u = t - sparkAt;
  const boom = !safe && u >= 0 ? Math.min(1, u / 0.6) : 0;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={safe ? '#1E2A3C' : '#1A1414'} />
      {/* 翼の断面 */}
      <path d="M 80,760 Q 200,520 560,500 Q 900,500 1000,700 Q 900,820 560,840 Q 220,860 80,760 Z" fill="#C9CED3" stroke={safe ? '#7FD3FF' : '#9AA1A8'} strokeWidth={safe ? 12 : 6} />
      <rect x={300} y={580} width={480} height={200} rx={20} fill="#3A3E45" />
      <rect x={300} y={700} width={480} height={80} rx={14} fill="#B98A3A" opacity={0.85} />
      {/* 燃料の蒸気 */}
      {Array.from({length: 14}).map((_, i) => {
        const x = 330 + ((i * 67 + t * 30) % 420);
        const y = 610 + ((i * 37) % 80) + Math.sin(t * 2 + i) * 6;
        return <circle key={i} cx={x} cy={y} r={8} fill="#D9C27A" opacity={0.6} />;
      })}
      <text x={540} y={460} textAnchor="middle" fontSize={44} fontWeight={900} fill="#EDE7DA" fontFamily="Noto Sans JP">
        翼の中の燃料タンク
      </text>
      {u >= 0 && u < 0.5 && <path d="M 560,0 L 520,220 L 580,240 L 540,500" stroke="#FFF6C8" strokeWidth={12} fill="none" strokeLinejoin="bevel" />}
      {u >= 0 && !safe && u < 0.4 && <circle cx={540} cy={640} r={16} fill="#FFF6C8" />}
      {boom > 0 && <circle cx={540} cy={680} r={40 + boom * 320} fill="#E8692E" opacity={0.8 * (1 - boom * 0.6)} />}
      {safe && u >= 0 && u < 1.2 && (
        <path d="M 540,500 Q 300,520 120,740" stroke="#FFE36E" strokeWidth={10} fill="none" pathLength={1} strokeDasharray={`${Math.min(1, u / 0.6)} 1`} />
      )}
    </g>
  );
};

// 雷の試験（研究所で部品に強い電気を当てる）。boltEvery 秒ごとに放電
export const LabTest: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const every = num(p.boltEvery, 1.6);
  const k = (t % every) / every;
  const on = k < 0.12;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#232833" />
      <rect x={0} y={1300} width={1080} height={620} fill="#30353F" />
      {/* 発生装置 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={120} y={380 + i * 120} width={180} height={90} rx={14} fill="#5C6676" stroke="#8A94A6" strokeWidth={4} />
      ))}
      <circle cx={210} cy={330} r={56} fill="#9AA1A8" />
      {/* 試験する翼のパネル */}
      <path d="M 560,1000 L 980,940 L 1000,1080 L 580,1150 Z" fill="#C9CED3" stroke="#7FD3FF" strokeWidth={6} />
      <rect x={760} y={1150} width={20} height={150} fill="#4A4F57" />
      {on && (
        <g>
          <rect x={0} y={0} width={1080} height={1920} fill="#FFFFFF" opacity={0.25} />
          <path d="M 260,330 L 420,520 L 380,560 L 560,760 L 520,800 L 760,1010" stroke="#FFF6C8" strokeWidth={14} fill="none" strokeLinejoin="bevel" />
        </g>
      )}
      <text x={540} y={1440} textAnchor="middle" fontSize={44} fontWeight={900} fill="#EDE7DA" fontFamily="Noto Sans JP">
        雷の試験（イメージ）
      </text>
    </g>
  );
};

// 上から見た地図：空港には届かない／目の前に川。airportAt で空港へのルートに✕、riverAt で川へのルート
export const GlideMap: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const aAt = num(p.airportAt, 99);
  const rAt = num(p.riverAt, 99);
  const ka = Math.min(1, Math.max(0, (t - aAt) / 1.0));
  const kr = Math.min(1, Math.max(0, (t - rAt) / 1.0));
  const plane: [number, number] = [620, 1000];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#5E6B57" />
      {Array.from({length: 40}).map((_, i) => (
        <rect key={i} x={(i % 8) * 140 + 10} y={Math.floor(i / 8) * 170 + 150} width={110} height={130} rx={8} fill="#7A8270" opacity={0.6} />
      ))}
      {/* 大きな川（縦に流れる） */}
      <path d="M 220,0 Q 300,500 240,900 Q 180,1300 300,1920 L 520,1920 Q 400,1300 460,900 Q 520,500 440,0 Z" fill="#4E7FA0" />
      {/* 空港（右上） */}
      <g transform="translate(860, 330) rotate(-20)">
        <rect x={-150} y={-24} width={300} height={48} fill="#3A3E45" />
        <rect x={-150} y={-2} width={300} height={4} fill="#E9E4DA" />
      </g>
      <text x={860} y={250} textAnchor="middle" fontSize={44} fontWeight={900} fill="#F4F1EA" fontFamily="Noto Sans JP">空港</text>
      <text x={420} y={560} textAnchor="middle" fontSize={56} fontWeight={900} fill="#F4F1EA" fontFamily="Noto Sans JP">川</text>
      {ka > 0 && (
        <g>
          <path d={`M ${plane[0]},${plane[1]} Q 900,800 860,360`} stroke="#FF6B5E" strokeWidth={10} fill="none" strokeDasharray="20 16" pathLength={1} opacity={0.9} />
          <g transform={`translate(840, 640) scale(${ka})`}>
            <circle r={70} fill="#E53935" />
            <path d="M -32,-32 L 32,32 M 32,-32 L -32,32" stroke="#FFFFFF" strokeWidth={16} strokeLinecap="round" />
          </g>
          <text x={840} y={780} textAnchor="middle" fontSize={44} fontWeight={900} fill="#FFFFFF" fontFamily="Noto Sans JP" opacity={ka}>届かない</text>
        </g>
      )}
      {kr > 0 && <path d={`M ${plane[0]},${plane[1]} Q 420,1000 360,${1000 + 300 * kr}`} stroke="#7FE0A0" strokeWidth={12} fill="none" strokeDasharray="20 14" />}
      <PlaneTop x={plane[0]} y={plane[1]} />
    </g>
  );
};

const PlaneTop: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x}, ${y}) rotate(-90) scale(1.4)`}>
    <path d="M 0,-40 Q 7,-34 7,-18 L 7,-6 L 40,12 L 40,20 L 7,10 L 6,28 L 18,36 L 18,42 L 0,37 L -18,42 L -18,36 L -6,28 L -7,10 L -40,20 L -40,12 L -7,-6 L -7,-18 Q -7,-34 0,-40 Z" fill="#F4F1EA" stroke="#1B2433" strokeWidth={3} />
  </g>
);

// 川に着水する（横から）。touchAt 秒で水面に触れて水しぶき、その後は浮いている
// floating で最初から浮いている、wing で翼の上に人、ferry で救助の船
export const RiverDitch: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const touch = num(p.touchAt, 2.4);
  const floating = bool(p.floating);
  const waterY = num(p.waterY, 1000);
  if (layer === 'front') {
    return (
      <g>
        <rect x={0} y={waterY + 40} width={1080} height={1920 - waterY} fill="#3E6A80" opacity={0.55} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M 0,${waterY + 60 + i * 120 + Math.sin(t * 1.5 + i) * 6} q 135,-14 270,0 t 270,0 t 270,0 t 270,0`} stroke="#8DB3C6" strokeWidth={5} fill="none" opacity={0.6} />
        ))}
      </g>
    );
  }
  const u = floating ? 99 : t - touch;
  const k = Math.min(1, Math.max(0, (t + 0.0001) / Math.max(0.1, touch)));
  const px = floating ? 560 : u < 0 ? interpolate(k, [0, 1], [-100, 520]) : 520 + (1 - Math.exp(-u * 1.5)) * 60;
  const py = floating ? waterY + 10 : u < 0 ? interpolate(k, [0, 1], [700, waterY - 10]) : waterY + Math.min(20, u * 40);
  const rot = floating ? 0 : u < 0 ? 6 : Math.max(0, 6 - u * 6);
  const bob = Math.sin(t * 1.4) * 4;
  return (
    <g>
      <defs>
        <Grad id="rd-sky" from="#9BB2C4" to="#D3DCE2" />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#rd-sky)" />
      {/* 街並み */}
      {Array.from({length: 14}).map((_, i) => {
        const h = 160 + ((i * 97) % 260);
        return <rect key={i} x={i * 80 - 10} y={waterY - 40 - h} width={70} height={h} fill={i % 2 ? '#8A96A3' : '#7A8794'} />;
      })}
      <rect x={0} y={waterY - 40} width={1080} height={40} fill="#6D7A70" />
      <rect x={0} y={waterY} width={1080} height={1920 - waterY} fill="#4E7FA0" />
      {bool(p.ferry) && (
        <g transform={`translate(${1180 - Math.min(1, t / 3) * 360}, ${waterY + 120 + bob})`}>
          <path d="M -200,0 L 200,0 L 170,60 L -170,60 Z" fill="#F2EEE6" />
          <rect x={-150} y={-90} width={260} height={90} rx={10} fill="#F2EEE6" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-130 + i * 60} y={-70} width={36} height={30} rx={6} fill="#5C7088" />)}
          <rect x={-200} y={30} width={400} height={14} fill="#2F4D7A" />
        </g>
      )}
      <g transform={`translate(0, ${floating ? bob : 0})`}>
        <Airliner x={px} y={py} rot={rot} s={floating ? 1.6 : 1.3} />
        {bool(p.wing) &&
          [0, 1, 2, 3, 4].map((i) => {
            const x = px - 150 + i * 62;
            const y = py + 70;
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2={y - 60} stroke="#2E2A28" strokeWidth={6} />
                <rect x={x - 14} y={y - 110} width={28} height={50} rx={10} fill={['#F2C14E', '#F2C14E', '#E8692E', '#F2C14E', '#E8692E'][i]} />
                <circle cx={x} cy={y - 126} r={16} fill="#F1D6C1" />
              </g>
            );
          })}
      </g>
      {!floating && u >= 0 && u < 1.6 &&
        Array.from({length: 10}).map((_, i) => {
          const a = (i / 10) * Math.PI;
          const r = 60 + u * 260;
          return <circle key={i} cx={px + Math.cos(a) * r} cy={waterY - Math.sin(a) * r * 0.6} r={20 + u * 10} fill="#E6F1F6" opacity={0.8 * (1 - u / 1.6)} />;
        })}
    </g>
  );
};

// 機内でふくらませると危ない図（客室の断面）。waterAt 秒から水位が上がり、ふくらませた人は天井へ押しつけられる
export const VestDanger: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const k = Math.min(1, Math.max(0, (t - num(p.waterAt, 0.5)) / 3));
  const top = 520;
  const bottom = 1100;
  const water = bottom - k * (bottom - top - 60);
  const floatY = Math.min(bottom - 120, water - 60);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#1E2A3C" />
      {/* 客室の断面（丸い胴体） */}
      <rect x={120} y={top} width={840} height={bottom - top} rx={200} fill="#E9E3D7" />
      {/* 出口（低い位置） */}
      <rect x={880} y={bottom - 260} width={80} height={220} fill="#3A3F47" />
      <clipPath id="vd-clip"><rect x={120} y={top} width={840} height={bottom - top} rx={200} /></clipPath>
      <g clipPath="url(#vd-clip)">
        <rect x={120} y={water} width={840} height={bottom - water + 10} fill="#3E6A80" opacity={0.85} />
      </g>
      <rect x={880} y={bottom - 260} width={80} height={220} fill="none" stroke="#F2C14E" strokeWidth={6} />
      <text x={1010} y={bottom - 140} textAnchor="middle" fontSize={36} fontWeight={900} fill="#F2C14E" fontFamily="Noto Sans JP">出口</text>
      {/* ふくらませた人：天井に押しつけられる */}
      <g transform={`translate(420, ${Math.max(top + 90, floatY)})`}>
        <circle cx={0} cy={-50} r={34} fill="#F1D6C1" />
        <rect x={-46} y={-14} width={92} height={70} rx={30} fill="#F2C14E" stroke="#C99A2E" strokeWidth={4} />
      </g>
      {k > 0.6 && (
        <g>
          <path d={`M 420,${top + 20} l -20,-30 M 420,${top + 20} l 20,-30`} stroke="#FF6B5E" strokeWidth={8} />
          <text x={420} y={top - 40} textAnchor="middle" fontSize={44} fontWeight={900} fill="#FF6B5E" fontFamily="Noto Sans JP">天井に押しつけられる</text>
        </g>
      )}
      <path d={`M 560,${Math.max(top + 90, floatY) + 20} Q 760,${bottom - 60} 880,${bottom - 150}`} stroke="#9AA1A8" strokeWidth={6} fill="none" strokeDasharray="14 12" />
      <text x={700} y={bottom + 80} textAnchor="middle" fontSize={40} fontWeight={900} fill="#EDE7DA" fontFamily="Noto Sans JP">出口は水の中</text>
    </g>
  );
};

// 滑走路を走る機体（横から）。機体は真ん中に固定し、地面が流れる。brakeAt から減速、hot でブレーキが赤く、smoke で車輪から煙
export const RollSide: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const ra = num(p.rollAt, 0);
  const ba = num(p.brakeAt, 9999);
  const v0 = num(p.speed, 0);
  const pos = (tt: number) => {
    const a1 = Math.max(0, Math.min(tt, ba) - ra);
    let d = v0 * a1 + 300 * a1 * a1;
    if (tt > ba) {
      const vb = v0 + 600 * Math.max(0, ba - ra);
      const dt = Math.min(tt - ba, vb / 900);
      d += vb * dt - 450 * dt * dt;
    }
    return d;
  };
  const off = pos(t);
  const sky = skyKind(p.sky ?? 'dusk');
  const x = 540;
  const y = 980;
  const hot = bool(p.hot);
  const glow = hot ? 0.6 + 0.4 * Math.sin(t * 5) : 0;
  return (
    <g>
      <defs>
        <Grad id="rs-sky" from={SKY[sky][0]} to={SKY[sky][1]} />
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#rs-sky)" />
      <rect x={0} y={880} width={1080} height={1040} fill="#6F7A63" />
      <rect x={0} y={1040} width={1080} height={120} fill="#4C5058" />
      {Array.from({length: 10}).map((_, i) => {
        const lx = 1200 - ((off + i * 160) % 1600);
        return <rect key={i} x={lx} y={1094} width={90} height={10} fill="#E9E4DA" />;
      })}
      {Array.from({length: 12}).map((_, i) => {
        const lx = 1200 - ((off * 0.6 + i * 120) % 1440);
        return <circle key={i} cx={lx} cy={1180} r={7} fill="#F2C14E" />;
      })}
      <g transform={`translate(${x}, ${y}) scale(1.5)`}>
        <Airliner x={0} y={0} rot={0} s={1} />
      </g>
      {hot && (
        <g>
          <circle cx={x - 45} cy={y + 90} r={30} fill="#FF5A3C" opacity={0.5 * glow} />
          <circle cx={x - 45} cy={y + 90} r={14} fill="#FF8A3D" opacity={glow} />
        </g>
      )}
      {bool(p.smoke) &&
        Array.from({length: 7}).map((_, i) => {
          const u = (t * 0.6 + i / 7) % 1;
          return <circle key={i} cx={x - 45 - u * 120} cy={y + 80 - u * 260} r={20 + u * 60} fill="#EDEDED" opacity={0.6 * (1 - u)} />;
        })}
    </g>
  );
};

// V1 の図（滑走路を上から）。markAt で「止まる」「飛ぶ」の矢印
export const V1Diagram: Background = ({layer, p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (layer === 'front') return null;
  const t = frame / fps;
  const k = Math.min(1, Math.max(0, (t - num(p.markAt, 0.4)) / 0.8));
  const v1x = 620;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#2A3142" />
      <rect x={60} y={600} width={960} height={180} rx={10} fill="#4C5058" />
      {Array.from({length: 8}).map((_, i) => <rect key={i} x={100 + i * 120} y={684} width={70} height={10} fill="#E9E4DA" />)}
      <rect x={v1x - 4} y={560} width={8} height={260} fill="#F2C14E" />
      <text x={v1x} y={540} textAnchor="middle" fontSize={64} fontWeight={900} fill="#F2C14E" fontFamily="Noto Sans JP">V1</text>
      <g opacity={k}>
        <path d={`M 120,880 L ${v1x - 20},880`} stroke="#7FE0A0" strokeWidth={12} />
        <text x={(120 + v1x) / 2} y={960} textAnchor="middle" fontSize={52} fontWeight={900} fill="#7FE0A0" fontFamily="Noto Sans JP">ここまでなら 止まる</text>
        <path d={`M ${v1x + 20},880 L 980,880`} stroke="#7FD3FF" strokeWidth={12} />
        <path d="M 980,880 l -30,-20 l 0,40 Z" fill="#7FD3FF" />
        <text x={(v1x + 980) / 2} y={1040} textAnchor="middle" fontSize={52} fontWeight={900} fill="#7FD3FF" fontFamily="Noto Sans JP">過ぎたら 飛ぶ</text>
      </g>
      <g transform="translate(200, 690) rotate(90) scale(1.2)">
        <path d="M 0,-40 Q 7,-34 7,-18 L 7,-6 L 40,12 L 40,20 L 7,10 L 6,28 L 18,36 L 18,42 L 0,37 L -18,42 L -18,36 L -6,28 L -7,10 L -40,20 L -40,12 L -7,-6 L -7,-18 Q -7,-34 0,-40 Z" fill="#F4F1EA" stroke="#1B2433" strokeWidth={3} />
      </g>
    </g>
  );
};
