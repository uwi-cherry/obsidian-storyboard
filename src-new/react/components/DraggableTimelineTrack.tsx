import React, { useState, useRef, useEffect } from 'react';
import type { OtioClip, OtioTrack } from '../../types/otio';

interface DraggableTimelineTrackProps {
  track: OtioTrack;
  trackIndex: number;
  currentTime: number;
  pixelsPerSecond: number;
  timelineWidth?: number;
  onClipChange: (trackIdx: number, clipIdx: number, field: 'path' | 'start' | 'duration', value: string) => void;
  onClipMove: (trackIdx: number, clipIdx: number, newStartTime: number) => void;
  onAddClip: (trackIdx: number) => void;
  onTimeSeek: (time: number) => void;
  onFileDrop?: (trackIdx: number, files: FileList, dropTime: number) => void;
}

interface DragState {
  isDragging: boolean;
  clipIndex: number;
  startX: number;
  startTime: number;
  startDuration: number;
  isResizing?: boolean;
  resizeEdge?: 'left' | 'right';
  currentStartTime?: number;
  currentDuration?: number;
}

export default function DraggableTimelineTrack({
  track,
  trackIndex,
  currentTime,
  pixelsPerSecond,
  timelineWidth = 600,
  onClipChange,
  onClipMove,
  onAddClip,
  onTimeSeek,
  onFileDrop
}: DraggableTimelineTrackProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // グローバルマウスイベントの処理
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragState || !dragState.isDragging) return;
      
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = deltaX / pixelsPerSecond;
      
      if (dragState.isResizing) {
        if (dragState.resizeEdge === 'left') {
          // 左端のリサイズ：右端（終了時間）を固定し、左端（開始時間）を移動
          const fixedEndTime = dragState.startTime + dragState.startDuration;
          const newStartTime = Math.max(0, Math.min(fixedEndTime - 0.1, dragState.startTime + deltaTime));
          const newDuration = fixedEndTime - newStartTime;
          
          setDragState(prev => prev ? {
            ...prev,
            currentStartTime: newStartTime,
            currentDuration: newDuration
          } : null);
        } else if (dragState.resizeEdge === 'right') {
          // 右端のリサイズ：左端（開始時間）を固定し、長さを変更
          const newDuration = Math.max(0.1, dragState.startDuration + deltaTime);
          setDragState(prev => prev ? {
            ...prev,
            currentDuration: newDuration
          } : null);
        }
      } else {
        // 移動：開始時間のみを変更
        const newStartTime = Math.max(0, dragState.startTime + deltaTime);
        setDragState(prev => prev ? {
          ...prev,
          currentStartTime: newStartTime
        } : null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragState && dragState.isDragging) {
        // ドラッグ終了時に実際の値を更新
        if (dragState.isResizing) {
          if (dragState.currentStartTime !== undefined) {
            onClipChange(trackIndex, dragState.clipIndex, 'start', dragState.currentStartTime.toString());
          }
          if (dragState.currentDuration !== undefined) {
            onClipChange(trackIndex, dragState.clipIndex, 'duration', dragState.currentDuration.toString());
          }
        } else {
          if (dragState.currentStartTime !== undefined) {
            onClipMove(trackIndex, dragState.clipIndex, dragState.currentStartTime);
          }
        }
      }
      setDragState(null);
    };

    if (dragState?.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState, pixelsPerSecond, trackIndex, onClipChange, onClipMove]);

  const handleClipMouseDown = (e: React.MouseEvent, clipIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clip = track.children[clipIndex] as OtioClip;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const clipWidth = rect.width;
    
    // 端から10px以内なら長さ変更、それ以外は移動
    if (relativeX < 10) {
      setDragState({
        isDragging: true,
        clipIndex,
        startX: e.clientX,
        startTime: clip.source_range.start_time,
        startDuration: clip.source_range.duration,
        isResizing: true,
        resizeEdge: 'left'
      });
          } else if (relativeX > clipWidth - 10) {
      setDragState({
        isDragging: true,
        clipIndex,
        startX: e.clientX,
        startTime: clip.source_range.start_time,
        startDuration: clip.source_range.duration,
        isResizing: true,
        resizeEdge: 'right'
      });
          } else {
      setDragState({
        isDragging: true,
        clipIndex,
        startX: e.clientX,
        startTime: clip.source_range.start_time,
        startDuration: clip.source_range.duration
      });
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragState?.isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    onTimeSeek(time);
  };

  // ファイルドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!onFileDrop) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dropTime = x / pixelsPerSecond;
    
    if (e.dataTransfer.files.length > 0) {
      onFileDrop(trackIndex, e.dataTransfer.files, dropTime);
    }
  };

  // カーソルスタイルを動的に決定
  const getClipCursor = (clipIndex: number, mouseX: number) => {
    if (dragState?.clipIndex === clipIndex && dragState.isResizing) {
      return dragState.resizeEdge === 'left' ? 'w-resize' : 'e-resize';
    }
    return 'move';
  };

  return (
    <div className="flex items-center">
      <span className="text-text-normal flex-shrink-0" style={{ width: '200px' }}>{track.name}</span>
      <button 
        onClick={() => onAddClip(trackIndex)} 
        className="mr-2 px-2 py-1 text-xs bg-accent text-on-accent rounded hover:bg-accent-hover"
      >
        +
      </button>
      <div 
        ref={trackRef}
        className={`relative h-8 bg-primary border cursor-pointer w-full ${
          isDragOver ? 'border-accent border-dashed border-2' : 'border-modifier-border'
        }`}
        onClick={handleTrackClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div 
          className="absolute top-0 w-0.5 h-full bg-red-500 z-10 pointer-events-none"
          style={{ left: `${currentTime * pixelsPerSecond}px` }}
        />
        
        {track.children.map((clip: OtioClip, clipIndex: number) => {
          // ドラッグ中の場合は一時的な値を使用
          const isDraggingThis = dragState?.clipIndex === clipIndex && dragState?.isDragging;
          const displayStartTime = isDraggingThis && dragState.currentStartTime !== undefined 
            ? dragState.currentStartTime 
            : clip.source_range.start_time;
          const displayDuration = isDraggingThis && dragState.currentDuration !== undefined 
            ? dragState.currentDuration 
            : clip.source_range.duration;
          
          return (
          <div
            key={clipIndex}
            className={`absolute top-0.5 h-7 bg-secondary text-text-normal text-xs flex items-center justify-center border rounded-sm select-none ${
              dragState?.clipIndex === clipIndex 
                ? 'border-accent bg-accent bg-opacity-20 z-20' 
                : 'border-modifier-border'
            }`}
            style={{
              left: `${displayStartTime * pixelsPerSecond}px`,
              width: `${displayDuration * pixelsPerSecond}px`,
              cursor: dragState?.clipIndex === clipIndex && dragState.isResizing 
                ? (dragState.resizeEdge === 'left' ? 'w-resize' : 'e-resize') 
                : 'move'
            }}
            onMouseDown={(e) => handleClipMouseDown(e, clipIndex)}
            title={`${clip.media_reference.target_url} (${clip.source_range.start_time}s - ${clip.source_range.start_time + clip.source_range.duration}s)`}
          >
            <span className="px-1 truncate pointer-events-none">
              {clip.media_reference.target_url.split('/').pop() || 'Untitled'}
            </span>
            
            {/* 左端のリサイズハンドル */}
            <div 
              className="absolute left-0 top-0 h-full cursor-w-resize opacity-0 hover:opacity-100 bg-accent z-30"
              style={{ width: '10px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();

                setDragState({
                  isDragging: true,
                  clipIndex,
                  startX: e.clientX,
                  startTime: clip.source_range.start_time,
                  startDuration: clip.source_range.duration,
                  isResizing: true,
                  resizeEdge: 'left'
                });
              }}
            />
            
            {/* 右端のリサイズハンドル */}
            <div 
              className="absolute right-0 top-0 h-full cursor-e-resize opacity-0 hover:opacity-100 bg-accent z-30"
              style={{ width: '10px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();

                setDragState({
                  isDragging: true,
                  clipIndex,
                  startX: e.clientX,
                  startTime: clip.source_range.start_time,
                  startDuration: clip.source_range.duration,
                  isResizing: true,
                  resizeEdge: 'right'
                });
              }}
            />
          </div>
          );
        })}
        
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent bg-opacity-10 border-2 border-dashed border-accent">
            <span className="text-accent font-semibold">ファイルをドロップ</span>
          </div>
        )}
      </div>
    </div>
  );
} 