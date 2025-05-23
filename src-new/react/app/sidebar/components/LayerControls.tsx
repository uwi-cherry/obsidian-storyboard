import React, { useRef } from 'react';
import { normalizePath, TFile } from 'obsidian';
import { useLayerContext } from '../../../context/LayerContext';
import { toolRegistry } from '../../../../service-api/core/tool-registry';
import { t } from '../../../../obsidian-i18n';
import { ADD_ICON_SVG, BUTTON_ICONS, TABLE_ICONS } from '../../../../icons';

export default function LayerControls() {
  const { view, layers, currentLayerIndex, setLayers, setCurrentLayerIndex } = useLayerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBlankLayer = async () => {
    await toolRegistry.executeTool('add_layer', { view });
  };

  const addImageLayer = async (file: TFile) => {
    await toolRegistry.executeTool('add_layer', { view, name: file.basename, imageFile: file });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const vaultFiles = view.app.vault.getFiles();
    const found = vaultFiles.find((f: TFile) => f.name === file.name);
    let tFile: TFile;
    if (found) {
      tFile = found;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const storyboardDir = view.app.workspace.getActiveFile()?.parent?.path || '';
      const assetsDir = storyboardDir ? normalizePath(`${storyboardDir}/assets`) : 'assets';
      try {
        if (!view.app.vault.getAbstractFileByPath(assetsDir)) {
          await view.app.vault.createFolder(assetsDir);
        }
      } catch (err) {
        console.error('Failed to create assets folder:', err);
      }
      const path = normalizePath(`${assetsDir}/${file.name}`);
      tFile = await view.app.vault.createBinary(path, arrayBuffer);
    }
    await addImageLayer(tFile);
  };

  const deleteCurrentLayer = async () => {
    await toolRegistry.executeTool('delete_layer', { view, index: currentLayerIndex });
  };

  const toggleVisibility = (index: number) => {
    layers[index].visible = !layers[index].visible;
    setLayers([...layers]);
  };

  const renameLayer = (index: number) => {
    const newName = prompt(t('ENTER_LAYER_NAME'), layers[index].name);
    if (newName && newName !== layers[index].name) {
      layers[index].name = newName;
      setLayers([...layers]);
    }
  };

  return (
    <div>
      <div className="text-text-normal text-sm mb-2 pb-1 border-b border-modifier-border">
        {t('LAYERS')}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".psd,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={handleImageSelect}
      />

      <div className="flex items-center gap-2 mb-2">
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={addBlankLayer}
          title={t('NEW_LAYER')}
          dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={() => fileInputRef.current?.click()}
          title={t('IMAGE_LAYER')}
          dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.fileSelect }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={deleteCurrentLayer}
          title={t('DELETE_LAYER')}
          dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((layers[currentLayerIndex]?.opacity ?? 1) * 100)}
          onChange={e => {
            const opacity = parseInt(e.target.value, 10) / 100;
            layers[currentLayerIndex].opacity = opacity;
            setLayers([...layers]);
          }}
          className="flex-1 h-1 bg-modifier-border rounded outline-none"
        />
        <select
          value={layers[currentLayerIndex]?.blendMode || 'normal'}
          onChange={e => {
            layers[currentLayerIndex].blendMode = e.target.value;
            setLayers([...layers]);
          }}
          className="p-1 border border-modifier-border rounded bg-primary text-xs"
        >
          {[
            'normal',
            'multiply',
            'screen',
            'overlay',
            'darken',
            'lighten',
            'color dodge',
            'color burn',
            'hard light',
            'soft light',
            'difference',
            'exclusion',
            'hue',
            'saturation',
            'color',
            'luminosity'
          ].map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
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
