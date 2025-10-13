// 曲データの型定義
export interface Song {
  // 曲のID
  id: string;
  // 曲名
  title: string;
  // 発売日
  releaseDate: string;
  // ジャンル（複数指定可能）
  genres: string[];
  // テーマ
  theme: string;
  // BPM
  bpm: number;
  // YouTubeの動画ID
  videoId: string;
  // シンガー名
  singer: string;
  // 曲のタイプ
  type: string;
}
