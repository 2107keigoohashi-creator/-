import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BACKGROUNDS} from './backgrounds';
import {Character} from './characters/Character';
import {CAMERA_ZOOM_FROM, CAMERA_ZOOM_TO, HEIGHT, WIDTH} from './config';
import {NameTags, OverlayLayer} from './overlays/Overlays';
import {Telop} from './overlays/Telop';
import {Appearance, CastMember, ResolvedScene} from './types';

const DEFAULT_LOOK: Appearance = {clothes: '#7A7F99', hair: '#3A3330', hairStyle: 'short'};

export const SceneView: React.FC<{scene: ResolvedScene; cast: Record<string, CastMember>}> = ({scene, cast}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const Bg = BACKGROUNDS[scene.background] ?? BACKGROUNDS.plain;
  const p = scene.bgProps ?? {};
  const cam = scene.camera ?? {};
  const zoom = interpolate(frame, [0, scene.durationInFrames], [cam.from ?? CAMERA_ZOOM_FROM, cam.to ?? CAMERA_ZOOM_TO], {extrapolateRight: 'clamp'});
  const overlays = scene.overlays ?? [];

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${cam.focusX ?? WIDTH / 2}px ${cam.focusY ?? HEIGHT * 0.45}px`}}>
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0}}>
          <Bg layer="back" p={p} />
          {(scene.characters ?? []).map((c, i) => {
            const look = {...DEFAULT_LOOK, ...(cast[c.id]?.appearance ?? {}), ...(c.appearance ?? {})};
            return <Character key={`${c.id}-${i}`} spec={c} appearance={look} />;
          })}
          <Bg layer="front" p={p} />
        </svg>
        <OverlayLayer overlays={overlays} world sceneFrames={scene.durationInFrames} />
      </AbsoluteFill>
      <OverlayLayer overlays={overlays} world={false} sceneFrames={scene.durationInFrames} />
      {scene.newTags.length > 0 && <NameTags ids={scene.newTags} cast={cast} />}
      {scene.telop && <Telop text={scene.telop} />}
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
      {scene.se.map((se, i) => (
        <Sequence key={i} from={Math.round((se.at ?? 0) * fps)} layout="none">
          <Audio src={staticFile(se.file)} volume={se.volume ?? 0.6} loop={se.loop} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
