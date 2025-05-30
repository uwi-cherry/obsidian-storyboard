import { useState, useRef, useEffect } from 'react';
import type { MouseEvent, DragEvent, ChangeEvent } from 'react';
import type { UsdClip, UsdTrack } from '../../types/usd';
import TimelineClip from './TimelineClip';

interface DraggableTimelineTrackProps {
  track: UsdTrack;
  trackIndex: number;
  currentTime: number;
  pixelsPerSecond: number;
  timelineWidth?: number;
  onClipChange: (trackIdx: number, clipIdx: number, field: 'path' | 'start' | 'duration', value: string) => void;
  onClipMove: (trackIdx: number, clipIdx: number, newStartTime: number) => void;
  onClipResize?: (trackIdx: number, clipIdx: number, newStartTime: number, newDuration: number) => void;
  onAddClip: (trackIdx: number, files: FileList) => void;
  onTimeSeek: (time: number) => void;
  onFileDrop?: (trackIdx: number, files: FileList, dropTime: number) => void;
}



export default function DraggableTimelineTrack({
  track,
  trackIndex,
  currentTime,
  pixelsPerSecond,
  timelineWidth = 600,
  onClipChange,
  onClipMove,
  onClipResize,
  onAddClip,
  onTimeSeek,
  onFileDrop
}: DraggableTimelineTrackProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTrackClick = (e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    onTimeSeek(time);
    setSelectedClipIndex(null);
  };

  // ファイルドロップ処理
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddClip(trackIndex, files);
    }
    e.target.value = '';
  };

    return (
    <div className="flex items-center">
      <span className="text-text-normal flex-shrink-0" style={{ width: '200px' }}>{track.name}</span>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="mr-2 px-2 py-1 text-xs bg-accent text-on-accent rounded hover:bg-accent-hover"
      >
        +
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
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

        {track.clips.map((clip: UsdClip, clipIndex: number) => (
          <TimelineClip
            key={clipIndex}
            clip={clip}
            clipIndex={clipIndex}
            trackIndex={trackIndex}
            pixelsPerSecond={pixelsPerSecond}
            isSelected={selectedClipIndex === clipIndex}
            onClipChange={onClipChange}
            onClipMove={onClipMove}
            onClipResize={onClipResize}
          />
        ))}

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent bg-opacity-10 border-2 border-dashed border-accent">
            <span className="text-accent font-semibold">ファイルをドロップ</span>
          </div>
        )}
      </div>
    </div>
  );
}
