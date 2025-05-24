import React, { useEffect, useState } from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LAYER_ICONS } from '../../../../constants/icons';
import { GLOBAL_VARIABLE_KEYS } from '../../../../constants/constants';
import { toolRegistry } from '../../../../service-api/core/tool-registry';
import { useLayersStore } from '../../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../../obsidian-api/zustand/store/current-layer-index-store';

export default function LayerControls() {
  const layers = useLayersStore(state => state.layers);
  const setLayersStore = useLayersStore(state => state.setLayers);
  const currentLayerIndex = useCurrentLayerIndexStore(state => state.currentLayerIndex);
  const setCurrentLayerIndexStore = useCurrentLayerIndexStore(state => state.setCurrentLayerIndex);


  const addBlankLayer = async () => {
    try {
      const currentLayers = [...layers];
      const newLayer = {
        name: `レイヤー ${currentLayers.length + 1}`,
        visible: true,
        opacity: 1.0,
        blendMode: 'normal'
      };
      currentLayers.push(newLayer);

      setLayersStore(currentLayers);
    } catch (error) {
      console.error('レイヤー追加に失敗しました:', error);
    }
  };

  const deleteCurrentLayer = async () => {
    if (layers.length <= 1) return;
    
    try {
      const currentLayers = [...layers];
      currentLayers.splice(currentLayerIndex, 1);
      
      setLayersStore(currentLayers);

      // 削除後のインデックス調整
      const newIndex = Math.min(currentLayerIndex, currentLayers.length - 1);
      setCurrentLayerIndexStore(newIndex);
    } catch (error) {
      console.error('レイヤー削除に失敗しました:', error);
    }
  };

  const selectLayer = async (index: number) => {
    try {
      setCurrentLayerIndexStore(index);
    } catch (error) {
      console.error('レイヤー選択に失敗しました:', error);
    }
  };

  const toggleVisibility = async (index: number) => {
    try {
      const currentLayers = [...layers];
      if (index < 0 || index >= currentLayers.length) return;

      currentLayers[index] = {
        ...currentLayers[index],
        visible: !currentLayers[index].visible
      };

      setLayersStore(currentLayers);
    } catch (error) {
      console.error('レイヤー表示切り替えに失敗しました:', error);
    }
  };

  const renameLayer = async (index: number) => {
    const newName = prompt(t('ENTER_LAYER_NAME') || 'レイヤー名を入力', layers[index].name);
    if (newName && newName !== layers[index].name) {
      try {
        const currentLayers = [...layers];
        if (index < 0 || index >= currentLayers.length) return;

        currentLayers[index] = {
          ...currentLayers[index],
          name: newName
        };

        setLayersStore(currentLayers);
      } catch (error) {
        console.error('レイヤー名変更に失敗しました:', error);
      }
    }
  };

  const changeOpacity = async (opacity: number) => {
    try {
      const currentLayers = [...layers];
      if (currentLayerIndex < 0 || currentLayerIndex >= currentLayers.length) return;

      currentLayers[currentLayerIndex] = {
        ...currentLayers[currentLayerIndex],
        opacity: opacity / 100
      };

      setLayersStore(currentLayers);
    } catch (error) {
      console.error('不透明度変更に失敗しました:', error);
    }
  };

  const changeBlendMode = async (blendMode: string) => {
    try {
      const currentLayers = [...layers];
      if (currentLayerIndex < 0 || currentLayerIndex >= currentLayers.length) return;

      currentLayers[currentLayerIndex] = {
        ...currentLayers[currentLayerIndex],
        blendMode
      };

      setLayersStore(currentLayers);
    } catch (error) {
      console.error('ブレンドモード変更に失敗しました:', error);
    }
  };

  if (layers.length === 0) {
    return (
      <div className="p-2 border-b border-modifier-border">
        <div className="text-text-muted text-sm">
          レイヤーがありません
        </div>
        <div className="text-text-muted text-xs mt-1">
          デバッグ情報:
          <br />• Layers配列: {JSON.stringify(layers)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 border-b border-modifier-border">
      <div className="text-text-normal text-sm mb-2 pb-1 border-b border-modifier-border">
        {t('LAYERS') || 'レイヤー'}
      </div>

      {/* レイヤー操作ボタン */}
      <div className="flex items-center gap-2 mb-2">
        <button
          className="p-2 w-8 h-8 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={addBlankLayer}
          title={t('NEW_LAYER') || '新しいレイヤー'}
          dangerouslySetInnerHTML={{ __html: LAYER_ICONS.add }}
        />
        <button
          className="p-2 w-8 h-8 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={deleteCurrentLayer}
          title={t('DELETE_LAYER') || 'レイヤーを削除'}
          dangerouslySetInnerHTML={{ __html: LAYER_ICONS.delete }}
        />
      </div>

      {/* 不透明度とブレンドモード */}
      {layers[currentLayerIndex] && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((layers[currentLayerIndex]?.opacity ?? 1) * 100)}
            onChange={e => changeOpacity(parseInt(e.target.value, 10))}
            className="flex-1 h-1 bg-modifier-border rounded outline-none"
          />
          <select
            value={layers[currentLayerIndex]?.blendMode || 'normal'}
            onChange={e => changeBlendMode(e.target.value)}
            className="p-1 border border-modifier-border rounded bg-primary text-xs"
          >
            {[
              'normal',
              'multiply',
              'screen',
              'overlay',
              'darken',
              'lighten',
              'color-dodge',
              'color-burn',
              'hard-light',
              'soft-light',
              'difference',
              'exclusion'
            ].map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>
      )}

      {/* レイヤーリスト */}
      <div className="space-y-1">
        {layers.map((layer, idx) => (
          <div
            key={idx}
            className={`p-2 bg-primary rounded cursor-pointer flex items-center gap-2 relative select-none hover:bg-modifier-hover ${idx === currentLayerIndex ? 'ring-2 ring-accent' : ''}`}
            onClick={() => selectLayer(idx)}
          >
            <div
              className={`w-4 h-4 border border-modifier-border rounded relative cursor-pointer ${layer.visible ? 'bg-accent' : 'bg-transparent'}`}
              onClick={e => {
                e.stopPropagation();
                toggleVisibility(idx);
              }}
            />
            <div
              className="text-text-normal text-sm flex-1"
              onDoubleClick={() => renameLayer(idx)}
            >
              {layer.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 