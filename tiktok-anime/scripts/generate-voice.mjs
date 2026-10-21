// VOICEVOX Engine でシーンごとのナレーション音声を作る
//   node scripts/generate-voice.mjs ep01            → 台本が変わったシーンだけ作り直す
//   node scripts/generate-voice.mjs ep01 --force    → 全シーン作り直す
//   node scripts/generate-voice.mjs ep01 --only 3,5 → 指定したシーンだけ
//
// 出力: public/audio/<回>/sceneXX.wav
// 手で録った wav を同じ名前で置けば、それがそのまま使われる（.txt が無いファイルは上書きしない）
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {displayChunk, speakText, splitChunks} from '../shared/text.mjs';
import {normalize} from './loudness.mjs';

const ENGINE = process.env.VOICEVOX_URL ?? 'http://localhost:50021';
const root = path.resolve(import.meta.dirname, '..');

const args = process.argv.slice(2);
const episodeId = args.find((a) => !a.startsWith('--')) ?? 'ep01';
const force = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(',').map(Number)) : null;

const ep = JSON.parse(fs.readFileSync(path.join(root, `episodes/${episodeId}.json`), 'utf8'));
const voices = JSON.parse(fs.readFileSync(path.join(root, 'episodes/voices.json'), 'utf8'));
const outDir = path.join(root, `public/audio/${episodeId}`);
fs.mkdirSync(outDir, {recursive: true});

const get = async (p, init) => {
  const res = await fetch(ENGINE + p, init);
  if (!res.ok) throw new Error(`${p}: ${res.status} ${await res.text()}`);
  return res;
};

let speakers;
try {
  speakers = await (await get('/speakers')).json();
} catch {
  console.error(`VOICEVOX Engine (${ENGINE}) に接続できません。

  起動するには:
    docker run --rm -d -p 50021:50021 voicevox/voicevox_engine:cpu-latest

  VOICEVOX が使えない場合は、各シーンの音声を
    public/audio/${episodeId}/scene01.wav, scene02.wav, ...
  に手で置いてください。置いた wav の長さでシーンの長さが決まります。`);
  process.exit(1);
}

const styleId = (preset) => {
  const sp = speakers.find((s) => s.name === preset.speaker);
  const st = sp?.styles.find((s) => s.name === preset.style);
  if (!st) throw new Error(`話者が見つかりません: ${preset.speaker} / ${preset.style}`);
  return st.id;
};

// 無線っぽい音（帯域を絞る＋軽く歪ませる＋ノイズ）
const radioFilter = (file) => {
  const tmp = file.replace(/\.wav$/, '.raw.wav');
  fs.renameSync(file, tmp);
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', tmp,
    '-filter_complex',
    '[0]highpass=f=450,lowpass=f=2800,acompressor=threshold=0.1:ratio=6,volume=2.2,acrusher=bits=10:mix=0.4[v];' +
      'anoisesrc=c=pink:a=0.035:r=24000,highpass=f=400,lowpass=f=4000[n];' +
      '[v][n]amix=inputs=2:duration=first:normalize=0',
    '-ar', '24000', '-ac', '1', file,
  ]);
  fs.unlinkSync(tmp);
};

const PRE = 0.12;
const POST = 0.12;

const query = async (text, speaker) =>
  (await get(`/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`, {method: 'POST'})).json();

// 音素の長さの合計（秒）
const spokenLength = (q, params) => {
  let sec = 0;
  for (const ap of q.accent_phrases) {
    for (const m of ap.moras) sec += (m.consonant_length ?? 0) + m.vowel_length;
    if (ap.pause_mora) sec += ap.pause_mora.vowel_length * params.pauseLengthScale;
  }
  return sec / params.speedScale;
};

const wavSeconds = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

// 字幕の区切りごとの表示時間を、区切りごとの読み上げの長さから割り振る
const subtitleTimes = async (scene, speaker, params, wav) => {
  const shown = splitChunks(scene.narration);
  const spoken = splitChunks(speakText(scene.reading ?? scene.narration));
  let weights;
  if (spoken.length === shown.length) {
    weights = [];
    for (const c of spoken) weights.push(spokenLength(await query(c, speaker), params));
  } else {
    weights = shown.map((c) => [...c].length);
  }
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const start = PRE;
  const span = wavSeconds(wav) - PRE - POST;
  let t = start;
  return {
    chunks: shown.map((c, i) => {
      const d = (weights[i] / total) * span;
      const item = {text: displayChunk(c), start: +t.toFixed(3), end: +(t + d).toFixed(3)};
      t += d;
      return item;
    }),
  };
};

// 機内放送っぽい音（帯域を少し絞って、軽い反響）
const paFilter = (file) => {
  const tmp = file.replace(/\.wav$/, '.raw.wav');
  fs.renameSync(file, tmp);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tmp, '-af', 'highpass=f=250,lowpass=f=5000,aecho=0.8:0.5:40:0.25', '-ar', '24000', '-ac', '1', file]);
  fs.unlinkSync(tmp);
};

let made = 0;
for (let i = 0; i < ep.scenes.length; i++) {
  if (only && !only.has(i + 1)) continue;
  const scene = ep.scenes[i];
  const name = `scene${String(i + 1).padStart(2, '0')}`;
  const wav = path.join(outDir, `${name}.wav`);
  const stamp = path.join(outDir, `${name}.txt`);
  const presetName = scene.voice ?? ep.voice ?? 'narrator';
  const preset = voices[presetName];
  if (!preset) throw new Error(`episodes/voices.json に "${presetName}" がありません`);
  // reading があれば読み上げにはそちらを使う（漢字の読み間違い対策）
  const text = speakText(scene.reading ?? scene.narration);
  const signature = JSON.stringify({text, preset});

  if (!force && fs.existsSync(wav)) {
    if (!fs.existsSync(stamp)) {
      console.log(`- ${name}: 手動の wav があるのでそのまま使います`);
      continue;
    }
    if (fs.readFileSync(stamp, 'utf8') === signature) continue;
  }

  const speaker = styleId(preset);
  const params = {
    speedScale: preset.speedScale ?? 1,
    pitchScale: preset.pitchScale ?? 0,
    intonationScale: preset.intonationScale ?? 1,
    volumeScale: preset.volumeScale ?? 1,
    pauseLengthScale: preset.pauseLengthScale ?? 1,
    prePhonemeLength: PRE,
    postPhonemeLength: POST,
  };
  const q = {...(await query(text, speaker)), ...params};
  const audio = await (
    await get(`/synthesis?speaker=${speaker}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(q)})
  ).arrayBuffer();
  // 途中で失敗しても半端な wav が「手動の音声」扱いにならないよう、仮の名前で作ってから置き換える
  const work = wav.replace(/\.wav$/, '.work.wav');
  fs.writeFileSync(work, Buffer.from(audio));
  if (preset.filter === 'radio') radioFilter(work);
  if (preset.filter === 'pa') paFilter(work);
  normalize(work);
  const subs = await subtitleTimes(scene, speaker, params, work);
  fs.renameSync(work, wav);
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(subs, null, 1));
  fs.writeFileSync(stamp, signature);
  made++;
  console.log(`✓ ${name} (${presetName}) ${text.slice(0, 24)}…`);
}
console.log(made ? `${made} 本の音声を作りました → public/audio/${episodeId}/` : '作り直すシーンはありませんでした');
