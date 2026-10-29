import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Appearance, CharacterInScene, Expression, Look} from '../types';

const LIMB = '#2E2A28';
const LIMB_W = 9;
const SKIN = '#F1D6C1';
const HEAD_Y = -262;
const HEAD_R = 64;
const SHOULDER = {x: 52, y: -182};

type Pt = [number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// id から決まる疑似乱数（まばたきのタイミングをキャラごとにずらす）
const seedOf = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h / 997;
};

const Hair: React.FC<{a: Appearance; back?: boolean}> = ({a, back}) => {
  const y = HEAD_Y;
  if (back) {
    if (a.hairStyle === 'long') {
      return <path d={`M ${-HEAD_R - 4},${y} Q ${-HEAD_R - 10},${y + 120} -50,${y + 140} L 50,${y + 140} Q ${HEAD_R + 10},${y + 120} ${HEAD_R + 4},${y} Z`} fill={a.hair} />;
    }
    if (a.hairStyle === 'bun') {
      return <circle cx={0} cy={y - 70} r={28} fill={a.hair} />;
    }
    return null;
  }
  const cap = `M ${-HEAD_R - 2},${y + 2} A ${HEAD_R + 2} ${HEAD_R + 2} 0 0 1 ${HEAD_R + 2},${y + 2} L ${HEAD_R - 4},${y - 4} Q 30,${y - 24} 4,${y - 18} Q -30,${y - 30} ${-HEAD_R + 4},${y - 2} Z`;
  return (
    <g>
      <path d={cap} fill={a.hair} />
      {a.hairStyle === 'gray' && (
        <g stroke="#D9D5CE" strokeWidth={4} strokeLinecap="round" fill="none">
          <path d={`M -38,${y - 44} Q -24,${y - 54} -8,${y - 50}`} />
          <path d={`M 10,${y - 56} Q 26,${y - 54} 40,${y - 40}`} />
          <path d={`M -50,${y - 20} Q -44,${y - 34} -30,${y - 38}`} />
        </g>
      )}
      {a.hairStyle === 'bun' && (
        <path d={`M ${-HEAD_R - 2},${y} Q ${-HEAD_R - 6},${y + 40} ${-HEAD_R + 6},${y + 46} L ${-HEAD_R + 12},${y} Z M ${HEAD_R + 2},${y} Q ${HEAD_R + 6},${y + 40} ${HEAD_R - 6},${y + 46} L ${HEAD_R - 12},${y} Z`} fill={a.hair} />
      )}
    </g>
  );
};

