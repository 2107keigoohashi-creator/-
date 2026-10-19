import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_FAMILY, SAFE, WIDTH} from '../config';
import {breakLines} from '../../shared/text.mjs';
import {SubtitleChunk} from '../types';

// ナレーション字幕（大きなテロップの下に、読み上げに合わせて切り替わる）
export const Subtitles: React.FC<{subs: SubtitleChunk[]}> = ({subs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  // 区切りの間（息継ぎ）も直前の字幕を出したままにする
  let cur: SubtitleChunk | null = null;
  for (const s of subs) if (t >= s.start - 0.05) cur = s;
  if (!cur || t > subs[subs.length - 1].end + 0.3) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.left,
        width: WIDTH - SAFE.left - SAFE.right,
        top: SAFE.telopBottom + 14,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.35,
          color: '#FFFFFF',
          background: 'rgba(0,0,0,0.62)',
          borderRadius: 14,
          padding: '8px 22px 10px',
          textAlign: 'center',
          maxWidth: '100%',
        }}
      >
        {breakLines(cur.text).map((l, i) => (
          <div key={i} style={{whiteSpace: 'nowrap'}}>{l}</div>
        ))}
      </div>
    </div>
  );
};
