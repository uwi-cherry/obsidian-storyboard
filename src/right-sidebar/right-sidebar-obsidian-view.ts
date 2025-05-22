import React from 'react';
import { t } from 'src/i18n';
import { createRoot, Root } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, App, TFile } from 'obsidian';
import { Layer } from '../painter/painter-types';
import { PSD_VIEW_TYPE, BLEND_MODE_TO_COMPOSITE_OPERATION } from '../constants';
import RightSidebarReactView from './RightSidebarReactView';
import { PainterView } from '../painter/view/painter-obsidian-view';
import { LayerAndFileOps } from './right-sidebar-obsidian-view-interface';

export type { Layer };

export const LAYER_SIDEBAR_VIEW_TYPE = 'psd-layer-sidebar';

export class RightSidebarView extends ItemView {
    private layers: Layer[] = [];
    private currentLayerIndex = 0;

    public layerAndFileOps?: LayerAndFileOps;
    public createPsd: (
        app: App,
        imageFile?: TFile,
        layerName?: string,
        isOpen?: boolean,
        targetDir?: string
    ) => Promise<TFile> = async () => {
        throw new Error('createPsd function not implemented');
    };

    // === 画像操作 UI 関連 =====================
    private currentRowIndex: number | null = null;
    private currentImageUrl: string | null = null;
    private currentImagePrompt: string | null = null;

