# TikTok 縦型アニメ量産キット（Remotion）

台本 JSON（`episodes/epXX.json`）を書くだけで、1080x1920・30fps の mp4 が作れます。
キャラ・背景はすべて SVG の React コンポーネントで、外部画像は使いません。

```
episodes/
  ep01.json        台本（1ファイル = 1話。ep で始まる名前ならコンポジションが自動で増える）
  cast.json        登場人物（服の色・髪型・肩章・名前札の文言）
  voices.json      声の設定（narrator = 青山龍星、radio = 玄野武宏＋無線フィルター）
public/
  audio/ep01/scene01.wav ...   ナレーション（自動生成 or 手で置く）
  assets/audio/                BGM・効果音（無ければ無音で動く）
  fonts/NotoSansJP.ttf         テロップ用フォント（OFL）
src/
  config.ts        アカウント名・安全領域・色などの定数
  characters/      キャラ（表情・動き）
  backgrounds/     背景
  overlays/        テロップ・カード・名前札・透かしなど
scripts/
  generate-voice.mjs   VOICEVOX で音声を作る
  normalize-voice.mjs  置いてある wav の音量をそろえる
  make-se.mjs          仮の効果音を ffmpeg で作る
  render-stills.mjs    確認用の静止画
  render.mjs           mp4 書き出し
out/                   書き出し先（git 管理外）
```

## はじめに（1回だけ）

```bash
cd tiktok-anime
npm install
```

必要なもの：Node.js 18 以上、ffmpeg（効果音と無線フィルター用）、Docker（VOICEVOX 用）。
Chrome は Remotion が初回に自動でダウンロードします。手元の Chrome を使う場合は `REMOTION_BROWSER=/path/to/chrome` を指定してください。

右下の透かしは `src/config.ts` の `ACCOUNT_NAME` です。今は空（非表示）で、`'@アカウント名'` を入れると表示されます。

## 新しい回を作る手順

### 1. 台本を書く

`episodes/ep01.json` をコピーして `episodes/ep02.json` を作り、中身を書き換えます。

```jsonc
{
  "title": "第2話のタイトル",
  "bgm": { "file": "assets/audio/bgm.mp3", "volume": 0.12 },   // 省略可。ファイルが無ければ無音
  "scenes": [
    {
      "memo": "画面のメモ（動画には出ない）",
      "narration": "ナレーションの文。",
      "reading": "読み上げ用の文。",          // 省略可。漢字の読みを直したいとき（例: 操縦桿 → 操縦かん）
      "voice": "radio",                       // 省略可。voices.json の名前。既定は narrator
      "telop": "【赤くしたい語】は【】で囲む",  // 【】の中が赤（#E53935）、記号は表示されない。\n で改行
      "background": "cockpit",
      "bgProps": { "sky": "night" },
      "camera": { "from": 1.0, "to": 1.08, "focusX": 540, "focusY": 860 },  // 省略可
      "cuts": [{ "at": 2.5, "zoom": 1.7, "focusX": 780, "focusY": 900 }],   // 省略可。at 秒で (focusX, focusY) のアップに切り替え
      "subtitles": true,                      // 省略可。ナレーション字幕（既定で表示）
      "characters": [
        { "id": "takahashi", "x": 780, "y": 1120, "scale": 1.15, "pose": "sit", "seat": "pilot", "yoke": true, "hold": true }
      ],
      "overlays": [
        { "type": "ruleCard", "text": "ルール#1", "at": 0 }
      ],
      "se": [{ "file": "assets/audio/heartbeat.wav", "at": 0.5, "volume": 0.6 }]
    }
  ]
}
```

- 毎日の制作の決まり（カット・字幕・ナレーションの書き方、前編/後編）は `PRODUCTION.md`、進み具合は `SERIES.md`。
- 回の ID（ファイル名）は英小文字・数字・ハイフンだけ（例：`ep02-1`）。
- **シーンの長さは書きません。** 音声の長さ＋0.4秒で自動で決まります（`src/config.ts` の `SCENE_TAIL_SEC`）。
- `at` はすべて「そのシーンが始まってから何秒後か」です。
- 名前札は、その回で初めて出たキャラに自動で出ます（`cast.json` の `tagName` / `tagDesc`）。出したくなければキャラに `"tag": false`、シーンに `"nameTags": false`。
- 新しい人物は `cast.json` に追加します。その回だけの人物なら、台本に `"cast": { "id": {...} }` と書いても追加できます。名前札の要らない乗客などは、`cast.json` に書かずに `"appearance": { "clothes": "#8E6F6A" }` だけ付けて出せます。

### 2. 音声を作る

```bash
npm run voicevox                  # Docker と VOICEVOX Engine を起動
npm run kana -- ep02              # 読み方の確認（おかしければ台本の reading で直す）
npm run voice -- ep02             # 台本が変わったシーンだけ作り直す
npm run voice -- ep02 --force     # 全部作り直す
npm run voice -- ep02 --only 3,5  # 指定シーンだけ
```

`public/audio/ep02/scene01.wav` … と、字幕のタイミング（`scene01.json`）ができます。音量は自動で -14 LUFS 前後（TikTok でよく使われる目安）にそろえます。

