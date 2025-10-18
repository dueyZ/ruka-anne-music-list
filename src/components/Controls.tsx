import React from 'react';
import { Song } from '../data/songs';
import styles from './Controls.module.css';

// BPMソート順の型定義
export type BpmSortOrder = 'none' | 'slow' | 'fast';

interface ControlsProps {
  songs: Song[];
  onFilterChange: (filterType: 'genre' | 'theme' | 'singer' | 'type', value: string | null) => void;
  onSortChange: (order: 'none' | 'asc' | 'desc') => void;
  onBpmSortChange: (order: BpmSortOrder) => void; // BPMソート用のコールバック
  activeSortOrder: 'none' | 'asc' | 'desc';
  activeBpmSortOrder: BpmSortOrder; // アクティブなBPMソート順
  activeFilter: string | null;
  activeThemeFilter: string | null;
  activeSingerFilter: string | null;
  activeTypeFilter: string | null;
  style?: React.CSSProperties;
}

/**
 * フィルタリング操作を行うコントロールパネルコンポーネント
 * @param {ControlsProps} props
 * @returns {React.JSX.Element}
 */
const Controls = React.forwardRef<HTMLDivElement, ControlsProps>(({ songs, onFilterChange, onSortChange, onBpmSortChange, activeSortOrder, activeBpmSortOrder, activeFilter, activeThemeFilter, activeSingerFilter, activeTypeFilter, style }, ref) => {
  // （既存のロジックは変更なし）
  const allTypes = React.useMemo(() => {
    const types = new Set<string>();
    songs.forEach(song => song.type && types.add(song.type));
    return Array.from(types);
  }, [songs]);

  const allGenres = React.useMemo(() => {
    const genres = new Set<string>();
    songs.forEach(song => {
      song.genres.forEach(genre => genres.add(genre));
    });
    return Array.from(genres);
  }, [songs]);

  const allThemes = React.useMemo(() => {
    const themes = new Set<string>();
    songs.forEach(song => themes.add(song.theme));
    return Array.from(themes);
  }, [songs]);

  const allSingers = React.useMemo(() => {
    const singers = new Set<string>();
    songs.forEach(song => singers.add(song.singer));
    return Array.from(singers).filter(s => s !== '');
  }, [songs]);

  return (
    <div className={styles.controlsContainer} ref={ref} style={style}>
      {/* （既存のフィルターグループは変更なし） */}
      <div className={styles.filterGroup}>
        <strong>Singer:</strong>
        <button
          key="all-singers"
          onClick={() => onFilterChange('singer', null)}
          className={`${styles.button} ${activeSingerFilter === null ? styles.active : ''}`}
        >
          すべて
        </button>
        {allSingers.map((singer, index) => (
          <button
            key={`${singer}-${index}`}
            onClick={() => onFilterChange('singer', singer)}
            className={`${styles.button} ${activeSingerFilter === singer ? styles.active : ''}`}
          >
            {singer}
          </button>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <strong>Type:</strong>
        <button
          key="all-types"
          onClick={() => onFilterChange('type', null)}
          className={`${styles.button} ${activeTypeFilter === null ? styles.active : ''}`}
        >
          すべて
        </button>
        {allTypes.map(type => (
          <button
            key={type}
            onClick={() => onFilterChange('type', type)}
            className={`${styles.button} ${activeTypeFilter === type ? styles.active : ''}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <strong>ジャンル:</strong>
        <button
          key="all-genres"
          onClick={() => onFilterChange('genre', null)}
          className={`${styles.button} ${activeFilter === null ? styles.active : ''}`}
        >
          すべて
        </button>
        {allGenres.map(genre => (
          <button
            key={genre}
            onClick={() => onFilterChange('genre', genre)}
            className={`${styles.button} ${activeFilter === genre ? styles.active : ''}`}
          >
            {genre}
          </button>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <strong>テーマ:</strong>
        <button
          key="all-themes"
          onClick={() => onFilterChange('theme', null)}
          className={`${styles.button} ${activeThemeFilter === null ? styles.active : ''}`}
        >
          すべて
        </button>
        {allThemes.map(theme => (
          <button
            key={theme}
            onClick={() => onFilterChange('theme', theme)}
            className={`${styles.button} ${activeThemeFilter === theme ? styles.active : ''}`}
          >
            {theme}
          </button>
        ))}
      </div>

      <div className={styles.filterGroup}>
        <strong>BPM:</strong>
        <button
          onClick={() => onBpmSortChange('none')}
          className={`${styles.button} ${activeBpmSortOrder === 'none' ? styles.active : ''}`}
        >
          なし
        </button>
        <button
          onClick={() => onBpmSortChange('slow')}
          className={`${styles.button} ${activeBpmSortOrder === 'slow' ? styles.active : ''}`}
        >
          Slow
        </button>
        <button
          onClick={() => onBpmSortChange('fast')}
          className={`${styles.button} ${activeBpmSortOrder === 'fast' ? styles.active : ''}`}
        >
          Fast
        </button>
      </div>

      <div className={styles.filterGroup}>
        <strong>リリース日順:</strong>
        <button
          onClick={() => onSortChange('none')}
          className={`${styles.button} ${activeSortOrder === 'none' ? styles.active : ''}`}
        >
          なし
        </button>
        <button
          onClick={() => onSortChange('asc')}
          className={`${styles.button} ${activeSortOrder === 'asc' ? styles.active : ''}`}
        >
          古い順
        </button>
        <button
          onClick={() => onSortChange('desc')}
          className={`${styles.button} ${activeSortOrder === 'desc' ? styles.active : ''}`}
        >
          新しい順
        </button>
      </div>
    </div>
  );
});

export default Controls;
