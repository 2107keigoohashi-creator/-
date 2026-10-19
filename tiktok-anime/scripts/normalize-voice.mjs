// 置いてある wav（手で置いたものも含む）の音量をまとめてそろえる
//   node scripts/normalize-voice.mjs ep01
import fs from 'node:fs';
import path from 'node:path';
import {normalize, TARGET_LUFS} from './loudness.mjs';

const episodeId = process.argv[2] ?? 'ep01';
const dir = path.resolve(import.meta.dirname, `../public/audio/${episodeId}`);
const files = fs.readdirSync(dir).filter((f) => /^scene\d+\.wav$/.test(f)).sort();
for (const f of files) {
  normalize(path.join(dir, f));
  console.log(`✓ ${f} → ${TARGET_LUFS} LUFS`);
}
