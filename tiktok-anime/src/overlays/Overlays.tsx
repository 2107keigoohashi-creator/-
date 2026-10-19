import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCOUNT_NAME, COLORS, FONT_FAMILY, SAFE} from '../config';
import {CastMember, Overlay} from '../types';

const font: React.CSSProperties = {fontFamily: FONT_FAMILY};
const s = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const n = (v: unknown, d: number) => (typeof v === 'number' ? v : d);

const useIn = (frames = 8) => {
  const f = useCurrentFrame();
  return interpolate(f, [0, frames], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
};

// 「ルール#1」カード：ベージュの板に黒文字、1秒表示してフェードアウト
const RuleCard: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hold = n(o.hold, 1);
  const pop = interpolate(f, [0, 6], [0.7, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.2))});
  const fade = interpolate(f, [hold * fps, (hold + 0.3) * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: fade}}>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.25)'}} />
      <div
        style={{
          ...font,
          transform: `scale(${pop}) rotate(-2deg)`,
          background: COLORS.card,
          border: `10px solid ${COLORS.cardBorder}`,
          borderRadius: 28,
          padding: '60px 90px',
          boxShadow: '0 18px 0 rgba(0,0,0,0.22)',
          color: COLORS.ink,
          fontWeight: 900,
          fontSize: 140,
          letterSpacing: 4,
          lineHeight: 1,
          marginTop: -180,
        }}
      >
        {s(o.text)}
      </div>
    </AbsoluteFill>
  );
};

// 右上の情報札（「羽田→新千歳 高度35,000ft」など）
const InfoBox: React.FC<{o: Overlay}> = ({o}) => {
  const p = useIn(10);
  return (
    <div
      style={{
        ...font,
        position: 'absolute',
        right: SAFE.left,
        top: SAFE.top + 40,
        transform: `translateX(${(1 - p) * 60}px)`,
        opacity: p,
        background: 'rgba(24,30,42,0.78)',
        color: '#F2EEE6',
        borderRadius: 18,
        padding: '18px 28px',
        fontWeight: 700,
        fontSize: 40,
        lineHeight: 1.35,
        textAlign: 'right',
        whiteSpace: 'pre-line',
        borderLeft: `8px solid ${s(o.color, '#C9A54C')}`,
      }}
    >
      {s(o.text)}
    </div>
  );
};

