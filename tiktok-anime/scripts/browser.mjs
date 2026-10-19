// Chrome の場所。普段は null（Remotion が自動で用意する）。
// 用意済みのブラウザを使いたいときは環境変数 REMOTION_BROWSER で指定する。
import fs from 'node:fs';

const candidates = [process.env.REMOTION_BROWSER, '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'];
export const browserExecutable = candidates.find((p) => p && fs.existsSync(p)) ?? null;
