import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import type { SimpleMediaClip } from '../../types/usd';

interface TimelineClipProps {
  clip: SimpleMediaClip;
  clipIndex: number;
  trackIndex: number;
  pixelsPerSecond: number;
  isSelected: boolean;
  onClipChange: (trackIdx: number, clipIdx: number, field: 'path' | 'start' | 'duration', value: string) => void;
  onClipMove: (trackIdx: number, clipIdx: number, newStartTime: number) => void;
  onClipResize?: (trackIdx: number, clipIdx: number, newStartTime: number, newDuration: number) => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  isResizing?: boolean;
  resizeEdge?: 'left' | 'right';
}

export default function TimelineClip({
  clip,
  clipIndex,
  trackIndex,
  pixelsPerSecond,
  isSelected,
  onClipChange,
  onClipMove,
  onClipResize
}: TimelineClipProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [displayStartTime, setDisplayStartTime] = useState(clip.startTime || 0);
  const [displayDuration, setDisplayDuration] = useState(clip.duration || 5);
  const clipRef = useRef<HTMLDivElement>(null);
  const initialValuesRef = useRef({ startTime: 0, duration: 0 });
  const isUpdatingRef = useRef(false);

  // 実際のクリップデータが変更された時に表示を更新（ドラッグ中でない場合のみ）
  useEffect(() => {
    if (dragState?.isDragging || isUpdatingRef.current) return;

    setDisplayStartTime(clip.startTime || 0);
    setDisplayDuration(clip.duration || 5);
    initialValuesRef.current = {
      startTime: clip.startTime || 0,
      duration: clip.duration || 5
    };
  }, [clip.startTime || 0, clip.duration || 5, dragState?.isDragging]);

  // グローバルマウスイベントの処理
  useEffect(() => {
    if (!dragState?.isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / pixelsPerSecond;

      if (dragState.isResizing) {
        if (dragState.resizeEdge === 'left') {
          // 左端のリサイズ：開始時間を変更し、長さも変更（位置とサイズの両方を変更）
          const newStartTime = Math.max(0, initialValuesRef.current.startTime + deltaTime);
          const newDuration = Math.max(0.1, initialValuesRef.current.duration - deltaTime);

          setDisplayStartTime(newStartTime);
          setDisplayDuration(newDuration);
        } else if (dragState.resizeEdge === 'right') {
          // 右端のリサイズ：左端を固定
          const newDuration = Math.max(0.1, initialValuesRef.current.duration + deltaTime);
          setDisplayDuration(newDuration);
        }
      } else {
        // 移動：開始時間のみを変更
        const newStartTime = Math.max(0, initialValuesRef.current.startTime + deltaTime);
        setDisplayStartTime(newStartTime);
      }
    };

    const handleGlobalMouseUp = () => {
      if (!dragState) return;

      isUpdatingRef.current = true;

      if (dragState.isResizing) {
        const startTime = displayStartTime;
        const duration = displayDuration;

        if (dragState.resizeEdge === 'left') {
          // 左端リサイズの場合は両方の値を同時に更新
          if (onClipResize) {
            onClipResize(trackIndex, clipIndex, startTime, duration);
            setTimeout(() => {
              isUpdatingRef.current = false;
              initialValuesRef.current = {
                startTime: startTime,
                duration: duration
              };
            }, 50);
          } else {
            // フォールバック：従来の方法
            Promise.resolve().then(() => {
              onClipChange(trackIndex, clipIndex, 'start', startTime.toString());
              onClipChange(trackIndex, clipIndex, 'duration', duration.toString());

              // 更新完了後にフラグをリセット
              setTimeout(() => {
                isUpdatingRef.current = false;
                // 最新の値でinitialValuesRefを更新
                initialValuesRef.current = {
                  startTime: startTime,
                  duration: duration
                };
              }, 50);
            });
          }
        } else {
          onClipChange(trackIndex, clipIndex, 'duration', duration.toString());
          setTimeout(() => {
            isUpdatingRef.current = false;
            initialValuesRef.current = {
              startTime: clip.startTime || 0,
              duration: duration
            };
          }, 50);
        }
      } else {
        onClipMove(trackIndex, clipIndex, displayStartTime);
        setTimeout(() => {
          isUpdatingRef.current = false;
          initialValuesRef.current = {
            startTime: displayStartTime,
            duration: clip.duration || 5
          };
        }, 50);
      }

      setDragState(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, pixelsPerSecond, trackIndex, clipIndex, displayStartTime, displayDuration, onClipChange, onClipMove, clip.startTime || 0, clip.duration || 5]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const clipWidth = rect.width;

    // 端から10px以内なら長さ変更、それ以外は移動
    if (relativeX < 10) {
      initialValuesRef.current = { startTime: clip.startTime || 0, duration: clip.duration || 5 };
      setDragState({
        isDragging: true,
        startX: e.clientX,
        isResizing: true,
        resizeEdge: 'left'
      });
    } else if (relativeX > clipWidth - 10) {
      initialValuesRef.current = { startTime: clip.startTime || 0, duration: clip.duration || 5 };
      setDragState({
        isDragging: true,
        startX: e.clientX,
        isResizing: true,
        resizeEdge: 'right'
      });
    } else {
      initialValuesRef.current = { startTime: clip.startTime || 0, duration: clip.duration || 5 };
      setDragState({
        isDragging: true,
        startX: e.clientX
      });
    }
  };

  const handleLeftHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialValuesRef.current = { startTime: clip.startTime || 0, duration: clip.duration || 5 };
    setDragState({
      isDragging: true,
      startX: e.clientX,
      isResizing: true,
      resizeEdge: 'left'
    });
  };

  const handleRightHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    initialValuesRef.current = { startTime: clip.startTime || 0, duration: clip.duration || 5 };
    setDragState({
      isDragging: true,
      startX: e.clientX,
      isResizing: true,
      resizeEdge: 'right'
    });
  };

  return (
    <div
      ref={clipRef}
      className={`absolute top-0.5 h-7 bg-secondary text-text-normal text-xs flex items-center justify-center border rounded-sm select-none ${
        isSelected || dragState?.isDragging
          ? 'border-accent bg-accent bg-opacity-20 z-20'
          : 'border-modifier-border'
      }`}
      style={{
        left: `${displayStartTime * pixelsPerSecond}px`,
        width: `${displayDuration * pixelsPerSecond}px`,
        cursor: dragState?.isResizing
          ? (dragState.resizeEdge === 'left' ? 'w-resize' : 'e-resize')
          : 'move'
      }}
      onMouseDown={handleMouseDown}
      title={`${clip.assetPath} (${displayStartTime.toFixed(2)}s - ${(displayStartTime + displayDuration).toFixed(2)}s)`}
    >
      <span className="px-1 truncate pointer-events-none">
        {clip.assetPath.split('/').pop() || 'Untitled'}
      </span>

      {/* 左端のリサイズハンドル */}
      <div
        className="absolute left-0 top-0 h-full cursor-w-resize opacity-0 hover:opacity-100 bg-accent z-30"
        style={{ width: '10px' }}
        onMouseDown={handleLeftHandleMouseDown}
      />

      {/* 右端のリサイズハンドル */}
      <div
        className="absolute right-0 top-0 h-full cursor-e-resize opacity-0 hover:opacity-100 bg-accent z-30"
        style={{ width: '10px' }}
        onMouseDown={handleRightHandleMouseDown}
      />
    </div>
  );
}
