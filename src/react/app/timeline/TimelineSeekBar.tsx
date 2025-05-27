import React from 'react';

interface TimelineSeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  pixelsPerSecond: number;
  width: number;
}

export default function TimelineSeekBar({ 
  currentTime, 
  duration, 
  onSeek, 
  pixelsPerSecond,
  width 
}: TimelineSeekBarProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / pixelsPerSecond;
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) { // 左クリックが押されている間
      handleClick(e);
    }
  };

  // 時間軸の目盛りを生成
  const generateTimeMarks = () => {
    const marks = [];
    const interval = Math.max(5, Math.ceil(duration / 10)); // 最大10個の目盛り
    
    for (let time = 0; time <= duration; time += interval) {
      const x = time * pixelsPerSecond;
      if (x <= width) {
        marks.push(
          <div
            key={time}
            className="absolute top-0 h-full border-l border-modifier-border-hover"
            style={{ left: `${x}px` }}
          >
            <div className="absolute -top-5 -left-4 text-xs text-text-muted">
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </div>
          </div>
        );
      }
    }
    return marks;
  };

  return (
    <div className="timeline-seekbar bg-secondary border border-modifier-border rounded p-2 mb-4">
      <div className="text-sm font-semibold mb-2 text-text-normal">タイムライン</div>
      
      {/* 時間軸 */}
      <div 
        className="relative h-8 bg-primary border border-modifier-border rounded overflow-hidden cursor-pointer select-none"
        style={{ width: `${width}px` }}
        onClick={handleClick}
        onMouseMove={handleDrag}
      >
        {/* 時間目盛り */}
        {generateTimeMarks()}
        
        {/* 現在時間インジケーター */}
        <div 
          className="absolute top-0 w-1 h-full bg-red-500 z-20 pointer-events-none"
          style={{ left: `${currentTime * pixelsPerSecond}px` }}
        >
          {/* プレイヘッド */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
        </div>
        
        {/* 背景グリッド */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: Math.ceil(duration / 1) }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-modifier-border"
              style={{ left: `${i * pixelsPerSecond}px` }}
            />
          ))}
        </div>
      </div>
      
      {/* 時間表示 */}
      <div className="flex justify-between items-center mt-2 text-xs text-text-muted">
        <span>
          現在時間: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
        </span>
        <span>
          総時間: {Math.floor(duration / 60)}:{(duration % 60).toFixed(1).padStart(4, '0')}
        </span>
      </div>
    </div>
  );
} 