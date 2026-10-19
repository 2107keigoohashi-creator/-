import {CalculateMetadataFunction, staticFile} from 'remotion';
import defaultCast from '../episodes/cast.json';
import {
  FALLBACK_MIN_SEC,
  FALLBACK_SEC_PER_CHAR,
  FPS,
  SCENE_TAIL_SEC,
} from './config';
import {displayChunk, splitChunks} from '../shared/text.mjs';
import {CastMember, Episode, EpisodeProps, ResolvedScene, SoundCue, SubtitleChunk} from './types';

// episodes/ 以下の ep*.json をすべて読み込む（ファイルを足すとコンポジションが増える）
const ctx = require.context('../episodes', false, /^\.\/ep[^/]*\.json$/);

export const episodeIds: string[] = ctx
  .keys()
  .map((k) => k.replace(/^\.\//, '').replace(/\.json$/, ''))
  .sort();

export const getEpisode = (id: string): Episode => ctx(`./${id}.json`) as Episode;

export const sceneAudioPath = (episodeId: string, index: number) =>
  `audio/${episodeId}/scene${String(index + 1).padStart(2, '0')}.wav`;

// WAV のヘッダから長さ（秒）を読む
const wavDuration = (buf: ArrayBuffer): number | null => {
  const v = new DataView(buf);
  const tag = (o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
  if (buf.byteLength < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  let byteRate = 0;
  let off = 12;
  while (off + 8 <= buf.byteLength) {
    const id = tag(off);
    const size = v.getUint32(off + 4, true);
    if (id === 'fmt ') byteRate = v.getUint32(off + 16, true);
    if (id === 'data' && byteRate > 0) {
      const dataSize = Math.min(size, buf.byteLength - off - 8);
      return dataSize / byteRate;
    }
    off += 8 + size + (size % 2);
  }
  return null;
};

const fetchAudioDuration = async (path: string): Promise<number | null> => {
  try {
    const res = await fetch(staticFile(path));
    if (!res.ok) return null;
    return wavDuration(await res.arrayBuffer());
  } catch {
    return null;
  }
};

// 音声生成時に書き出した字幕タイミング。無ければ文字数で割り振る
const loadSubtitles = async (path: string, narration: string, sec: number): Promise<SubtitleChunk[]> => {
  try {
    const res = await fetch(staticFile(path));
    if (res.ok) return ((await res.json()) as {chunks: SubtitleChunk[]}).chunks;
  } catch {
    // 無ければ下で作る
  }
  const chunks = splitChunks(narration) as string[];
  const total = chunks.reduce((a, c) => a + [...c].length, 0) || 1;
  let t = 0.1;
  const span = Math.max(0.5, sec - 0.2);
  return chunks.map((c) => {
    const d = ([...c].length / total) * span;
    const item = {text: displayChunk(c), start: t, end: t + d};
    t += d;
    return item;
  });
};

const fileExists = async (path: string): Promise<boolean> => {
  try {
    const res = await fetch(staticFile(path), {method: 'HEAD'});
    return res.ok;
  } catch {
    return false;
  }
};

const keepExisting = async (cues: SoundCue[]): Promise<SoundCue[]> => {
  const ok = await Promise.all(cues.map((c) => fileExists(c.file)));
  return cues.filter((_, i) => ok[i]);
};

export const calculateEpisodeMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const ep = getEpisode(props.episodeId);
  const cast: Record<string, CastMember> = {...(defaultCast as Record<string, CastMember>), ...(ep.cast ?? {})};

  const seen = new Set<string>();
  const scenes: ResolvedScene[] = [];
  let from = 0;

  for (let i = 0; i < ep.scenes.length; i++) {
    const s = ep.scenes[i];
    const audio = sceneAudioPath(props.episodeId, i);
    const audioSec = await fetchAudioDuration(audio);
    const spokenChars = s.narration.replace(/[「」『』（）()…、。？！\s]/g, '').length;
    const sec = audioSec ?? Math.max(FALLBACK_MIN_SEC, spokenChars * FALLBACK_SEC_PER_CHAR);
    const durationInFrames = Math.ceil((sec + SCENE_TAIL_SEC) * FPS);

    const newTags: string[] = [];
    for (const c of s.characters ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      if (s.nameTags !== false && c.tag !== false && cast[c.id]?.tagName) newTags.push(c.id);
    }

    const showSubs = (s.subtitles ?? ep.subtitles ?? true) && s.narration.trim().length > 0;
    const subs = showSubs ? await loadSubtitles(audio.replace(/\.wav$/, '.json'), s.narration, sec) : [];

    scenes.push({
      ...s,
      subs,
      index: i,
      from,
      durationInFrames,
      audio: audioSec === null ? null : audio,
      se: await keepExisting(s.se ?? []),
      newTags,
    });
    from += durationInFrames;
  }

  const bgm = ep.bgm && (await fileExists(ep.bgm.file)) ? ep.bgm : null;

  return {
    durationInFrames: Math.max(1, from),
    props: {...props, resolved: {scenes, cast, bgm}},
  };
};
