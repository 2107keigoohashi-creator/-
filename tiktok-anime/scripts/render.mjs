// 1話分を mp4 に書き出す
//   node scripts/render.mjs ep01   → out/ep01.mp4
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {browserExecutable} from './browser.mjs';

const episodeId = process.argv[2] ?? 'ep01';
const root = path.resolve(import.meta.dirname, '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const composition = await selectComposition({serveUrl, id: episodeId, inputProps: {episodeId}, browserExecutable});

const {scenes, bgm} = composition.props.resolved;
const silent = scenes.filter((s) => !s.audio).map((s) => s.index + 1);
if (silent.length) console.warn(`⚠ 音声が無いシーン: ${silent.join(', ')}（文字数から仮の長さを使います）`);
if (!bgm) console.warn('・BGM なし');
console.log(`${scenes.length} シーン / ${(composition.durationInFrames / composition.fps).toFixed(1)} 秒`);

const outputLocation = path.join(root, `out/${episodeId}.mp4`);
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  crf: 18,
  audioCodec: 'aac',
  outputLocation,
  inputProps: composition.props,
  browserExecutable,
  onProgress: ({progress}) => {
    const p = Math.floor(progress * 10);
    if (p !== last) {
      last = p;
      process.stdout.write(`${p * 10}% `);
    }
  },
});
console.log(`\n✓ ${path.relative(root, outputLocation)}`);
