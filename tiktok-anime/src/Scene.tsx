import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BACKGROUNDS} from './backgrounds';
import {Character} from './characters/Character';
import {CAMERA_ZOOM_FROM, CAMERA_ZOOM_TO, HEIGHT, WIDTH} from './config';
import {NameTags, OverlayLayer} from './overlays/Overlays';
import {Subtitles} from './overlays/Subtitles';
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
  let cameraStyle: React.CSSProperties = {transform: `scale(${zoom})`, transformOrigin: `${cam.focusX ?? WIDTH / 2}px ${cam.focusY ?? HEIGHT * 0.45}px`};

  // カット：at 秒で画角を切り替え、そこからまたゆっくりズーム
  const cuts = [...(scene.cuts ?? [])].sort((a, b) => a.at - b.at);
  const active = cuts.filter((c) => frame >= c.at * fps).pop();
  if (active) {
    const i = cuts.indexOf(active);
    const start = active.at * fps;
    const end = i + 1 < cuts.length ? cuts[i + 1].at * fps : scene.durationInFrames;
    const base = active.zoom ?? 1.5;
    const z = interpolate(frame, [start, Math.max(start + 1, end)], [base, base * 1.05], {extrapolateRight: 'clamp'});
    const fx = active.focusX ?? WIDTH / 2;
    const fy = active.focusY ?? HEIGHT * 0.45;
    // 注目点を画面のやや上（テロップの上）に置き、画面の外が見えないよう端で止める
    const tx = Math.min(0, Math.max(WIDTH - WIDTH * z, WIDTH / 2 - fx * z));
    const ty = Math.min(0, Math.max(HEIGHT - HEIGHT * z, HEIGHT * 0.4 - fy * z));
    cameraStyle = {transform: `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: '0 0'};
  }
  const overlays = scene.overlays ?? [];

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={cameraStyle}>
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
      {scene.subs.length > 0 && <Subtitles subs={scene.subs} />}
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
      {scene.se.map((se, i) => (
        <Sequence key={i} from={Math.round((se.at ?? 0) * fps)} layout="none">
          <Audio src={staticFile(se.file)} volume={se.volume ?? 0.6} loop={se.loop} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
