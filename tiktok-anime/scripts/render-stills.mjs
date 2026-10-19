// シーンの静止画を書き出す
//   node scripts/render-stills.mjs ep01 1 4 9        → 各シーンの真ん中あたり
//   node scripts/render-stills.mjs ep01 9@0.5 9@3    → シーン9の0.5秒目と3秒目
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {browserExecutable} from './browser.mjs';

const [episodeId = 'ep01', ...targets] = process.argv.slice(2);
if (targets.length === 0) {
  console.error('使い方: node scripts/render-stills.mjs ep01 1 4 9@2.5');
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const composition = await selectComposition({serveUrl, id: episodeId, inputProps: {episodeId}, browserExecutable});
const scenes = composition.props.resolved.scenes;
fs.mkdirSync(path.join(root, 'out/stills'), {recursive: true});

for (const target of targets) {
  const [num, sec] = target.split('@');
  const scene = scenes[Number(num) - 1];
  if (!scene) throw new Error(`シーン ${num} はありません`);
  const offset = sec === undefined ? Math.floor(scene.durationInFrames * 0.6) : Math.round(Number(sec) * composition.fps);
  const frame = scene.from + Math.min(offset, scene.durationInFrames - 1);
  const output = path.join(root, `out/stills/${episodeId}_scene${String(num).padStart(2, '0')}${sec ? `_${sec}s` : ''}.png`);
  await renderStill({composition, serveUrl, frame, output, inputProps: composition.props, browserExecutable});
  console.log(`✓ ${path.relative(root, output)}  (frame ${frame})`);
}
