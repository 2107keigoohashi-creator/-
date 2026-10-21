// 台本 JSON（episodes/*.json）の型

export type Expression = 'normal' | 'surprised' | 'panic' | 'closed';
export type Look = 'center' | 'left' | 'right' | 'down' | 'up';
export type HairStyle = 'short' | 'bun' | 'long' | 'gray';

export type Appearance = {
  clothes: string;
  hair: string;
  hairStyle: HairStyle;
  skin?: string;
  // 肩章の線の数（機長 4 / 副操縦士 3）
  stripes?: number;
  tie?: string;
  scarf?: string;
};

export type CastMember = {
  tagName?: string;
  tagDesc?: string;
  appearance: Appearance;
};

export type Move = {
  x?: number;
  y?: number;
  scale?: number;
  at?: number;
  duration?: number;
};

export type CharacterInScene = {
  id: string;
  x: number;
  y: number;
  scale?: number;
  pose?: 'stand' | 'sit';
  seat?: 'pilot' | 'cabin' | null;
  expression?: Expression;
  look?: Look;
  flip?: boolean;
  blink?: boolean;
  breathe?: boolean;
  talking?: boolean;
  sweat?: boolean;
  item?: 'checklist' | 'phone' | 'bag' | null;
  // 両手を前に（操縦桿を握る）
  hold?: boolean;
  // 前に操縦桿を描く（位置は最初の x, y に固定）
  yoke?: boolean;
  // 操縦桿の位置を別に指定したいとき（座席を下げた後のシーンなど）
  yokePos?: {x: number; y: number; scale?: number};
  // 倒れる。collapse は at 秒から倒れ始める、collapsed は最初から倒れている
  // brace は at 秒から衝撃防止姿勢（頭を下げて手で守る）
  // stop は両手を広げて止めるポーズ
  action?: 'collapse' | 'collapsed' | 'reach' | 'brace' | 'stop' | null;
  at?: number;
  reachArm?: 'left' | 'right';
  reachAngle?: number;
  move?: Move;
  appearance?: Partial<Appearance>;
  tag?: boolean;
};

export type Overlay = {
  type: string;
  at?: number;
  duration?: number;
  [key: string]: unknown;
};

export type SoundCue = {
  file: string;
  at?: number;
  volume?: number;
  loop?: boolean;
};

export type Scene = {
  memo?: string;
  narration: string;
  // 読み上げ用のテキスト（漢字の読み間違いを直したいとき）
  reading?: string;
  telop?: string;
  voice?: string;
  background: string;
  bgProps?: Record<string, unknown>;
  characters?: CharacterInScene[];
  overlays?: Overlay[];
  se?: SoundCue[];
  camera?: {from?: number; to?: number; focusX?: number; focusY?: number};
  // シーン内のカット割り。at 秒で画角を切り替える（zoom 倍率で focusX, focusY を画面中央に）
  cuts?: Cut[];
  nameTags?: boolean;
  // ナレーション字幕を出すか（既定 true）
  subtitles?: boolean;
};

export type Cut = {at: number; zoom?: number; focusX?: number; focusY?: number};

export type SubtitleChunk = {text: string; start: number; end: number};

export type Episode = {
  title: string;
  voice?: string;
  subtitles?: boolean;
  bgm?: SoundCue;
  cast?: Record<string, CastMember>;
  scenes: Scene[];
};

// calculateMetadata で解決したあとの情報
export type ResolvedScene = Scene & {
  index: number;
  from: number;
  durationInFrames: number;
  audio: string | null;
  se: SoundCue[];
  newTags: string[];
  subs: SubtitleChunk[];
};

export type EpisodeProps = {
  episodeId: string;
  resolved?: {
    scenes: ResolvedScene[];
    cast: Record<string, CastMember>;
    bgm: SoundCue | null;
  };
};
