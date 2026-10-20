// 仮の効果音を ffmpeg で作る（public/assets/audio/ に既にあれば上書きしない）
//   node scripts/make-se.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '../public/assets/audio');
fs.mkdirSync(dir, {recursive: true});

const SE = {
  // 心拍：ドクン、ドクン（1秒に1回、6秒）
  'heartbeat.wav': ['-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*55*t)*(exp(-28*mod(t,1))+0.7*exp(-28*mod(t-0.22,1))*gte(mod(t,1),0.22))':s=44100:d=6", '-af', 'lowpass=f=180'],
  // 機内放送のチャイム：ポーン
  'chime.wav': ['-f', 'lavfi', '-i', "aevalsrc='0.35*(sin(2*PI*880*t)+0.5*sin(2*PI*1760*t))*exp(-2.5*t)*lt(t,0.6)+0.35*(sin(2*PI*698*(t-0.6))+0.5*sin(2*PI*1396*(t-0.6)))*exp(-2.5*(t-0.6))*gte(t,0.6)':s=44100:d=2.4"],
  // 無線のノイズ（ザーッ＋プツプツ）
  'radio_noise.wav': ['-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.5:d=8:r=44100', '-af', "highpass=f=500,lowpass=f=3500,volume='0.35+0.25*sin(2*PI*0.7*t)':eval=frame,acrusher=bits=6:mix=0.3"],
  // 救急車のサイレン（ピーポー）
  'siren.wav': ['-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*(960*lt(mod(t,1.3),0.65)+770*gte(mod(t,1.3),0.65))*t)':s=44100:d=7", '-af', 'lowpass=f=2500,afade=t=in:d=1.5'],
  // 火災警報のベル（ジリリリ）
  'fire_bell.wav': ['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*1050*t)*(0.5+0.5*sin(2*PI*22*t))*lt(mod(t,1.2),0.9)':s=44100:d=4.8"],
  // 消火剤の噴射（プシューッ）
  'whoosh.wav': ['-f', 'lavfi', '-i', 'anoisesrc=c=pink:a=0.6:d=1.8:r=44100', '-af', 'highpass=f=300,afade=t=in:d=0.05,afade=t=out:st=0.5:d=1.3'],
  // 緊急脱出の警報（ピーピー）
  'evac_horn.wav': ['-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*2200*t)*lt(mod(t,0.5),0.25)':s=44100:d=4"],
};

for (const [name, args] of Object.entries(SE)) {
  const out = path.join(dir, name);
  if (fs.existsSync(out)) {
    console.log(`- ${name}（既にあるので飛ばします）`);
    continue;
  }
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args, out]);
  console.log(`✓ ${name}`);
}
