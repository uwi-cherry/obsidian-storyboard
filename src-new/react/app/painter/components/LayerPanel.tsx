import React, { useState } from 'react';
import { useLayerContext } from '../../../context/LayerContext';
import { Layer } from '../../../../types/painter-types';

const LayerPanel: React.FC = () => {
  const { 
    layers, 
    currentLayerIndex, 
    setCurrentLayerIndex, 
    addLayer, 
    deleteLayer, 
    updateLayer,
    duplicateLayer,
    mergeDown 
  } = useLayerContext();

  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // レイヤー追加
  const handleAddLayer = () => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = 800;
    newCanvas.height = 600;
    
    const newLayer: Layer = {
      name: `レイヤー ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas: newCanvas
    };
    
    addLayer(newLayer);
  };

  // レイヤー削除
  const handleDeleteLayer = (index: number) => {
    if (layers.length > 1) {
      deleteLayer(index);
    }
  };

  // レイヤー選択
  const handleSelectLayer = (index: number) => {
    setCurrentLayerIndex(index);
  };

  // 表示/非表示切り替え
  const toggleVisibility = (index: number) => {
    updateLayer(index, { visible: !layers[index].visible });
  };

  // 不透明度変更
  const handleOpacityChange = (index: number, opacity: number) => {
    updateLayer(index, { opacity: opacity / 100 });
  };

  // ブレンドモード変更
  const handleBlendModeChange = (index: number, blendMode: string) => {
    updateLayer(index, { blendMode });
  };

  // 名前編集開始
  const startEditName = (index: number) => {
    setEditingLayerIndex(index);
    setEditingName(layers[index].name);
  };

  // 名前編集完了
  const finishEditName = () => {
    if (editingLayerIndex !== null) {
      updateLayer(editingLayerIndex, { name: editingName });
      setEditingLayerIndex(null);
      setEditingName('');
    }
  };

  // 名前編集キャンセル
  const cancelEditName = () => {
    setEditingLayerIndex(null);
    setEditingName('');
  };

  // レイヤー複製
  const handleDuplicateLayer = (index: number) => {
    duplicateLayer(index);
  };

  // レイヤー結合
  const handleMergeDown = (index: number) => {
    if (index > 0) {
      mergeDown(index);
    }
  };

  const blendModes = [
    'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
    'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion'
  ];

  return (
    <div className="w-64 bg-secondary border-l border-modifier-border flex flex-col">
      {/* ヘッダー */}
      <div className="p-2 border-b border-modifier-border flex justify-between items-center">
        <h3 className="text-sm font-medium text-text-normal">レイヤー</h3>
        <div className="flex gap-1">
          <button
            className="w-6 h-6 bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer flex items-center justify-center text-sm"
            onClick={handleAddLayer}
            title="レイヤー追加"
          >
            +
          </button>
          <button
            className="w-6 h-6 bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer flex items-center justify-center text-sm"
            onClick={() => handleDeleteLayer(currentLayerIndex)}
            title="レイヤー削除"
            disabled={layers.length <= 1}
          >
            −
          </button>
        </div>
      </div>

      {/* レイヤーリスト */}
      <div className="flex-1 overflow-y-auto">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const index = layers.length - 1 - reverseIndex;
          const isSelected = index === currentLayerIndex;
          
          return (
            <div
              key={index}
              className={`p-2 border-b border-modifier-border cursor-pointer ${
                isSelected ? 'bg-accent' : 'hover:bg-modifier-hover'
              }`}
              onClick={() => handleSelectLayer(index)}
            >
              {/* レイヤー情報 */}
              <div className="flex items-center gap-2 mb-2">
                {/* 表示/非表示切り替え */}
                <button
                  className="w-4 h-4 border border-modifier-border rounded text-xs flex items-center justify-center bg-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(index);
                  }}
                  title={layer.visible ? '非表示にする' : '表示する'}
                >
                  {layer.visible ? '👁' : '✕'}
                </button>
                
                {/* レイヤー名 */}
                <div className="flex-1">
                  {editingLayerIndex === index ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={finishEditName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishEditName();
                        if (e.key === 'Escape') cancelEditName();
                      }}
                      className="w-full text-xs bg-primary border border-modifier-border rounded px-1"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`text-xs ${isSelected ? 'text-on-accent' : 'text-text-normal'}`}
                      onDoubleClick={() => startEditName(index)}
                    >
                      {layer.name}
                    </span>
                  )}
                </div>
              </div>

              {/* レイヤー設定（選択されたレイヤーのみ表示） */}
              {isSelected && (
                <div className="space-y-2">
                  {/* 不透明度 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-12">不透明度:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(layer.opacity * 100)}
                      onChange={(e) => handleOpacityChange(index, parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-text-muted w-8">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  {/* ブレンドモード */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-12">モード:</span>
                    <select
                      value={layer.blendMode}
                      onChange={(e) => handleBlendModeChange(index, e.target.value)}
                      className="flex-1 text-xs bg-primary border border-modifier-border rounded"
                    >
                      {blendModes.map(mode => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* レイヤー操作ボタン */}
                  <div className="flex gap-1">
                    <button
                      className="flex-1 px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateLayer(index);
                      }}
                      title="複製"
                    >
                      複製
                    </button>
                    <button
                      className="flex-1 px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMergeDown(index);
                      }}
                      disabled={index === 0}
                      title="下のレイヤーと結合"
                    >
                      結合
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel; 