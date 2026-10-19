// VOICEVOX がどう読むか（カタカナ）を一覧で出す。読み間違いを見つけたら台本の reading で直す
//   node scripts/check-reading.mjs ep02-1
import fs from 'node:fs';
import path from 'node:path';
import {speakText} from '../shared/text.mjs';

const ENGINE = process.env.VOICEVOX_URL ?? 'http://localhost:50021';
const episodeId = process.argv[2] ?? 'ep01';
const root = path.resolve(import.meta.dirname, '..');
const ep = JSON.parse(fs.readFileSync(path.join(root, `episodes/${episodeId}.json`), 'utf8'));
for (const [i, s] of ep.scenes.entries()) {
  const text = speakText(s.reading ?? s.narration);
  const res = await fetch(`${ENGINE}/audio_query?speaker=13&text=${encodeURIComponent(text)}`, {method: 'POST'});
  const q = await res.json();
  console.log(`${String(i + 1).padStart(2, '0')}  ${s.narration}\n    ${q.kana.replace(/['_]/g, '')}`);
}
