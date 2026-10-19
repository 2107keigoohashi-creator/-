import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Watermark} from './overlays/Overlays';
import {SceneView} from './Scene';
import {EpisodeProps} from './types';

export const EpisodeVideo: React.FC<EpisodeProps> = ({resolved}) => {
  if (!resolved) return null;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {resolved.scenes.map((s) => (
        <Sequence key={s.index} from={s.from} durationInFrames={s.durationInFrames} name={`scene${String(s.index + 1).padStart(2, '0')}`}>
          <SceneView scene={s} cast={resolved.cast} />
        </Sequence>
      ))}
      {resolved.bgm && <Audio src={staticFile(resolved.bgm.file)} volume={resolved.bgm.volume ?? 0.15} loop />}
      <Watermark />
    </AbsoluteFill>
  );
};
