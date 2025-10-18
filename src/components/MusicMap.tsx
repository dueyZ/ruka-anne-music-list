import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Song } from '../data/songs';
import SongNode from './SongNode';
import Controls, { BpmSortOrder } from './Controls'; // BpmSortOrder をインポート
import styles from './MusicMap.module.css';

export const MusicMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeThemeFilter, setActiveThemeFilter] = useState<string | null>(null);
  const [activeSingerFilter, setActiveSingerFilter] = useState<string | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('desc'); // デフォルトを新しい順に
  const [bpmSortOrder, setBpmSortOrder] = useState<BpmSortOrder>('none'); // BPMソートのstate
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // CSVデータのフェッチとパース
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/songs.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedSongs: Song[] = csvText.split('\n').slice(1).filter(row => row.trim() !== '').map(row => {
          const columns = row.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]*)),?/g)?.map(field => field.replace(/,$/, '').replace(/^\"|\"$/g, '').replace(/\"\"/g, '\"').trim()) || [];
          const [id, title, releaseDate, genresStr, theme, bpm, videoId, singer, type] = columns;
          return {
            id: id ? id.trim() : '',
            title: title ? title.trim() : '',
            releaseDate: releaseDate ? releaseDate.trim() : '',
            genres: genresStr ? genresStr.split(';').map(g => g.trim()) : [],
            theme: theme ? theme.trim() : '',
            bpm: bpm ? parseInt(bpm.trim()) : 0,
            videoId: videoId ? videoId.trim() : '',
            singer: singer ? singer.trim() : '',
            type: type ? type.trim() : '',
          };
        });
        setSongs(parsedSongs);
      } catch (e: any) {
        setError(`Failed to load songs: ${e.message}`);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  // コンテナのサイズを測定
  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleFilterChange = (filterType: 'genre' | 'theme' | 'singer' | 'type', value: string | null) => {
    if (filterType === 'genre') setActiveFilter(value);
    else if (filterType === 'theme') setActiveThemeFilter(value);
    else if (filterType === 'singer') setActiveSingerFilter(value);
    else if (filterType === 'type') setActiveTypeFilter(value);
  };

  // リリース日順ソートのハンドラ
  const handleSortChange = (order: 'none' | 'asc' | 'desc') => {
    setSortOrder(order);
    if (order !== 'none') {
      setBpmSortOrder('none'); // BPMソートをリセット
    }
  };

  // BPMソートのハンドラ
  const handleBpmSortChange = (order: BpmSortOrder) => {
    setBpmSortOrder(order);
    if (order !== 'none') {
      setSortOrder('none'); // リリース日ソートをリセット
    }
  };

  // 曲のフィルタリングとソートを行う
  const { allRenderedSongs, containerHeight } = React.useMemo(() => {
    // 1. Singer と Type でフィルタリング
    let displayedSongs = [...songs];
    if (activeTypeFilter !== null) {
      displayedSongs = displayedSongs.filter(song => song.type === activeTypeFilter);
    }
    if (activeSingerFilter !== null) {
      displayedSongs = displayedSongs.filter(song => song.singer === activeSingerFilter);
    }

    // 2. Genre と Theme に基づいてマッチする曲としない曲に分ける
    let matchingSongs = displayedSongs.filter(song => 
      (activeFilter === null || song.genres.includes(activeFilter)) &&
      (activeThemeFilter === null || song.theme === activeThemeFilter)
    );

    const nonMatchingSongs = displayedSongs.filter(song => !matchingSongs.includes(song));

    // 3. マッチした曲をソートする
    if (bpmSortOrder === 'slow') {
      matchingSongs.sort((a, b) => a.bpm - b.bpm);
    } else if (bpmSortOrder === 'fast') {
      matchingSongs.sort((a, b) => b.bpm - a.bpm);
    } else if (sortOrder === 'asc') {
      matchingSongs.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    } else if (sortOrder === 'desc') {
      matchingSongs.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }

    // 4. マッチしなかった曲もリリース日順でソートしておく（一貫性のため）
    if (sortOrder === 'asc') {
      nonMatchingSongs.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    } else if (sortOrder === 'desc') {
      nonMatchingSongs.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }

    const allSongs = [...matchingSongs, ...nonMatchingSongs];

    const topOffset = (titleRef.current?.offsetHeight || 0) + (controlsRef.current?.offsetHeight || 0) + 40;
    const { height } = calculateDynamicHeight(matchingSongs.length, nonMatchingSongs.length, topOffset);

    return { allRenderedSongs: allSongs, containerHeight: height };
  }, [songs, activeFilter, activeThemeFilter, activeTypeFilter, activeSingerFilter, sortOrder, bpmSortOrder, titleRef, controlsRef]);

  return (
    <div 
      className={styles.container}
      ref={containerRef}
      style={{ height: containerSize.height > 0 ? `${containerHeight}px` : '100vh' }}
    >
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f0f0f0', zIndex: 20, padding: '1px' }}>
        <h1 ref={titleRef} style={{ marginBottom: 0 }}>曇音ルカ 楽曲リスト</h1>
        <p style={{ textAlign: 'center', margin: '5px 20px 20px' }}>
          <a href="http://www.youtube.com/@anneruka9514" target="_blank" rel="noopener noreferrer">曇音ルカ</a>さんに関連するYoutubeの動画を個人的な視点でまとめた非公式リストです<br />
          動画の分類は独自の判断に基づいておりますので、あらかじめご了承ください<br />
          不具合などを見つけた際は、<a href="https://x.com/Dewey_g02" target="_blank" rel="noopener noreferrer"><strong>ここ</strong></a>へ
        </p>
        <Controls
          ref={controlsRef}
          songs={songs}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onBpmSortChange={handleBpmSortChange} // 追加
          activeSortOrder={sortOrder}
          activeBpmSortOrder={bpmSortOrder} // 追加
          activeFilter={activeFilter}
          activeThemeFilter={activeThemeFilter}
          activeSingerFilter={activeSingerFilter}
          activeTypeFilter={activeTypeFilter}
        />
      </div>

      {loading && <div className={styles.loading}>データ読み込み中...</div>}
      {error && <div className={styles.error}>エラー: {error}</div>}

      {containerSize.width > 0 && !loading && !error && allRenderedSongs.map(song => {
        const isNowMatching = 
          (activeFilter === null || song.genres.includes(activeFilter)) && 
          (activeThemeFilter === null || song.theme === activeThemeFilter);

        const matchingSongs = allRenderedSongs.filter(s => 
          (activeFilter === null || s.genres.includes(activeFilter)) && 
          (activeThemeFilter === null || s.theme === activeThemeFilter)
        );
        const nonMatchingSongs = allRenderedSongs.filter(s => !matchingSongs.includes(s));

        const indexInGroup = isNowMatching
          ? matchingSongs.indexOf(song)
          : nonMatchingSongs.indexOf(song);

        const topOffset = (titleRef.current?.offsetHeight || 0) + (controlsRef.current?.offsetHeight || 0) + 40;

        const { x, y } = calculateNodePosition(
          indexInGroup,
          isNowMatching,
          matchingSongs.length,
          nonMatchingSongs.length,
          topOffset,
          containerSize.width
        );

        return (
          <div
            key={song.id}
            className={styles.nodeWrapper}
            style={{
              transform: `translate(${x}px, ${y}px)`,
              zIndex: isNowMatching ? 10 : 1,
            }}
          >
            <SongNode song={song} isActiveFilterMatch={isNowMatching} />
          </div>
        );
      })}
    </div>
  );
};

