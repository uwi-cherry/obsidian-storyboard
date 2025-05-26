import React, { useRef, useState } from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LAYER_ICONS, BUTTON_ICONS } from '../../../../constants/icons';
import { useLayersStore } from '../../../../zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../../zustand/store/current-layer-index-store';
import { toolRegistry } from '../../../../service-api/core/tool-registry';

export default function LayerControls() {
  const layers = useLayersStore((state) => state.layers);
  const currentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      await toolRegistry.executeTool('add_layer', {
        name: file.name,
        fileData: arrayBuffer
      });
    } catch (error) {
      console.error(error);
    } finally {
      e.target.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const addBlankLayer = async () => {
    try {
      await toolRegistry.executeTool('add_layer', {
        name: `レイヤー ${layers.length + 1}`
      });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCurrentLayer = async () => {
    if (layers.length <= 1) return;
    
    try {
      await toolRegistry.executeTool('remove_layer', {
        index: currentLayerIndex
      });
    } catch (error) {
      console.error(error);
    }
  };

  const selectLayer = async (index: number) => {
    try {
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(index);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleVisibility = async (index: number) => {
    try {
      await toolRegistry.executeTool('toggle_layer_visibility', {
        index
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleClipping = async (index: number) => {
    try {
      const current = layers[index]?.clippingMask ?? false;
      await toolRegistry.executeTool('set_layer_clipping', {
        index,
        clippingMask: !current
      });
    } catch (error) {
      console.error(error);
    }
  };

  const startRenaming = (index: number) => {
    setEditingLayerIndex(index);
    setEditingLayerName(layers[index].name);
  };

  const finishRenaming = async () => {
    if (editingLayerIndex !== null && editingLayerName.trim() && editingLayerName !== layers[editingLayerIndex].name) {
      try {
        await toolRegistry.executeTool('rename_layer', {
          index: editingLayerIndex,
          name: editingLayerName.trim()
        });
      } catch (error) {
        console.error(error);
      }
    }
    setEditingLayerIndex(null);
    setEditingLayerName('');
  };

  const cancelRenaming = () => {
    setEditingLayerIndex(null);
    setEditingLayerName('');
  };

  const changeOpacity = async (opacity: number) => {
    try {
      console.log('changeOpacity: input=', opacity, 'normalized=', opacity / 100);
      await toolRegistry.executeTool('set_layer_opacity', {
        index: currentLayerIndex,
        opacity: opacity / 100
      });
    } catch (error) {
      console.error(error);
    }
  };

  const changeBlendMode = async (blendMode: string) => {
    try {
      await toolRegistry.executeTool('set_layer_blend_mode', {
        index: currentLayerIndex,
        blendMode
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (layers.length === 0) {
    return (
      <div className="p-2 border-b border-modifier-border">
        <div className="text-text-muted text-sm">
          {t('NO_LAYERS')}
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
        {t('LAYERS')}
      </div>

      {layers[currentLayerIndex] && (
        <div className="flex items-center gap-2 mb-2">
          <button
            className="p-2 w-8 h-8 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
            onClick={addBlankLayer}
            title={t('NEW_LAYER')}
            dangerouslySetInnerHTML={{ __html: LAYER_ICONS.add }}
          />
          <button
            className="p-2 w-8 h-8 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
            onClick={openFileDialog}
            title={t('FILE_SELECT')}
            dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.fileSelect }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            className="p-2 w-8 h-8 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
            onClick={deleteCurrentLayer}
            title={t('DELETE_LAYER')}
            dangerouslySetInnerHTML={{ __html: LAYER_ICONS.delete }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.sqrt((layers[currentLayerIndex]?.opacity !== undefined ? layers[currentLayerIndex]?.opacity : 1) * 100) * 10}
            onChange={e => {
              const sliderValue = parseInt(e.target.value, 10);
              const opacity = Math.round((sliderValue / 10) ** 2);
              console.log('LayerControls: sliderValue=', sliderValue, 'opacity=', opacity);
              changeOpacity(opacity);
            }}
            className="flex-1 h-1 bg-modifier-border rounded outline-none"
          />
          <select
            value={layers[currentLayerIndex]?.blendMode || 'normal'}
            onChange={e => changeBlendMode(e.target.value)}
            className="p-1 border border-modifier-border rounded bg-primary text-xs"
          >
            {[
              { key: 'normal', label: t('BLEND_MODE_NORMAL') },
              { key: 'multiply', label: t('BLEND_MODE_MULTIPLY') },
              { key: 'screen', label: t('BLEND_MODE_SCREEN') },
              { key: 'overlay', label: t('BLEND_MODE_OVERLAY') },
              { key: 'darken', label: t('BLEND_MODE_DARKEN') },
              { key: 'lighten', label: t('BLEND_MODE_LIGHTEN') },
              { key: 'color-dodge', label: t('BLEND_MODE_COLOR_DODGE') },
              { key: 'color-burn', label: t('BLEND_MODE_COLOR_BURN') },
              { key: 'hard-light', label: t('BLEND_MODE_HARD_LIGHT') },
              { key: 'soft-light', label: t('BLEND_MODE_SOFT_LIGHT') },
              { key: 'difference', label: t('BLEND_MODE_DIFFERENCE') },
              { key: 'exclusion', label: t('BLEND_MODE_EXCLUSION') }
            ].map(mode => (
              <option key={mode.key} value={mode.key}>{mode.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        {layers.slice().reverse().map((layer, reverseIdx) => {
          const idx = layers.length - 1 - reverseIdx;
          return (
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
                className={`w-4 h-4 border border-modifier-border rounded relative cursor-pointer ${layer.clippingMask ? 'bg-accent' : 'bg-transparent'}`}
                onClick={e => {
                  e.stopPropagation();
                  toggleClipping(idx);
                }}
                title={t('CLIPPING_MASK')}
              >
                <span className="absolute inset-0 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: LAYER_ICONS.clip }} />
              </div>
              <div className="flex-1">
                {editingLayerIndex === idx ? (
                  <input
                    type="text"
                    value={editingLayerName}
                    onChange={(e) => setEditingLayerName(e.target.value)}
                    onBlur={finishRenaming}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        finishRenaming();
                      } else if (e.key === 'Escape') {
                        cancelRenaming();
                      }
                    }}
                    className="text-text-normal text-sm w-full bg-primary border border-modifier-border rounded px-1"
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-text-normal text-sm cursor-pointer"
                    onDoubleClick={() => startRenaming(idx)}
                  >
                    {layer.name}
                  </div>
                )}
                <div className="text-text-muted text-xs mt-1 flex gap-2">
                  <span>不透明度: {Math.round((layer.opacity || 1) * 100)}%</span>
                  <span>
                    {layer.blendMode === 'normal' ? '通常' :
                     layer.blendMode === 'multiply' ? '乗算' :
                     layer.blendMode === 'screen' ? 'スクリーン' :
                     layer.blendMode === 'overlay' ? 'オーバーレイ' :
                     layer.blendMode === 'darken' ? '比較(暗)' :
                     layer.blendMode === 'lighten' ? '比較(明)' :
                     layer.blendMode === 'color-dodge' ? '覆い焼き' :
                     layer.blendMode === 'color-burn' ? '焼き込み' :
                     layer.blendMode === 'hard-light' ? 'ハードライト' :
                     layer.blendMode === 'soft-light' ? 'ソフトライト' :
                     layer.blendMode === 'difference' ? '差の絶対値' :
                     layer.blendMode === 'exclusion' ? '除外' :
                     layer.blendMode || '通常'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
