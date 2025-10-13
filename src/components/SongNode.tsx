import React from 'react';
import { Song } from '../data/songs';
import styles from './SongNode.module.css';

// SongNodeコンポーネントのpropsの型定義
interface SongNodeProps {
  song: Song;
  isActiveFilterMatch: boolean; // 新しく追加するプロパティ
}

/**
 * 個々の曲を視覚的に表現するコンポーネント
 * サムネイル画像と曲名を表示し、クリックでYouTubeに遷移する
 * @param {SongNodeProps} props - songオブジェクトを含むprops
 * @returns {React.JSX.Element}
 */
const SongNode: React.FC<SongNodeProps> = ({ song, isActiveFilterMatch }) => {
  // YouTubeサムネイル画像のURLを生成
  const thumbnailUrl = `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${song.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.node} ${isActiveFilterMatch ? styles.activeMatch : ''}`}
      title={song.title}
    >
      <img src={thumbnailUrl} alt={song.title} className={styles.thumbnail} />
      <span className={styles.title}>{song.title}</span>
    </a>
  );
};

export default SongNode;
