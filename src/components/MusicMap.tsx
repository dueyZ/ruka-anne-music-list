import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Song } from '../data/songs';
import SongNode from './SongNode';
import Controls from './Controls';
import styles from './MusicMap.module.css';

export const MusicMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null); // Controlsコンポーネントの参照
  const titleRef = useRef<HTMLHeadingElement>(null); // h1タグの参照
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // ジャンルフィルター
  const [activeThemeFilter, setActiveThemeFilter] = useState<string | null>(null); // テーマフィルター
  const [activeSingerFilter, setActiveSingerFilter] = useState<string | null>(null); // 歌手フィルター
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null); // タイプフィルター
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [actualControlsHeight, setActualControlsHeight] = useState(0); // Controlsの実際の高さ
  const [actualTitleHeight, setActualTitleHeight] = useState(0); // h1の実際の高さ
  const [songs, setSongs] = useState<Song[]>([]); // CSVから読み込んだ曲データ
  const [loading, setLoading] = useState(true); // データ読み込み中フラグ
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

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
          // 正規表現を使用して、引用符で囲まれたカンマも正しく処理する
          const columns = row.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,]*)),?/g)?.map(field => field.replace(/,$/, '').replace(/^\"|\"$/g, '').replace(/\"\"/g, '\"').trim()) || [];

          const [id, title, releaseDate, genresStr, theme, bpm, videoId, singer, type] = columns;

          // 各フィールドが存在するか確認してからtrim()を適用
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
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize(); // 初期測定
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Controlsとh1の実際の高さを測定
  useLayoutEffect(() => {
    const measureHeights = () => {
      if (controlsRef.current) {
        setActualControlsHeight(controlsRef.current.offsetHeight);
      }
      if (titleRef.current) {
        setActualTitleHeight(titleRef.current.offsetHeight);
      }
    };
    measureHeights(); // 初期測定
    window.addEventListener('resize', measureHeights); // リサイズ時にも再測定
    return () => window.removeEventListener('resize', measureHeights);
  }, []);

  const handleFilterChange = (filterType: 'genre' | 'theme' | 'singer' | 'type', value: string | null) => {
    if (filterType === 'genre') {
      setActiveFilter(value);
    } else if (filterType === 'theme') {
      setActiveThemeFilter(value);
    } else if (filterType === 'singer') {
      setActiveSingerFilter(value);
    } else if (filterType === 'type') {
      setActiveTypeFilter(value);
    } 
  };

  const handleSortChange = (order: 'none' | 'asc' | 'desc') => {
    setSortOrder(order);
  };

  // レンダリングする曲のリストを準備（ソートのみを適用）
  const sortedAllSongs = React.useMemo(() => {
    let allSongs = [...songs]; // CSVから読み込んだsongsを使用
    if (sortOrder === 'asc') {
      allSongs.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
    } else if (sortOrder === 'desc') {
      allSongs.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    }
    return allSongs; // ソートされたすべての曲を返す
  }, [sortOrder, songs]); // songsが更新されたら再計算



  // レンダリングする曲のリストと全体の高さを計算
  const { allRenderedSongs, containerHeight } = React.useMemo(() => {
    let displayedSongs = [...sortedAllSongs];
    if (activeTypeFilter !== null) {
      displayedSongs = displayedSongs.filter(song => song.type === activeTypeFilter);
    }
    if (activeSingerFilter !== null) {
      displayedSongs = displayedSongs.filter(song => song.singer === activeSingerFilter);
    }

    const matchingSongs = displayedSongs.filter(song => {
      const genreMatch = activeFilter === null || song.genres.includes(activeFilter);
      const themeMatch = activeThemeFilter === null || song.theme === activeThemeFilter;
      return genreMatch && themeMatch;
    });

    const nonMatchingSongs = displayedSongs.filter(song => !matchingSongs.includes(song));

    const allSongs = [...matchingSongs, ...nonMatchingSongs];

    // コンテナの高さを計算
    const topOffset = (titleRef.current?.offsetHeight || 0) + (controlsRef.current?.offsetHeight || 0) + 40;
    const { height } = calculateDynamicHeight(matchingSongs.length, nonMatchingSongs.length, topOffset);

    return { allRenderedSongs: allSongs, containerHeight: height };
  }, [sortedAllSongs, activeFilter, activeThemeFilter, activeTypeFilter, activeSingerFilter, titleRef.current, controlsRef.current]);


  return (
    <div 
      className={styles.container}
      ref={containerRef}
      style={{ height: containerSize.height > 0 ? `${containerHeight}px` : '100vh' }} // 動的に高さを設定
    >
      {/* ヘッダー領域 */}
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f0f0f0', zIndex: 20, padding: '1px' }}>
        <h1 ref={titleRef}>曇音ルカリスト</h1>
        <p style={{ textAlign: 'center', margin: '0 20px 20px' }}>
          <a href="http://www.youtube.com/@anneruka9514" target="_blank" rel="noopener noreferrer">曇音ルカ</a>さんの非公式動画リストです<br />
          各動画はカテゴリ別に整理できるようにしていますが、分類は独自判断によるため、必ずしも正確でない場合があります<br />
          不具合などを見つけた際は、<a href="https://x.com/Dewey_g02" target="_blank" rel="noopener noreferrer"><strong>ここ</strong></a>へ
        </p>
        <Controls
          ref={controlsRef}
          songs={songs}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          activeSortOrder={sortOrder}
          activeFilter={activeFilter}
          activeThemeFilter={activeThemeFilter}
          activeSingerFilter={activeSingerFilter}
          activeTypeFilter={activeTypeFilter}
        />
      </div>

      {loading && <div className={styles.loading}>データ読み込み中...</div>}
      {error && <div className={styles.error}>エラー: {error}</div>}

      {containerSize.width > 0 && containerSize.height > 0 && !loading && !error && allRenderedSongs.map(song => {
        const isNowMatching = (activeFilter === null || song.genres.includes(activeFilter)) && (activeThemeFilter === null || song.theme === activeThemeFilter);

        const matchingSongs = allRenderedSongs.filter(s => (activeFilter === null || s.genres.includes(activeFilter)) && (activeThemeFilter === null || s.theme === activeThemeFilter));
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
const calculateDynamicHeight = (matchingCount: number, nonMatchingCount: number, topOffset: number) => {
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