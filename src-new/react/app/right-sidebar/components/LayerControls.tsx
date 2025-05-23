import React, { useRef } from 'react';
import { t } from 'src/i18n';
import { normalizePath, TFile } from 'obsidian';
import { RightSidebarView, Layer } from '../right-sidebar-obsidian-view';
import { BLEND_MODE_TO_COMPOSITE_OPERATION } from 'src/constants';
import { ADD_ICON_SVG, BUTTON_ICONS, TABLE_ICONS } from 'src/icons';

interface LayerControlsProps {
    view: RightSidebarView;
    layers: Layer[];
    currentLayerIndex: number;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
    view,
    layers,
    currentLayerIndex
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageLayerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const vaultFiles = view.app.vault.getFiles();
        const found = vaultFiles.find(f => f.name === file.name);

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

        view.addImageLayer(tFile);
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
                onChange={handleImageLayerSelect}
            />

            <div className="flex items-center gap-2 mb-2">
                <button
                    className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
                    onClick={() => view.addLayer(t('NEW_LAYER'))}
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
                    onClick={() => view.deleteLayer(currentLayerIndex)}
                    title={t('DELETE_LAYER')}
                    dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
                />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((layers[currentLayerIndex]?.opacity ?? 1) * 100)}
                    onChange={(e) => {
                        const opacity = parseInt(e.target.value, 10) / 100;
                        view.layerOps?.setOpacity(currentLayerIndex, opacity);
                    }}
                    className="flex-1 h-1 bg-modifier-border rounded outline-none"
                />
                <select
                    value={layers[currentLayerIndex]?.blendMode || 'normal'}
                    onChange={(e) => {
                        const mode = e.target.value as keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION;
                        view.layerOps?.setBlendMode(currentLayerIndex, mode);
                    }}
                    className="p-1 border border-modifier-border rounded bg-primary text-xs"
                >
                    {[
                        'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
                        'color dodge', 'color burn', 'hard light', 'soft light',
                        'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
                    ].map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                {layers.map((layer, idx) => (
                    <div
                        key={idx}
                        className={`p-2 bg-primary rounded cursor-pointer flex items-center gap-2 relative select-none touch-none hover:bg-modifier-hover ${idx === currentLayerIndex ? 'ring-2 ring-accent' : ''}`}
                        onClick={() => view.setCurrentLayer(idx)}
                    >
                        <div
                            className={`w-4 h-4 border border-modifier-border rounded relative cursor-pointer ${layer.visible ? 'bg-accent' : 'bg-transparent'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                view.toggleLayerVisibility(idx);
                            }}
                        />
                        <div
                            className="text-text-normal text-sm flex-1"
                            onDoubleClick={() => {
                                const newName = prompt(t('ENTER_LAYER_NAME'), layer.name);
                                if (newName && newName !== layer.name) {
                                    view.renameLayer(idx, newName);
                                }
                            }}
                        >
                            {layer.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 