// （以降の関数 calculateNodePosition, calculateDynamicHeight は変更なし）

/**
 * 曲のノードの位置を計算する
 */
const calculateNodePosition = (
  index: number,
  isMatching: boolean,
  matchingCount: number,
  nonMatchingCount: number,
  topOffset: number,
  containerWidth: number
) => {
  const nodeWidth = 120;
  const nodeHeight = 150;
  const margin = 20;
  const effectiveWidth = nodeWidth + margin;
  const effectiveHeight = nodeHeight + margin;
  const centerX = containerWidth / 2;

  if (isMatching) {
    const availableGridWidth = containerWidth * 0.7;
    const cols = Math.max(1, Math.floor(availableGridWidth / effectiveWidth));
    const total = matchingCount;
    const col = index % cols;
    const row = Math.floor(index / cols);

    const gridWidth = Math.min(total, cols) * effectiveWidth - margin;
    const gridHeight = (Math.ceil(total / cols)) * effectiveHeight - margin;

    const offsetX = (containerWidth - gridWidth) / 2;
    const offsetY = topOffset + 20; // タイトルとコントロール下のマージン

    const x = offsetX + col * effectiveWidth;
    const y = offsetY + row * effectiveHeight;
    
    return { x, y };

  } else {
    // 外側に円形配置
    const radiusX = centerX * 0.9 - (nodeWidth / 2);
    const radiusY = 400; // 楕円のY半径を固定値に
    const total = nonMatchingCount;
    if (total === 0) return { x: -2000, y: -2000 }; // 画面外へ

    const angle = (index / total) * 2 * Math.PI + Math.PI / 2; // 開始点を調整
    
    // グリッドのY座標の中心を求める
    const matchingGridRows = matchingCount > 0 ? Math.ceil(matchingCount / Math.max(1, Math.floor((containerWidth * 0.7) / effectiveWidth))) : 0;
    const matchingGridHeight = matchingGridRows * effectiveHeight;
    const gridCenterY = topOffset + 20 + matchingGridHeight / 2;

    const x = centerX + radiusX * Math.cos(angle) - (nodeWidth / 2);
    const y = gridCenterY + radiusY * Math.sin(angle) - (nodeHeight / 2);
    return { x, y };
  }
};

/**
 * コンテンツ全体の動的な高さを計算する
 */
const calculateDynamicHeight = (
  matchingCount: number,
  nonMatchingCount: number,
  topOffset: number
) => {
  const nodeHeight = 150;
  const margin = 20;
  const effectiveHeight = nodeHeight + margin;
  let totalHeight = topOffset;

  // マッチするアイテムのグリッド高さを計算
  if (matchingCount > 0) {
    const containerWidth = window.innerWidth;
    const availableGridWidth = containerWidth * 0.7;
    const effectiveWidth = 120 + margin;
    const cols = Math.max(1, Math.floor(availableGridWidth / effectiveWidth));
    const rows = Math.ceil(matchingCount / cols);
    totalHeight += rows * effectiveHeight;
  }

  // マッチしないアイテムのための追加の高さを考慮（楕円配置のため）
  if (nonMatchingCount > 0) {
    totalHeight += 500; // 楕円の半径Yの約2倍程度のマージン
  }
  
  // 最小の高さを設定
  return { height: Math.max(totalHeight, window.innerHeight) };
};