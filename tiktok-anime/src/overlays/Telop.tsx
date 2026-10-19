import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT_FAMILY, SAFE, WIDTH} from '../config';

type Seg = {text: string; red: boolean};

// 「もし【機長が倒れた】ら」→ 赤い部分と白い部分に分ける（【】は表示しない）
export const parseTelop = (s: string): Seg[] => {
  const out: Seg[] = [];
  const re = /【([^】]*)】/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({text: s.slice(last, m.index), red: false});
    out.push({text: m[1], red: true});
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({text: s.slice(last), red: false});
  return out;
};

const MAX_W = WIDTH - SAFE.left - SAFE.right;
const MAX_SIZE = 92;
const MIN_SIZE = 64;
const plainLen = (s: string) => [...s.replace(/[【】]/g, '')].length;

// 改行位置を決める。空白 > 【】の境目 > 句読点 の順に、真ん中に近い所で切る
const splitLine = (line: string): string[] => {
  const chars = [...line];
  const n = plainLen(line);
  if (n * MIN_SIZE <= MAX_W || n < 4) return [line];
  const cands: {i: number; w: number}[] = [];
  chars.forEach((c, i) => {
    if (c === ' ' || c === '　') cands.push({i, w: 3});
    if (c === '【' && i > 0) cands.push({i, w: 2});
    if (c === '】' && i < chars.length - 1) cands.push({i: i + 1, w: 2});
    if ('、。？！'.includes(c)) cands.push({i: i + 1, w: 1});
  });
  let best = {i: Math.ceil(chars.length / 2), score: Infinity};
  for (const c of cands) {
    const left = plainLen(chars.slice(0, c.i).join(''));
    const score = Math.abs(left - n / 2) - c.w * 2;
    if (score < best.score) best = {i: c.i, score};
  }
  const a = chars.slice(0, best.i).join('').trim();
  const b = chars.slice(best.i).join('').trim();
  if (!a || !b) return [line];
  return [a, b];
};

export const layoutTelop = (text: string) => {
  let lines = text.split('\n').flatMap(splitLine);
  // 【】が行をまたいだら閉じ直す
  let open = false;
  lines = lines.map((l) => {
    let s = open ? '【' + l : l;
    const o = (s.match(/【/g) ?? []).length;
    const c = (s.match(/】/g) ?? []).length;
    open = o > c;
    if (open) s += '】';
    return s;
  });
  const longest = Math.max(...lines.map(plainLen));
  const size = Math.max(MIN_SIZE - 8, Math.min(MAX_SIZE, Math.floor(MAX_W / longest)));
  return {lines, size};
};

const Line: React.FC<{line: string; stroke: boolean; size: number}> = ({line, stroke, size}) => (
  <div style={{whiteSpace: 'nowrap'}}>
    {parseTelop(line).map((seg, i) => (
      <span
        key={i}
        style={{
          color: stroke ? COLORS.telopStroke : seg.red ? COLORS.accent : COLORS.telop,
          WebkitTextStroke: stroke ? `${Math.round(size * 0.2)}px ${COLORS.telopStroke}` : undefined,
        }}
      >
        {seg.text}
      </span>
    ))}
  </div>
);

export const Telop: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {lines, size} = layoutTelop(text);
  const s = interpolate(frame, [0, 6], [0.86, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
  const o = interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
  const box: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_FAMILY,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 1.28,
    letterSpacing: 2,
    textAlign: 'center',
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        width: MAX_W,
        top: SAFE.telopTop,
        height: SAFE.telopBottom - SAFE.telopTop,
        transform: `scale(${s})`,
        opacity: o,
      }}
    >
      <div style={box}>
        {lines.map((l, i) => (
          <Line key={i} line={l} stroke size={size} />
        ))}
      </div>
      <div style={box}>
        {lines.map((l, i) => (
          <Line key={i} line={l} stroke={false} size={size} />
        ))}
      </div>
    </div>
  );
};