**VOICEVOX が使えないとき**：`public/audio/ep02/sceneXX.wav` を手で置けば動きます（番号は01から）。
置いた wav の長さでシーンの長さが決まります。手で置いたファイル（隣に `.txt` が無いもの）は、`npm run voice` でも上書きされません。
音声が無いシーンは、文字数から仮の長さが付きます。
手で置いた wav の音量をそろえたいときは `npm run normalize -- ep02` を実行してください。

### 3. 確認する

```bash
npm run studio                       # ブラウザでプレビュー（ep02 を選ぶ）
npm run still -- ep02 1 4 9@2.5      # シーン1・4、シーン9の2.5秒目を out/stills/ に PNG で
```

### 4. 書き出す

```bash
npm run render -- ep02               # → out/ep02.mp4
```

## 部品の一覧

### 背景（`background`）

| 名前 | 内容 | 主な `bgProps` | キャラの置き方の目安 |
|---|---|---|---|
| `cabin` | 客室・窓側席 | `sky`: day / dusk / night、`ground`: 窓の外を地上に、`flashRed`: 赤い光の点滅 | x 640, y 1330, scale 1.3, `pose: "sit"`, `seat: "cabin"` |
| `cabinAisle` | 通路から見た客室（乗客入り） | `murmur`: 乗客がきょろきょろ | — |
| `cockpit` | コックピット（左右2席・計器） | `sky` | 左席 x 300 / 右席 x 780, y 1120, scale 1.15, `seat: "pilot"`, `yoke: true` |
| `cockpitDoor` | コックピットのドア | — | — |
| `yokeCloseup` | 操縦桿を握る手のアップ | `gripAt`: 握る秒 | — |
| `nightRadio` | 夜の暗転＋無線の波形 | `amp`, `color`, `label` | — |
| `japanMap` | 日本地図・飛行機・空港 | `from`, `to`, `planeAt`(0〜1), `glow`: 光らせる空港, `glowAt`, `divertTo`, `divertAt`, `traffic` | — |
| `runway` | 滑走路・着陸・救急車と消防車 | `sky`, `landAt`, `landing` | — |
| `plain` | 単色 | `from`, `to`（色） | — |
| `black` | 黒 | — | — |

空港コード：HND 羽田 / CTS 新千歳 / HKD 函館 / AOJ 青森 / MSJ 三沢 / AXT 秋田 / HNA 花巻 / SDJ 仙台 / GAJ 山形 / KIJ 新潟 / FKS 福島（`src/backgrounds/JapanMap.tsx` で追加できます）

### キャラ（`characters` の各項目）

| 項目 | 値 |
|---|---|
| `id` | `cast.json` の名前（you / sato / takahashi / misaki） |
| `x`, `y`, `scale` | 位置（腰の位置）と大きさ |
| `pose` | `stand` / `sit` |
| `seat` | `pilot` / `cabin`（座席も一緒に描く） |
| `expression` | `normal` / `surprised`（驚き） / `panic`（焦り） / `closed`（目を閉じる） |
| `look` | `center` / `left` / `right` / `up` / `down`（目線） |
| `action` | `collapse`（`at` 秒から倒れる） / `collapsed`（最初から倒れている） / `reach`（`at` 秒から腕を伸ばす。`reachArm`, `reachAngle`） |
| `hold` | 両手で操縦桿を握る |
| `yoke` | 前に操縦桿を描く。`yokePos` で位置を別に指定できる |
| `item` | `checklist`（チェックリストを持つ） |
| `talking` | 口パク |
| `sweat` | 汗 |
| `blink`, `breathe` | まばたき・呼吸（既定 true。false で止める） |
| `move` | `{ "x", "y", "scale", "at", "duration" }` へ移動（座席を下げる、歩いて入る など） |
| `flip` | 左右反転 |

### 重ね表示（`overlays` の各項目。`at` 秒に出て、`duration` 秒で消える。`duration` が無ければシーンの最後まで）

| `type` | 内容 | 主な項目 |
|---|---|---|
| `ruleCard` | ベージュの板に黒文字、1秒表示→フェードアウト | `text`, `hold`（表示秒、既定1） |
| `infoBox` | 右上の情報札 | `text`（\n で改行） |
| `bubble` | 吹き出し | `text`, `x`, `y`（しっぽの先）, `tail`: down / left / right |
| `bigText` | 大きな文字 | `text`, `y`, `color`, `bg` |
| `centerText` | 黒画面の白文字（1文字ずつ出る） | `text`, `size`, `cps`（1秒に出る文字数） |
| `blackout` | 一瞬の暗転 | `duration` |
| `transponder` | トランスポンダーの数字が変わる | `from`, `to`, `changeAt`, `y` |
| `meals` | 機内食2つ（和食・洋食） | `labels`, `y` |
| `paIcon` | 機内放送アイコン | `text` |
| `zawa` | 「ざわ」の文字 | `color` |

## 音について

- 効果音（心拍・チャイム・無線ノイズ・サイレン）は、`npm run se`（`node scripts/make-se.mjs`）で ffmpeg で作った仮の音です。同じ名前で好きな音に差し替えられます。
- BGM は `public/assets/audio/bgm.mp3` を置くと鳴ります。

## クレジット・ライセンス

- 音声：**VOICEVOX:青山龍星**、**VOICEVOX:玄野武宏**（無線の声）。投稿するときは、説明欄などにこの表記を入れてください（VOICEVOX と各キャラクターの利用規約で必要です）。
- フォント：Noto Sans JP（SIL Open Font License。`public/fonts/OFL.txt`）。