// 吹き出し（ワールド座標）
const Bubble: React.FC<{o: Overlay}> = ({o}) => {
  const p = useIn(6);
  const x = n(o.x, 540);
  const y = n(o.y, 600);
  const tail = s(o.tail, 'down');
  return (
    <div
      style={{
        ...font,
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${0.6 + 0.4 * p})`,
        transformOrigin: '50% 100%',
        opacity: p,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '6px solid #1E1E1E',
          borderRadius: 40,
          padding: '18px 34px',
          fontWeight: 900,
          fontSize: n(o.size, 58),
          color: COLORS.ink,
          whiteSpace: 'pre',
        }}
      >
        {s(o.text)}
      </div>
      <svg width={60} height={44} style={{position: 'absolute', left: tail === 'left' ? 30 : tail === 'right' ? 'calc(100% - 90px)' : 'calc(50% - 30px)', top: '100%', marginTop: -6}}>
        <path d="M 6,0 L 54,0 L 30,40 Z" fill="#fff" stroke="#1E1E1E" strokeWidth={6} strokeLinejoin="round" />
        <rect x={9} y={-4} width={42} height={8} fill="#fff" />
      </svg>
    </div>
  );
};

// 大きな文字（「I HAVE CONTROL」など）
const BigText: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, 5], [1.6, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const op = interpolate(f, [0, 3], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        ...font,
        position: 'absolute',
        left: 0,
        right: 0,
        top: n(o.y, 380),
        textAlign: 'center',
        transform: `scale(${sc}) rotate(${n(o.rotate, -3)}deg)`,
        opacity: op,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: s(o.bg, '#1E1E1E'),
          color: s(o.color, '#F2C14E'),
          fontWeight: 900,
          fontSize: n(o.size, 96),
          letterSpacing: 6,
          padding: '14px 40px',
          borderRadius: 12,
        }}
      >
        {s(o.text)}
      </span>
    </div>
  );
};

// 黒画面に白文字（ゆっくり出る）
const CenterText: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const text = s(o.text);
  const cps = n(o.cps, 9);
  const shown = Math.floor((f / fps) * cps);
  let count = 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{...font, color: '#F2EEE6', fontWeight: 700, fontSize: n(o.size, 58), lineHeight: 1.6, textAlign: 'center', whiteSpace: 'pre-line', marginTop: n(o.offsetY, -200)}}>
        {[...text].map((c, i) => {
          if (c !== '\n') count++;
          return (
            <span key={i} style={{opacity: count <= shown ? 1 : 0}}>
              {c}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 一瞬の暗転
const Blackout: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = n(o.duration, 0.5) * fps;
  const op = interpolate(f, [0, 3, d - 4, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#000', opacity: op}} />;
};

// トランスポンダー（数字が 7700 に変わる）
const Transponder: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const from = s(o.from, '2241');
  const to = s(o.to, '7700');
  const changeAt = n(o.changeAt, 1) * fps;
  const per = 6;
  const digits = [...to].map((d, i) => (f >= changeAt + i * per ? d : from[i]));
  const done = f >= changeAt + to.length * per;
  const blink = done && Math.floor((f - changeAt) / 10) % 2 === 0;
  const p = useIn(8);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: n(o.y, 420), opacity: p}}>
      <div style={{...font, background: '#2A2D33', borderRadius: 28, padding: '30px 40px 36px', border: '8px solid #44484F', boxShadow: '0 16px 0 rgba(0,0,0,0.3)', transform: `scale(${0.9 + 0.1 * p})`}}>
        <div style={{color: '#9AA1A8', fontWeight: 900, fontSize: 34, letterSpacing: 8, marginBottom: 14}}>XPDR / SQUAWK</div>
        <div style={{display: 'flex', gap: 14}}>
          {digits.map((d, i) => (
            <div key={i} style={{width: 140, height: 190, borderRadius: 14, background: '#121417', color: done ? '#FF6B5E' : '#F2C14E', fontWeight: 900, fontSize: 150, lineHeight: '190px', textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
              {d}
            </div>
          ))}
        </div>
        <div style={{marginTop: 18, height: 54, textAlign: 'center', color: '#FFFFFF', background: blink ? COLORS.accent : 'transparent', borderRadius: 10, fontWeight: 900, fontSize: 40, lineHeight: '54px', letterSpacing: 6}}>
          {done ? s(o.label, 'EMERGENCY') : ''}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 機内食が2つ並ぶ
const Tray: React.FC<{kind: 'wa' | 'yo'; label: string; delay: number}> = ({kind, label, delay}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - p) * 80}px)`, opacity: p}}>
      <svg width={340} height={259} viewBox="0 0 420 320">
        <rect x={10} y={20} width={400} height={290} rx={28} fill="#8A7A66" />
        <rect x={24} y={34} width={372} height={262} rx={20} fill="#A08D76" />
        {kind === 'wa' ? (
          <g>
            <circle cx={120} cy={200} r={70} fill="#3E3A38" />
            <circle cx={120} cy={200} r={56} fill="#F4F1EA" />
            <ellipse cx={290} cy={120} rx={84} ry={50} fill="#E9E4DA" />
            <rect x={240} y={100} width={100} height={36} rx={14} fill="#D98E6A" />
            <circle cx={290} cy={230} r={46} fill="#7A4A3A" />
            <circle cx={290} cy={230} r={34} fill="#B07A4E" />
            <rect x={60} y={66} width={120} height={14} rx={6} fill="#5A4636" />
            <rect x={60} y={88} width={120} height={14} rx={6} fill="#5A4636" />
          </g>
        ) : (
          <g>
            <circle cx={150} cy={170} r={100} fill="#F4F1EA" />
            <ellipse cx={150} cy={170} rx={60} ry={40} fill="#9A5A3E" />
            <ellipse cx={125} cy={155} rx={18} ry={12} fill="#7FA36A" />
            <ellipse cx={180} cy={190} rx={18} ry={12} fill="#E3B25A" />
            <circle cx={320} cy={110} r={44} fill="#D9B37A" />
            <rect x={280} y={200} width={90} height={70} rx={12} fill="#C9483F" opacity={0.85} />
            <rect x={36} y={50} width={14} height={240} rx={6} fill="#B9B6AF" />
          </g>
        )}
      </svg>
      <div style={{...font, marginTop: 14, fontWeight: 900, fontSize: 52, color: COLORS.ink, background: COLORS.card, padding: '6px 26px', borderRadius: 12}}>{label}</div>
    </div>
  );
};

const Meals: React.FC<{o: Overlay}> = ({o}) => {
  const labels = Array.isArray(o.labels) ? (o.labels as string[]) : ['機長', '副操縦士'];
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: n(o.y, 420)}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center'}}>
        <Tray kind="wa" label={`${labels[0]}：和食`} delay={0} />
        <Tray kind="yo" label={`${labels[1]}：洋食`} delay={8} />
      </div>
    </AbsoluteFill>
  );
};

