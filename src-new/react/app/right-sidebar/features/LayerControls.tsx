import React, { useRef } from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { LAYER_ICONS, BUTTON_ICONS } from '../../../../constants/icons';
import { useLayersStore } from '../../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../../obsidian-api/zustand/store/current-layer-index-store';
import { toolRegistry } from '../../../../service-api/core/tool-registry';

export default function LayerControls() {
  const layers = useLayersStore((state) => state.layers);
  const currentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const deleteCurrentLayer = async () => {
    if (layers.length <= 1) return;
    
    try {
      await toolRegistry.executeTool('remove_layer', {
        index: currentLayerIndex
      });
    } catch (error) {
    }
  };

  const selectLayer = async (index: number) => {
    try {
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(index);
    } catch (error) {
    }
  };

  const toggleVisibility = async (index: number) => {
    try {
      await toolRegistry.executeTool('toggle_layer_visibility', {
        index
      });
    } catch (error) {
    }
  };

  const renameLayer = async (index: number) => {
    
    const newName = prompt(t('ENTER_LAYER_NAME'), layers[index].name);
    if (newName && newName !== layers[index].name) {
      try {
        await toolRegistry.executeTool('rename_layer', {
          index,
          name: newName
        });
      } catch (error) {
      }
    }
  };

  const changeOpacity = async (opacity: number) => {
    try {
      await toolRegistry.executeTool('set_layer_opacity', {
        index: currentLayerIndex,
        opacity: opacity / 100
      });
    } catch (error) {
    }
  };

  const changeBlendMode = async (blendMode: string) => {
    try {
      await toolRegistry.executeTool('set_layer_blend_mode', {
        index: currentLayerIndex,
        blendMode
      });
    } catch (error) {
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
                className="text-text-normal text-sm flex-1"
                onDoubleClick={() => renameLayer(idx)}
              >
                {layer.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
