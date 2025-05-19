import React, { useRef } from 'react';
import { normalizePath } from 'obsidian';
import { ImageEditSiderbarView, Layer } from '../right-sidebar-view';
import { BLEND_MODE_TO_COMPOSITE_OPERATION } from 'src/psd-painter/constants';

interface LayerControlsProps {
    view: ImageEditSiderbarView;
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

        let path: string;
        if (found) {
            path = found.path;
        } else {
            const arrayBuffer = await file.arrayBuffer();
            path = normalizePath(file.name);
            const newFile = await view.app.vault.createBinary(path, arrayBuffer);
            path = newFile.path;
        }

        view.addLayer(path);
    };

    return (
        <div>
            <div className="text-[var(--text-normal)] text-sm mb-2 pb-1 border-b border-[var(--background-modifier-border)]">
                レイヤー
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".psd,.png,.jpg,.jpeg,.gif,.webp"
                style={{ display: 'none' }}
                onChange={handleImageLayerSelect}
            />

            <div className="flex gap-1 mb-2">
                <button
                    className="flex-1 p-1 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] text-[var(--text-normal)] rounded cursor-pointer text-xs hover:bg-[var(--background-modifier-hover)]"
                    onClick={() => view.addLayer('新規レイヤー')}
                >
                    新規レイヤー
                </button>
                <button
                    className="flex-1 p-1 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] text-[var(--text-normal)] rounded cursor-pointer text-xs hover:bg-[var(--background-modifier-hover)]"
                    onClick={() => fileInputRef.current?.click()}
                >
                    画像レイヤー
                </button>
                <button
                    className="flex-1 p-1 bg-[var(--background-primary)] border border-[var(--background-modifier-border)] text-[var(--text-normal)] rounded cursor-pointer text-xs hover:bg-[var(--background-modifier-hover)]"
                    onClick={() => view.deleteLayer(currentLayerIndex)}
                >
                    レイヤーを削除
                </button>
            </div>

            <div className="flex items-center gap-2 mb-2 p-1 bg-[var(--background-primary)] rounded">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((layers[currentLayerIndex]?.opacity ?? 1) * 100)}
                    onChange={(e) => {
                        const opacity = parseInt(e.target.value, 10) / 100;
                        view.layerOps?.setOpacity(currentLayerIndex, opacity);
                    }}
                    className="flex-1 h-1 bg-[var(--background-modifier-border)] rounded outline-none"
                />
            </div>

            <div className="flex items-center p-1 mb-2">
                <select
                    value={layers[currentLayerIndex]?.blendMode || 'normal'}
                    onChange={(e) => {
                        const mode = e.target.value as keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION;
                        view.layerOps?.setBlendMode(currentLayerIndex, mode);
                    }}
                    className="flex-1 p-1 border border-[var(--background-modifier-border)] rounded bg-[var(--background-primary)] text-xs"
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
                        className={`p-2 bg-[var(--background-primary)] rounded cursor-pointer flex items-center gap-2 relative select-none touch-none hover:bg-[var(--background-modifier-hover)] ${idx === currentLayerIndex ? 'ring-2 ring-[var(--interactive-accent)]' : ''}`}
                        onClick={() => view.setCurrentLayer(idx)}
                    >
                        <div
                            className={`w-4 h-4 border border-white rounded relative cursor-pointer ${layer.visible ? 'bg-[var(--interactive-accent)]' : 'bg-transparent'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                view.toggleLayerVisibility(idx);
                            }}
                        />
                        <div
                            className="text-[var(--text-normal)] text-sm flex-1"
                            onDoubleClick={() => {
                                const newName = prompt('レイヤー名を入力', layer.name);
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