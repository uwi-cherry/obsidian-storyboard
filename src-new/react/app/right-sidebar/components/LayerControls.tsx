import React from 'react';
import { useLayerContext } from '../../../context/LayerContext';
import { t } from '../../../../obsidian-i18n';
import { ADD_ICON_SVG, BUTTON_ICONS, TABLE_ICONS } from '../../../../icons';

export default function LayerControls() {
  // LayerContextが利用可能な場合のみ使用
  let layerContext;
  try {
    layerContext = useLayerContext();
  } catch {
    // LayerContextが利用できない場合は何もしない
    return (
      <div className="p-2 border-b border-modifier-border">
        <div className="text-text-muted text-sm">
          レイヤー情報は利用できません
        </div>
      </div>
    );
  }

  const { layers, currentLayerIndex, setLayers, setCurrentLayerIndex } = layerContext;

  const addBlankLayer = () => {
    const newLayer = {
      name: `レイヤー ${layers.length + 1}`,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas: document.createElement('canvas')
    };
    setLayers([...layers, newLayer]);
  };

  const deleteCurrentLayer = () => {
    if (layers.length <= 1) return;
    const newLayers = layers.filter((_, index) => index !== currentLayerIndex);
    setLayers(newLayers);
    if (currentLayerIndex >= newLayers.length) {
      setCurrentLayerIndex(newLayers.length - 1);
    }
  };

  const toggleVisibility = (index: number) => {
    const newLayers = [...layers];
    newLayers[index].visible = !newLayers[index].visible;
    setLayers(newLayers);
  };

  const renameLayer = (index: number) => {
    const newName = prompt(t('ENTER_LAYER_NAME') || 'レイヤー名を入力', layers[index].name);
    if (newName && newName !== layers[index].name) {
      const newLayers = [...layers];
      newLayers[index].name = newName;
      setLayers(newLayers);
    }
  };

  const changeOpacity = (opacity: number) => {
    const newLayers = [...layers];
    newLayers[currentLayerIndex].opacity = opacity / 100;
    setLayers(newLayers);
  };

  const changeBlendMode = (blendMode: string) => {
    const newLayers = [...layers];
    newLayers[currentLayerIndex].blendMode = blendMode;
    setLayers(newLayers);
  };

  if (layers.length === 0) {
    return (
      <div className="p-2 border-b border-modifier-border">
        <div className="text-text-muted text-sm">
          レイヤーがありません
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
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={addBlankLayer}
          title={t('NEW_LAYER') || '新しいレイヤー'}
          dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={deleteCurrentLayer}
          title={t('DELETE_LAYER') || 'レイヤーを削除'}
          dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
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
            onClick={() => setCurrentLayerIndex(idx)}
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