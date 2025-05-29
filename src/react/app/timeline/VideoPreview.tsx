import { useRef, useEffect, useState, useMemo } from 'react';
import type { FC, MouseEvent } from 'react';
import etro from 'etro';
import type { TimelineProject, UsdClip } from '../../../types/usd';
import type {
  StoryboardData,
  StoryboardChapter,
  StoryboardFrame,
} from '../../../types/storyboard';

interface VideoPreviewProps {
  project: TimelineProject | null;
  storyboardData: StoryboardData | null;
  currentTime: number;
  onTimeUpdate?: (time: number) => void;
}

interface SceneInfo {
  startTime: number;
  duration: number;
  speaker: string;
  dialogues: string;
  imageUrl?: string;
}

const VideoPreview: FC<VideoPreviewProps> = ({
  project,
  storyboardData,
  currentTime,
  onTimeUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movieRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Etroムービーの初期化
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 180;

    const movie = new etro.Movie({
      canvas: canvas
    });

    // ムービーのサイズを設定
    movie.width = 320;
    movie.height = 180;

    movieRef.current = movie;

    return () => {
      if (movieRef.current) {
        movieRef.current.stop();
        movieRef.current = null;
      }
    };
  }, []);

  // プロジェクトデータが変更された時にレイヤーを更新
  useEffect(() => {
    if (!movieRef.current || !project || !storyboardData) return;

    const movie = movieRef.current;
    setIsLoading(true);

    // 既存のレイヤーをクリア
    movie.layers.length = 0;

    try {
      // ストーリーボードフレームからレイヤーを作成
      storyboardData.chapters.forEach(chapter => {
        chapter.frames.forEach(frame => {
          if (frame.imageUrl && frame.startTime !== undefined && frame.duration !== undefined) {
            // 画像レイヤーを追加
            const imageLayer = new etro.layer.Image({
              startTime: frame.startTime,
              duration: frame.duration,
              source: frame.imageUrl,
              x: 0,
              y: 0,
              width: 320,
              height: 180
            });
            movie.addLayer(imageLayer);

            // テキストレイヤーを追加（セリフ）
            if (frame.dialogues) {
              const textLayer = new etro.layer.Text({
                startTime: frame.startTime,
                duration: frame.duration,
                text: `${frame.speaker}: ${frame.dialogues}`,
                x: 20,
                y: 300,
                width: 600,
                height: 40,
                font: '16px Arial'
              });
              movie.addLayer(textLayer);
            }
          }
        });
      });

      // プロジェクトのビデオクリップを追加
      project.stage.tracks.forEach(track => {
        track.clips.forEach((clip: UsdClip) => {
          if (clip.assetPath && clip.assetPath.trim()) {
            try {
              // ビデオファイルの場合
              if (clip.assetPath.match(/\.(mp4|webm|ogg)$/i)) {
                const videoElement = document.createElement('video');
                videoElement.src = clip.assetPath;
                videoElement.crossOrigin = 'anonymous';

                const videoLayer = new etro.layer.Video({
                  startTime: clip.startTime,
                  duration: clip.duration,
                  source: videoElement,
                  x: 0,
                  y: 0,
                  width: 640,
                  height: 360
                });
                movie.addLayer(videoLayer);
              }
              // 画像ファイルの場合
              else if (clip.assetPath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                const imageLayer = new etro.layer.Image({
                  startTime: clip.startTime,
                  duration: clip.duration,
                  source: clip.assetPath,
                  x: 0,
                  y: 0,
                  width: 640,
                  height: 360
                });
                movie.addLayer(imageLayer);
              }
            } catch (error) {
              console.warn('レイヤー追加エラー:', error);
            }
          }
        });
      });

      // 総再生時間を計算
      const totalDuration = Math.max(
        ...movie.layers.map((layer: any) => layer.startTime + layer.duration),
        0
      );
      setDuration(totalDuration);

    } catch (error) {
      console.error('プレビュー作成エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project, storyboardData]);

  // 現在時間の更新
  useEffect(() => {
    if (movieRef.current && !isPlaying) {
      movieRef.current.currentTime = currentTime;
      movieRef.current.refresh();
    }
  }, [currentTime, isPlaying]);

  // ストーリーボードのシーン情報を取得
  const scenes = useMemo<SceneInfo[]>(() => {
    if (!storyboardData) return [];

    const sceneLists = storyboardData.chapters.map((chapter: StoryboardChapter) =>
      chapter.frames
        .filter(
          (frame: StoryboardFrame) =>
            frame.startTime !== undefined && frame.duration !== undefined
        )
        .map((frame: StoryboardFrame) => ({
          startTime: frame.startTime!,
          duration: frame.duration!,
          speaker: frame.speaker,
          dialogues: frame.dialogues,
          imageUrl: frame.imageUrl,
        }))
    );

    return sceneLists
      .reduce<SceneInfo[]>((acc, list) => acc.concat(list), [])
      .sort((a, b) => a.startTime - b.startTime);
  }, [storyboardData]);

  // 現在のシーンインデックスを更新
  useEffect(() => {
    const sceneIndex = scenes.findIndex(scene =>
      currentTime >= scene.startTime &&
      currentTime < scene.startTime + scene.duration
    );
    if (sceneIndex !== -1) {
      setCurrentSceneIndex(sceneIndex);
    }
  }, [currentTime, scenes]);

  const handlePreviousScene = () => {
    if (currentSceneIndex > 0) {
      const prevScene = scenes[currentSceneIndex - 1];
      onTimeUpdate?.(prevScene.startTime);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      const nextScene = scenes[currentSceneIndex + 1];
      onTimeUpdate?.(nextScene.startTime);
    }
  };

  const handlePlay = async () => {
    if (!movieRef.current) return;

    try {
      if (isPlaying) {
        movieRef.current.pause();
        setIsPlaying(false);
      } else {
        movieRef.current.currentTime = currentTime;
        await movieRef.current.play();
        setIsPlaying(true);

        // 再生中の時間更新
        const updateTime = () => {
          if (movieRef.current && isPlaying) {
            const time = movieRef.current.currentTime;
            onTimeUpdate?.(time);
            if (time < duration) {
              requestAnimationFrame(updateTime);
            } else {
              setIsPlaying(false);
            }
          }
        };
        requestAnimationFrame(updateTime);
      }
    } catch (error) {
      console.error('再生エラー:', error);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!movieRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    movieRef.current.currentTime = newTime;
    movieRef.current.refresh();
    onTimeUpdate?.(newTime);
  };

  return (
    <div className="video-preview bg-secondary border border-modifier-border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">プレビュー</h3>

      {/* キャンバス */}
      <div className="relative bg-black rounded overflow-hidden">
          {/* シーンナビゲーションボタン */}
          <button
            onClick={handlePreviousScene}
            disabled={currentSceneIndex <= 0}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
            title="前のシーン"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          <button
            onClick={handleNextScene}
            disabled={currentSceneIndex >= scenes.length - 1}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
            title="次のシーン"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>

          <canvas
            ref={canvasRef}
            className="block"
            style={{ width: '800px', height: '450px' }}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white">読み込み中...</div>
            </div>
          )}

          {/* 現在のシーン情報 */}
          {scenes.length > 0 && scenes[currentSceneIndex] && (
            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
              <div className="font-semibold">{scenes[currentSceneIndex].speaker}</div>
              <div className="text-xs opacity-90">{scenes[currentSceneIndex].dialogues}</div>
              <div className="text-xs opacity-70 mt-1">
                シーン {currentSceneIndex + 1} / {scenes.length}
              </div>
            </div>
          )}
        </div>

        {/* コントロール */}
        <div className="mt-4 space-y-2">
          {/* 再生ボタン */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlay}
              disabled={isLoading || !movieRef.current}
              className="px-4 py-2 bg-accent text-on-accent rounded hover:bg-accent-hover disabled:opacity-50"
            >
              {isPlaying ? '一時停止' : '再生'}
            </button>

            <span className="text-sm text-text-muted">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>

          {/* シークバー */}
          <div
            className="w-full h-2 bg-primary border border-modifier-border rounded cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-accent rounded"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
      </div>
    </div>
  );
};

export default VideoPreview;
