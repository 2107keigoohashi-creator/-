// ナレーションの音量をそろえる（2パスの loudnorm）
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';

// TikTok などでよく使われる目安の音量
export const TARGET_LUFS = -14;
const TRUE_PEAK = -1.5;

export const normalize = (file) => {
  const base = `I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=11`;
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `loudnorm=${base}:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  // 測定結果は stderr の最後の JSON
  const m = JSON.parse(out.slice(out.lastIndexOf('{'), out.lastIndexOf('}') + 1));
  const sr = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', file]).toString().trim();
  const tmp = file.replace(/\.wav$/, '.norm.wav');
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', file,
    '-af', `loudnorm=${base}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-ar', sr, '-ac', '1', '-c:a', 'pcm_s16le', tmp,
  ]);
  fs.renameSync(tmp, file);
};
