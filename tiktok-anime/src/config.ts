// 動画全体の定数。
// 右下の透かし。空文字なら表示しない（例: '@your_account'）
export const ACCOUNT_NAME = '';

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// 各シーンの長さ = 音声の長さ + この秒数
export const SCENE_TAIL_SEC = 0.4;

// 音声ファイルが無いときの仮の長さ（文字数 × 秒）
export const FALLBACK_SEC_PER_CHAR = 0.15;
export const FALLBACK_MIN_SEC = 2;

// カメラのゆっくりズーム
export const CAMERA_ZOOM_FROM = 1.0;
export const CAMERA_ZOOM_TO = 1.08;

// TikTok の UI に隠れない範囲（右のボタン列・下のキャプション）
export const SAFE = {
  top: 200,
  left: 60,
  right: 150,
  telopTop: 1180,
  telopBottom: 1460,
};

export const COLORS = {
  accent: '#E53935',
  telop: '#FFFFFF',
  telopStroke: '#111111',
  card: '#E8DCC4',
  cardBorder: '#B9A988',
  ink: '#1E1E1E',
};

export const FONT_FAMILY = 'Noto Sans JP';