const Face: React.FC<{
  expression: Expression;
  look: Look;
  blinking: boolean;
  mouthOpen: boolean;
  sweat: boolean;
  frame: number;
}> = ({expression, look, blinking, mouthOpen, sweat, frame}) => {
  const y = HEAD_Y;
  const dx = look === 'left' ? -12 : look === 'right' ? 12 : 0;
  const dy = look === 'down' ? 10 : look === 'up' ? -10 : 0;
  const ex = 22;
  const ey = y + 4 + dy;
  const ink = '#2A2522';

  let eyes: React.ReactNode;
  if (expression === 'closed') {
    eyes = [-1, 1].map((s) => (
      <path key={s} d={`M ${s * ex - 10 + dx},${ey} Q ${s * ex + dx},${ey + 8} ${s * ex + 10 + dx},${ey}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
    ));
  } else if (blinking) {
    eyes = [-1, 1].map((s) => (
      <line key={s} x1={s * ex - 9 + dx} y1={ey} x2={s * ex + 9 + dx} y2={ey} stroke={ink} strokeWidth={5} strokeLinecap="round" />
    ));
  } else {
    const r = expression === 'surprised' ? 10 : 7.5;
    eyes = [-1, 1].map((s) => <circle key={s} cx={s * ex + dx} cy={ey} r={r} fill={ink} />);
  }

  let brows: React.ReactNode = null;
  if (expression === 'surprised') {
    brows = [-1, 1].map((s) => (
      <path key={s} d={`M ${s * ex - 11 + dx},${ey - 26} Q ${s * ex + dx},${ey - 33} ${s * ex + 11 + dx},${ey - 26}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
    ));
  } else if (expression === 'panic') {
    brows = [-1, 1].map((s) => (
      <line key={s} x1={s * (ex + 12) + dx} y1={ey - 16} x2={s * (ex - 8) + dx} y2={ey - 25} stroke={ink} strokeWidth={4} strokeLinecap="round" />
    ));
  }

  const my = y + 32;
  let mouth: React.ReactNode;
  if (mouthOpen || expression === 'surprised') {
    mouth = <ellipse cx={dx * 0.5} cy={my + 2} rx={expression === 'surprised' ? 8 : 9} ry={expression === 'surprised' ? 11 : 7} fill="#7A3B36" />;
  } else if (expression === 'panic') {
    mouth = <path d={`M ${-14 + dx * 0.5},${my + 2} q 4.7,-6 9.3,0 t 9.3,0 t 9.3,0`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
  } else if (expression === 'closed') {
    mouth = <line x1={-9 + dx * 0.5} y1={my + 2} x2={9 + dx * 0.5} y2={my + 2} stroke={ink} strokeWidth={4} strokeLinecap="round" />;
  } else {
    mouth = <path d={`M ${-11 + dx * 0.5},${my} Q ${dx * 0.5},${my + 8} ${11 + dx * 0.5},${my}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />;
  }

  const drip = (frame % 40) / 40;
  return (
    <g>
      {[-1, 1].map((s) => (
        <circle key={s} cx={s * 38 + dx * 0.6} cy={y + 22} r={9} fill="#E39A8E" opacity={0.35} />
      ))}
      {eyes}
      {brows}
      {mouth}
      {sweat && (
        <g transform={`translate(${HEAD_R - 4}, ${y - 18 + drip * 16})`} opacity={1 - drip * 0.6}>
          <path d="M 0,-14 Q 9,0 0,8 Q -9,0 0,-14 Z" fill="#8CC3E0" stroke="#5E9DBF" strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

const Seat: React.FC<{kind: 'pilot' | 'cabin'}> = ({kind}) => {
  if (kind === 'pilot') {
    return (
      <g>
        <rect x={-118} y={-400} width={236} height={440} rx={46} fill="#4E535B" />
        <rect x={-96} y={-382} width={192} height={120} rx={34} fill="#5E646D" />
        <rect x={-128} y={-30} width={256} height={70} rx={22} fill="#454950" />
        <rect x={-150} y={-70} width={44} height={120} rx={14} fill="#43474E" />
        <rect x={106} y={-70} width={44} height={120} rx={14} fill="#43474E" />
      </g>
    );
  }
  return (
    <g>
      <rect x={-108} y={-390} width={216} height={430} rx={40} fill="#6F8496" />
      <rect x={-92} y={-376} width={184} height={70} rx={22} fill="#E9E4DA" />
      <rect x={-116} y={-26} width={232} height={74} rx={24} fill="#62778A" />
      <rect x={-136} y={-60} width={34} height={100} rx={12} fill="#5D7183" />
      <rect x={102} y={-60} width={34} height={100} rx={12} fill="#5D7183" />
    </g>
  );
};

// 操縦桿（キャラの前に描く。キャラが移動しても元の位置に残る）
const Yoke: React.FC = () => (
  <g>
    <rect x={-14} y={-110} width={28} height={400} rx={8} fill="#2A2D33" />
    <path d="M -116,-150 Q -118,-76 -64,-72 L 64,-72 Q 118,-76 116,-150 L 88,-154 Q 88,-100 58,-98 L -58,-98 Q -88,-100 -88,-154 Z" fill="#33373E" />
    <rect x={-34} y={-104} width={68} height={32} rx={6} fill="#43474F" />
    <rect x={-20} y={-96} width={40} height={8} rx={3} fill="#9AA1A8" />
  </g>
);

const Limb: React.FC<{pts: Pt[]}> = ({pts}) => (
  <polyline points={pts.map((p) => p.join(',')).join(' ')} stroke={LIMB} strokeWidth={LIMB_W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);

export const Character: React.FC<{
  spec: CharacterInScene;
  appearance: Appearance;
}> = ({spec, appearance: a}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const seed = seedOf(spec.id + spec.x);

  const pose = spec.pose ?? 'stand';
  const at = spec.at ?? 0;

  // 位置の移動
  const m = spec.move;
  const mp = m
    ? interpolate(t, [m.at ?? 0, (m.at ?? 0) + (m.duration ?? 1)], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  const x = lerp(spec.x, m?.x ?? spec.x, mp);
  const y = lerp(spec.y, m?.y ?? spec.y, mp);
  const scale = lerp(spec.scale ?? 1, m?.scale ?? spec.scale ?? 1, mp);

  // 倒れる
  const collapse =
    spec.action === 'collapsed'
      ? 1
      : spec.action === 'collapse'
        ? interpolate(t, [at, at + 1.6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          })
        : 0;

  // 腕を伸ばす
  const reach =
    spec.action === 'reach'
      ? interpolate(t, [at, at + 0.5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })
      : 0;

  // 衝撃防止姿勢（頭を下げて、両手で頭を守る）
  const brace =
    spec.action === 'brace'
      ? interpolate(t, [at, at + 0.5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })
      : 0;

  const breatheAmp = collapse > 0.5 ? 1.5 : 3;
  const breathe = spec.breathe === false ? 0 : Math.sin((t / 3.4 + seed) * Math.PI * 2) * breatheAmp;

  const period = 3 + seed * 1.5;
  const blinking = spec.blink !== false && ((t + seed * 2) % period) < 0.13;
  const mouthOpen = !!spec.talking && Math.floor(frame / 4 + seed * 3) % 3 !== 0;

  const expression: Expression = collapse > 0.3 || brace > 0.5 ? 'closed' : spec.action === 'airborne' && t >= at && !spec.rotate ? 'surprised' : spec.expression ?? 'normal';

  // 腕の基本形
  const restHand = (s: number): Pt => (pose === 'sit' ? [s * 40, -18] : [s * 70, -8]);
  const restElbow = (s: number): Pt => [s * 68, -100];
  let hand = (s: number): Pt => restHand(s);
  let elbow = (s: number): Pt => restElbow(s);
  if (spec.hold) {
    hand = (s) => [s * 102, -120];
    elbow = (s) => [s * 96, -96];
  }
  if (spec.item === 'checklist') {
    hand = (s) => [s * 46, -132];
    elbow = (s) => [s * 80, -110];
  }
  if (spec.action === 'chest') {
    hand = (s) => [s * 18, -150];
    elbow = (s) => [s * 70, -120];
  }
  // 心臓マッサージ：ひざをついて、まっすぐ下へ押す
  const cprPush = spec.action === 'cpr' ? Math.abs(Math.sin((t * Math.PI * 110) / 60)) : 0;
  if (spec.action === 'cpr') {
    hand = (s) => [s * 10, 60];
    elbow = (s) => [s * 30, -60];
  }
  if (spec.action === 'stop') {
    hand = (s) => [s * 170, -250];
    elbow = (s) => [s * 120, -200];
  }
  if (spec.item === 'bottle') {
    hand = (s) => (s === 1 ? [120, -300] : [-40, -130]);
    elbow = (s) => (s === 1 ? [110, -200] : [-80, -110]);
  }
  if (spec.item === 'extinguisher') {
    hand = (s) => (s === 1 ? [70, -120] : [-30, -150]);
    elbow = (s) => (s === 1 ? [90, -60] : [-80, -120]);
  }
  if (spec.item === 'bag' || spec.item === 'aed') {
    const base = hand;
    const baseE = elbow;
    hand = (s) => (s === 1 ? [78, -40] : base(s));
    elbow = (s) => (s === 1 ? [80, -110] : baseE(s));
  }
  if (spec.item === 'phone') {
    const base = hand;
    const baseE = elbow;
    hand = (s) => (s === 1 ? [62, HEAD_Y + 18] : base(s));
    elbow = (s) => (s === 1 ? [104, -150] : baseE(s));
  }
  const reachSide = spec.reachArm === 'left' ? -1 : 1;
  const ang = ((spec.reachAngle ?? -15) * Math.PI) / 180;
  const reachHand: Pt = [reachSide * (SHOULDER.x + Math.cos(ang) * 175), SHOULDER.y + Math.sin(ang) * 175];
  const reachElbow: Pt = [reachSide * (SHOULDER.x + Math.cos(ang) * 88), SHOULDER.y + Math.sin(ang) * 88 + 6];
  const dangleHand = (s: number): Pt => [s * 62, 40];
  const dangleElbow = (s: number): Pt => [s * 70, -60];

  const armPts = (s: number): Pt[] => {
    let e = elbow(s);
    let h = hand(s);
    if (reach > 0 && s === reachSide) {
      e = lerpPt(e, reachElbow, reach);
      h = lerpPt(h, reachHand, reach);
    }
    if (collapse > 0) {
      e = lerpPt(e, dangleElbow(s), collapse);
      h = lerpPt(h, dangleHand(s), collapse);
    }
    if (brace > 0) {
      // 頭の上に手を置く（胴体の縮みぶんを戻して座標を合わせる）
      const sq = 1 - brace * 0.1;
      const headTop = (HEAD_Y + brace * 120 - 46 + (1 - sq) * 196) / sq;
      e = lerpPt(e, [s * 92, headTop + 70], brace);
      h = lerpPt(h, [s * 34, headTop], brace);
    }
    return [[s * SHOULDER.x, SHOULDER.y], e, h];
  };

  const legs = (s: number): Pt[] =>
    pose === 'kneel'
      ? [[s * 22, -4], [s * 34, 70], [s * 90, 80]]
      : pose === 'sit'
      ? [[s * 24, -4], [s * 36, 34], [s * 38, 150]]
      : [[s * 22, -4], [s * 26, 100], [s * 28, 205]];

  // 上半身の傾き（倒れる）
  const bodyRot = collapse * 6;
  const bodyDrop = collapse * 26 + brace * 20 + cprPush * 18 + (spec.action === 'cpr' ? 30 : 0);
  const torsoSquash = 1 - collapse * 0.14 - brace * 0.1;
  const headX = collapse * 14;
  const headY = collapse * 104 + brace * 120;
  const headRot = collapse * 22;
  const headScale = 1 + collapse * 0.06;

  const outline = 'rgba(0,0,0,0.16)';
  const isShirt = (a.stripes ?? 0) > 0;

  // 浮き上がる（乱気流など）：at 秒から体が持ち上がって落ちる。座席はその場に残る
  const airDur = spec.airDur ?? 1.1;
  const air = spec.action === 'airborne' ? Math.max(0, Math.sin((Math.PI * (t - at)) / airDur)) * (t >= at && t <= at + airDur ? 1 : 0) : 0;
  const airY = -air * (spec.airHeight ?? 260);
  const base = `translate(${x}, ${y}) scale(${(spec.flip ? -1 : 1) * scale}, ${scale})`;
  const outer = `translate(${x}, ${y + airY * scale}) scale(${(spec.flip ? -1 : 1) * scale}, ${scale}) rotate(${air * -8 + (spec.rotate ?? 0)})`;
  const upper = `translate(0, ${breathe + bodyDrop}) rotate(${bodyRot}, 0, 0)`;
  const squash = `scale(1, ${torsoSquash})`;
  const headLift = (1 - torsoSquash) * 196;

  return (
    <g>
      {spec.seat && (
        <g transform={base}>
          <Seat kind={spec.seat} />
        </g>
      )}
      <g transform={outer}>
        {/* 脚 */}
        {[-1, 1].map((s) => {
          const p = legs(s);
          return (
            <g key={s}>
              <Limb pts={p} />
              <ellipse cx={p[2][0] + s * 8} cy={p[2][1] + 4} rx={16} ry={8} fill={LIMB} />
            </g>
          );
        })}
        <g transform={`${upper} ${squash}`}>
            {/* 胴体（服） */}
            <path
              d="M -54,-196 Q -64,-196 -64,-176 L -58,-14 Q -56,4 -38,4 L 38,4 Q 56,4 58,-14 L 64,-176 Q 64,-196 54,-196 Z"
              fill={a.clothes}
              stroke={outline}
              strokeWidth={3}
            />
            {isShirt && (
              <g>
                <path d="M -20,-196 L 0,-166 L 20,-196" fill="none" stroke="#C9C3B8" strokeWidth={4} strokeLinejoin="round" />
                {[-1, 1].map((s) => (
                  <circle key={s} cx={s * 30} cy={-120} r={4} fill="#3C4A63" opacity={0.6} />
                ))}
              </g>
            )}
            {a.tie && <path d="M -9,-174 L 9,-174 L 12,-80 L 0,-64 L -12,-80 Z" fill={a.tie} />}
            {a.scarf && (
              <g>
                <path d="M -26,-196 L 26,-196 L 10,-172 L -10,-172 Z" fill={a.scarf} />
                <path d="M 6,-176 L 30,-140 L 14,-134 L 0,-170 Z" fill={a.scarf} />
              </g>
            )}
            {a.stripes
              ? [-1, 1].map((s) => (
                  <g key={s} transform={`translate(${s * 40}, -194)`}>
                    <rect x={-22} y={-8} width={44} height={18} rx={3} fill="#22252C" />
                    {Array.from({length: a.stripes!}).map((_, i) => {
                      const w = 44 / (a.stripes! + 1);
                      return <rect key={i} x={-22 + w * (i + 1) - 2.5} y={-6} width={5} height={14} fill="#C9A54C" />;
                    })}
                  </g>
                ))
              : null}
          {/* 腕 */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={s * 50} cy={-178} r={17} fill={a.clothes} stroke={outline} strokeWidth={3} />
              <Limb pts={armPts(s)} />
            </g>
          ))}
        </g>
      </g>
      {spec.yoke && (
        <g transform={`translate(${spec.yokePos?.x ?? spec.x}, ${spec.yokePos?.y ?? spec.y}) scale(${spec.yokePos?.scale ?? spec.scale ?? 1})`}>
          <Yoke />
        </g>
      )}
      <g transform={outer}>
        <g transform={`${upper} ${squash}`}>
          {[-1, 1].map((s) => {
            const h = armPts(s)[2];
            return <circle key={s} cx={h[0]} cy={h[1]} r={10} fill={a.skin ?? SKIN} />;
          })}
          {spec.belt && (
            <g>
              <rect x={-74} y={-30} width={148} height={20} rx={6} fill="#3A3F47" />
              <rect x={-18} y={-34} width={36} height={28} rx={5} fill="#B9BEC3" stroke="#6E747C" strokeWidth={3} />
            </g>
          )}
          {spec.item === 'bottle' && (
            <g transform="translate(130, -320) rotate(-130)">
              <rect x={-18} y={-50} width={36} height={100} rx={12} fill="#BFE3F0" stroke="#7AB6C4" strokeWidth={4} opacity={0.95} />
              <rect x={-10} y={-66} width={20} height={18} rx={4} fill="#3A7CA5" />
            </g>
          )}
          {spec.item === 'extinguisher' && (
            <g transform="translate(40, -150)">
              <rect x={-26} y={-10} width={60} height={150} rx={22} fill="#C9483F" stroke="#8C2F29" strokeWidth={4} />
              <rect x={-14} y={-34} width={36} height={28} rx={6} fill="#2A2D33" />
              <path d="M 4,-30 Q -40,-60 -80,-30" fill="none" stroke="#2A2D33" strokeWidth={9} strokeLinecap="round" />
              <rect x={-20} y={40} width={48} height={40} rx={6} fill="#F2EEE6" />
            </g>
          )}
          {spec.item === 'aed' && (
            <g transform="translate(78, -40)">
              <rect x={-60} y={0} width={120} height={100} rx={14} fill="#E8692E" stroke="#A9471C" strokeWidth={4} />
              <path d="M 0,70 C -40,40 -30,18 -12,22 Q 0,26 0,38 Q 0,26 12,22 C 30,18 40,40 0,70 Z" fill="#FFFFFF" />
              <path d="M 4,30 L -6,50 L 4,50 L -4,66" stroke="#E8692E" strokeWidth={5} fill="none" />
              <text x={0} y={-8} textAnchor="middle" fontSize={26} fontWeight={900} fill="#E8692E" fontFamily="Noto Sans JP">AED</text>
            </g>
          )}
          {spec.item === 'bag' && (
            <g transform="translate(78, -40)">
              <path d="M -22,0 Q -22,-24 0,-24 Q 22,-24 22,0" fill="none" stroke="#3A3330" strokeWidth={7} />
              <rect x={-58} y={0} width={116} height={96} rx={16} fill="#8A6A4F" stroke="#5E4634" strokeWidth={4} />
              <rect x={-58} y={34} width={116} height={10} fill="#5E4634" />
            </g>
          )}
          {spec.item === 'phone' && (
            <g transform={`translate(70, ${HEAD_Y + 10}) rotate(-20)`}>
              <rect x={-12} y={-56} width={26} height={112} rx={12} fill="#3A3F47" />
              <rect x={-16} y={-62} width={34} height={30} rx={10} fill="#4A4F57" />
              <rect x={-16} y={34} width={34} height={30} rx={10} fill="#4A4F57" />
            </g>
          )}
          {spec.item === 'checklist' && (
            <g transform="translate(0, -150) rotate(-3)">
              <rect x={-56} y={-40} width={112} height={92} rx={6} fill="#F6F1E4" stroke="#B9AF9C" strokeWidth={3} />
              <rect x={-20} y={-48} width={40} height={14} rx={4} fill="#8A8F98" />
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <rect x={-42} y={-22 + i * 18} width={10} height={10} fill="none" stroke="#6E6A62" strokeWidth={2} />
                  <line x1={-26} y1={-17 + i * 18} x2={40} y2={-17 + i * 18} stroke="#9E978A" strokeWidth={3} />
                </g>
              ))}
            </g>
          )}
        </g>
        <g transform={`${upper} translate(0, ${headLift})`}>
          {/* 頭 */}
          <g transform={`translate(${headX}, ${headY}) rotate(${headRot}, 0, ${HEAD_Y + 60}) translate(0, ${HEAD_Y}) scale(${headScale}) translate(0, ${-HEAD_Y})`}>
            <line x1={0} y1={-196} x2={0} y2={HEAD_Y + 50} stroke={a.skin ?? SKIN} strokeWidth={22} />
            <Hair a={a} back />
            <circle cx={0} cy={HEAD_Y} r={HEAD_R} fill={a.skin ?? SKIN} />
            <Hair a={a} />
            <Face expression={expression} look={spec.look ?? 'center'} blinking={blinking} mouthOpen={mouthOpen} sweat={!!spec.sweat} frame={frame} />
          </g>
        </g>
      </g>
    </g>
  );
};
