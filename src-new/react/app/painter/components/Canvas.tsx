import React, { useRef, useEffect } from 'react';

interface CanvasProps {
  layers?: any[];
  currentLayerIndex?: number;
  setLayers?: (layers: any[]) => void;
  view?: any;
}

export default function Canvas({ layers = [], currentLayerIndex = 0, setLayers, view }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // レイヤーを描画
    if (layers && layers.length > 0) {
      layers.forEach((layer: any) => {
        if (layer.visible && layer.imageData) {
          // 実際の描画ロジックはここに実装
        }
      });
    }
  }, [layers, currentLayerIndex]);

  return (
    <div className="flex-1 bg-background overflow-hidden relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-modifier-border"
        style={{ display: 'block', margin: '0 auto' }}
      />
    </div>
  );
}