// 機内放送アイコン
const PaIcon: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const p = useIn(8);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: n(o.y, 300), display: 'flex', justifyContent: 'center', opacity: p}}>
      <div style={{...font, display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(24,30,42,0.82)', borderRadius: 60, padding: '18px 40px'}}>
        <svg width={110} height={90} viewBox="0 0 110 90">
          <path d="M 8,30 L 30,30 L 56,8 L 56,82 L 30,60 L 8,60 Z" fill="#F2EEE6" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${68 + i * 14},${24 - i * 6} Q ${82 + i * 18},45 ${68 + i * 14},${66 + i * 6}`} stroke="#F2C14E" strokeWidth={7} fill="none" strokeLinecap="round" opacity={Math.floor(f / 6) % 3 >= i ? 1 : 0.2} />
          ))}
        </svg>
        <div style={{color: '#F2EEE6', fontWeight: 900, fontSize: 48}}>{s(o.text, '機内放送')}</div>
      </div>
    </div>
  );
};

// ざわざわ
const Zawa: React.FC<{o: Overlay}> = ({o}) => {
  const f = useCurrentFrame();
  const pts = [
    [160, 700],
    [820, 640],
    [300, 980],
    [760, 1000],
    [520, 820],
  ];
  return (
    <>
      {pts.map(([x, y], i) => {
        const on = Math.floor(f / 9 + i * 2) % 4 !== 0;
        return (
          <div key={i} style={{...font, position: 'absolute', left: x, top: y + Math.sin(f / 8 + i) * 8, fontWeight: 900, fontSize: 54, color: s(o.color, '#5A5148'), opacity: on ? 0.85 : 0, transform: `rotate(${(i % 2 ? 1 : -1) * 10}deg)`}}>
            ざわ
          </div>
        );
      })}
    </>
  );
};

// 名前と説明の札（左上）
export const NameTags: React.FC<{ids: string[]; cast: Record<string, CastMember>}> = ({ids, cast}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: SAFE.left, top: SAFE.top + 40, display: 'flex', flexDirection: 'column', gap: 16}}>
      {ids.map((id, i) => {
        const c = cast[id];
        const start = 6 + i * 8;
        const p = interpolate(f, [start, start + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const out = interpolate(f, [3.2 * fps, 3.6 * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={id} style={{...font, transform: `translateX(${(1 - p) * -60}px)`, opacity: p * out, background: '#F4EFE4', borderLeft: `10px solid ${c.appearance.clothes === '#F2F0EA' ? '#C9A54C' : c.appearance.clothes}`, borderRadius: 14, padding: '12px 24px 14px', boxShadow: '0 8px 0 rgba(0,0,0,0.18)'}}>
            <div style={{fontWeight: 900, fontSize: 42, color: COLORS.ink, lineHeight: 1.2}}>{c.tagName}</div>
            {c.tagDesc && <div style={{fontWeight: 700, fontSize: 28, color: '#5A5148', marginTop: 4}}>{c.tagDesc}</div>}
          </div>
        );
      })}
    </div>
  );
};

export const Watermark: React.FC = () =>
  ACCOUNT_NAME ? (
  <div
    style={{
      ...font,
      position: 'absolute',
      right: SAFE.right + 10,
      bottom: 1920 - SAFE.telopBottom - 70,
      fontWeight: 700,
      fontSize: 30,
      color: 'rgba(255,255,255,0.75)',
      textShadow: '0 0 6px rgba(0,0,0,0.6), 0 2px 2px rgba(0,0,0,0.5)',
      letterSpacing: 1,
    }}
  >
    {ACCOUNT_NAME}
  </div>
  ) : null;

const SCREEN: Record<string, React.FC<{o: Overlay}>> = {
  ruleCard: RuleCard,
  infoBox: InfoBox,
  bigText: BigText,
  centerText: CenterText,
  blackout: Blackout,
  transponder: Transponder,
  meals: Meals,
  paIcon: PaIcon,
};

// カメラのズームに合わせて動くもの
const WORLD: Record<string, React.FC<{o: Overlay}>> = {
  bubble: Bubble,
  zawa: Zawa,
};

export const OVERLAY_TYPES = [...Object.keys(SCREEN), ...Object.keys(WORLD)];

export const OverlayLayer: React.FC<{overlays: Overlay[]; world: boolean; sceneFrames: number}> = ({overlays, world, sceneFrames}) => {
  const {fps} = useVideoConfig();
  const reg = world ? WORLD : SCREEN;
  return (
    <>
      {overlays.map((o, i) => {
        const C = reg[o.type];
        if (!C) return null;
        const from = Math.round((o.at ?? 0) * fps);
        const dur = o.type === 'ruleCard' ? Math.round((n(o.hold, 1) + 0.3) * fps) : o.duration ? Math.round(o.duration * fps) : sceneFrames - from;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, dur)} layout="none">
            <C o={o} />
          </Sequence>
        );
      })}
    </>
  );
};
