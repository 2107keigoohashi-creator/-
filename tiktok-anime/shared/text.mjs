// 字幕の区切りと、読み上げ用テキストの整形（Remotion とスクリプトの両方で使う）

// 字幕1枚あたりの最大文字数の目安
export const SUBTITLE_MAX = 20;

const visibleLen = (s) => [...s.replace(/[「」『』\s]/g, '')].length;

// 「。！？」で区切り、長い文は「、」でさらに区切る
export const splitChunks = (text, max = SUBTITLE_MAX) => {
  const sentences = text.match(/[^。！？!?]+[。！？!?]*[」』]?/g) ?? [text];
  const out = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (visibleLen(s) <= max) {
      out.push(s);
      continue;
    }
    // 「、」の位置で、なるべく max 以内に収まるよう貪欲にまとめる
    const parts = s.match(/[^、]+、?/g) ?? [s];
    let cur = '';
    for (const p of parts) {
      if (cur && visibleLen(cur + p) > max) {
        out.push(cur);
        cur = p;
      } else cur += p;
    }
    if (cur) out.push(cur);
  }
  return out.map((c) => c.replace(/^[…、]+/, '').trim()).filter((c) => visibleLen(c) > 0);
};

// 字幕に出すときの整形（文末の「。」「、」は消す）
export const displayChunk = (c) => c.replace(/[。、]+$/, '');

// VOICEVOX がカタコトにならないよう読み上げ用に整える
export const speakText = (t) =>
  t
    .replace(/(?<=[ァ-ヴー])・(?=[ァ-ヴー])/g, '')
    .replace(/…+/g, '、')
    .replace(/、+/g, '、')
    .replace(/^、/, '')
    .replace(/([。！？])、/g, '$1');

// 字幕1行の最大文字数（これを超えたら助詞などの切れ目で2行にする）
export const SUBTITLE_LINE = 19;

export const breakLines = (text, max = SUBTITLE_LINE) => {
  const chars = [...text];
  if (chars.length <= max) return [text];
  const mid = chars.length / 2;
  // 切れ目の候補（「、」の後 > 助詞の後・「の前）
  const cands = [];
  for (let i = 2; i < chars.length - 2; i++) {
    const prev = chars[i - 1];
    const next = chars[i];
    let w = 0;
    if ('、」』'.includes(prev)) w = 3;
    else if ('はがをにでともへや'.includes(prev) && !/[ぁ-んー]/.test(next)) w = 2;
    else if (next === '「') w = 2;
    if (w) cands.push({i, score: Math.abs(i - mid) - w * 1.5, fits: i <= max && chars.length - i <= max + 2});
  }
  const pick = (list) => list.sort((a, b) => a.score - b.score)[0];
  const best = pick(cands.filter((c) => c.fits)) ?? pick(cands);
  const at = best ? best.i : Math.min(max, Math.ceil(mid));
  const head = chars.slice(0, at).join('');
  const tail = chars.slice(at).join('');
  // 2行に収まらない長さなら、さらに分ける（目安は最大3行）
  return [...(head.length > max + 2 ? breakLines(head, max) : [head]), ...(tail.length > max + 2 ? breakLines(tail, max) : [tail])];
};