    private reactRoot?: Root;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        // fileOps は Controller 側から注入されるためここでは設定しない
    }

    getViewType(): string {
        return LAYER_SIDEBAR_VIEW_TYPE;
    }

    getDisplayText(): string {
        return t('LAYERS');
    }

    /**
     * 外部からレイヤー配列と選択インデックスを同期する
     */
    public syncLayers(layers: Layer[], currentLayerIndex: number) {
        this.layers = layers;
        this.currentLayerIndex = currentLayerIndex;
        this.updateLayerList();
        this.updateControls();
    }

    public setLayerAndFileOps(ops: LayerAndFileOps) {
        this.layerAndFileOps = ops;
    }

    // レイヤー操作
    private handleAddLayer = (name?: string) => {
        this.layerAndFileOps?.addLayer(name);
    };

    private handleDeleteLayer = (index: number) => {
        this.layerAndFileOps?.deleteLayer(index);
    };

    private handleToggleLayerVisibility = (index: number) => {
        this.layerAndFileOps?.toggleLayerVisibility(index);
    };

    private handleRenameLayer = (index: number, newName: string) => {
        this.layerAndFileOps?.renameLayer(index, newName);
    };

    private handleSetCurrentLayer = (index: number) => {
        this.layerAndFileOps?.setCurrentLayer(index);
    };

    private handleSetOpacity = (index: number, opacity: number) => {
        this.layerAndFileOps?.setOpacity(index, opacity);
    };

    private handleSetBlendMode = (index: number, mode: keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION) => {
        this.layerAndFileOps?.setBlendMode(index, mode);
    };

    public addImageLayer(file: TFile) {
        const leaves = this.app.workspace.getLeavesOfType(PSD_VIEW_TYPE);
        const painterLeaf = leaves.find((l) => l.view instanceof PainterView);
        const painter = painterLeaf?.view as PainterView | undefined;
        if (painter) {
            painter.createNewLayer(file.basename, file);
        }
    }

    async onOpen(): Promise<void> {
        this.contentEl.empty();
        this.contentEl.addClass('psd-layer-sidebar');

        const createPsd = this.createPsd;
        const root = React.createElement(RightSidebarReactView, {
            app: this.app,
            layers: this.layers,
            currentLayerIndex: this.currentLayerIndex,
            currentRowIndex: this.currentRowIndex,
            currentImageUrl: this.currentImageUrl,
            currentImagePrompt: this.currentImagePrompt,
            createPsd,
            layerOps: {
                addLayer: this.handleAddLayer,
                deleteLayer: this.handleDeleteLayer,
                toggleLayerVisibility: this.handleToggleLayerVisibility,
                renameLayer: this.handleRenameLayer,
                setCurrentLayer: this.handleSetCurrentLayer,
                setOpacity: this.handleSetOpacity,
                setBlendMode: this.handleSetBlendMode,
                loadPsdLayers: async (path: string) => {
                    return this.layerAndFileOps?.loadPsdLayers(path) ?? [];
                },
            },
            addImageLayer: this.addImageLayer,
            onLayerChange: (layers: Layer[], currentIndex: number) => {
                this.layers = layers;
                this.currentLayerIndex = currentIndex;
                this.updateLayerList();
                this.updateControls();
            },
            onImageChange: (url: string | null, prompt: string | null) => {
                this.currentImageUrl = url;
                this.currentImagePrompt = prompt;
                this.emitImageUpdate();
            }
        });

        if (!this.reactRoot) {
            this.reactRoot = createRoot(this.contentEl);
        }
        this.reactRoot.render(root);

        window.addEventListener('storyboard-row-selected', this.handleStoryboardRowSelected as EventListener);
    }

    private updateLayerList() {
        const createPsd = this.createPsd;
        const root = React.createElement(RightSidebarReactView, {
            app: this.app,
            layers: this.layers,
            currentLayerIndex: this.currentLayerIndex,
            currentRowIndex: this.currentRowIndex,
            currentImageUrl: this.currentImageUrl,
            currentImagePrompt: this.currentImagePrompt,
            createPsd,
            layerOps: {
                addLayer: this.handleAddLayer,
                deleteLayer: this.handleDeleteLayer,
                toggleLayerVisibility: this.handleToggleLayerVisibility,
                renameLayer: this.handleRenameLayer,
                setCurrentLayer: this.handleSetCurrentLayer,
                setOpacity: this.handleSetOpacity,
                setBlendMode: this.handleSetBlendMode,
                loadPsdLayers: async (path: string) => {
                    return this.layerAndFileOps?.loadPsdLayers(path) ?? [];
                },
            },
            addImageLayer: this.addImageLayer,
            onLayerChange: (layers: Layer[], currentIndex: number) => {
                this.layers = layers;
                this.currentLayerIndex = currentIndex;
                this.updateLayerList();
                this.updateControls();
            },
            onImageChange: (url: string | null, prompt: string | null) => {
                this.currentImageUrl = url;
                this.currentImagePrompt = prompt;
                this.emitImageUpdate();
            }
        });
        if (this.reactRoot) {
            this.reactRoot.render(root);
        }
    }

    private updateControls() {
        this.updateLayerList();
    }

    async onClose() {
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = undefined;
        }
        window.removeEventListener('storyboard-row-selected', this.handleStoryboardRowSelected as EventListener);
    }

    private handleStoryboardRowSelected = async (e: Event) => {
        const custom = e as CustomEvent;
        const { rowIndex, frame } = custom.detail || {};
        if (rowIndex === undefined) return;

        this.currentRowIndex = rowIndex;
        this.currentImageUrl = frame?.imageUrl || '';
        this.currentImagePrompt = frame?.imagePrompt || '';

        const hasPsd = this.currentImageUrl?.endsWith('.psd');
        if (hasPsd && this.currentImageUrl) {
            try {
                let layers: Layer[] | null = null;
                if (this.layerAndFileOps) {
                    layers = await this.layerAndFileOps.loadPsdLayers(this.currentImageUrl);
                }
                if (layers && layers.length > 0) {
                    this.layers = layers;
                    this.currentLayerIndex = 0;
                } else {
                    this.layers = [];
                }
                this.updateLayerList();
                this.updateControls();
            } catch (error) {
                console.error('PSD レイヤー情報の読み込みに失敗しました:', error);
            }
        } else {
            this.layers = [];
            this.updateLayerList();
        }

        this.emitImageUpdate();
    };

    private emitImageUpdate() {
        if (this.currentRowIndex === null) return;
        window.dispatchEvent(
            new CustomEvent('psd-sidebar-update-image', {
                detail: {
                    rowIndex: this.currentRowIndex,
                    imageUrl: this.currentImageUrl,
                    imagePrompt: this.currentImagePrompt,
                },
            })
        );
    }

    private async loadPsdLayers(path: string): Promise<Layer[]> {
        if (!this.layerAndFileOps) {
            throw new Error('Layer and file operations not initialized');
        }
        return this.layerAndFileOps.loadPsdLayers(path);
    }

    /**
     * createPsd 関数を注入
     */
    public setCreatePsd(callback: (
        app: App,
        imageFile?: TFile,
        layerName?: string,
        isOpen?: boolean,
        targetDir?: string
    ) => Promise<TFile>) {
        this.createPsd = callback;
    }
}
