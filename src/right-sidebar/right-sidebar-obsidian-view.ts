import React from 'react';
import { t } from 'src/i18n';
import { createRoot, Root } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, App, TFile } from 'obsidian';
import { Layer } from '../painter/painter-types';
import { BLEND_MODE_TO_COMPOSITE_OPERATION, PSD_VIEW_TYPE } from '../constants';
import RightSidebarReactView from './RightSidebarReactView';
import { PainterView } from '../painter/view/painter-obsidian-view';
export type { Layer };

export const LAYER_SIDEBAR_VIEW_TYPE = 'psd-layer-sidebar';

export interface LayerOps {
    addLayer: (name?: string) => void;
    deleteLayer: (index: number) => void;
    toggleLayerVisibility: (index: number) => void;
    renameLayer: (index: number, newName: string) => void;
    setCurrentLayer: (index: number) => void;
    setOpacity: (index: number, opacity: number) => void;
    setBlendMode: (index: number, mode: keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION) => void;
}

// === コールバックインターフェース =====================
export interface FileOpsCallbacks {
    /** PSD ファイルのレイヤー情報を読み込む */
    loadPsdLayers: (path: string) => Promise<Layer[]>;
}

export class RightSidebarView extends ItemView {
    private layers: Layer[] = [];
    private currentLayerIndex = 0;

    public layerOps?: LayerOps;
    public fileOps?: FileOpsCallbacks;
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
    public syncLayers(layers: Layer[], currentLayerIndex: number, ops: LayerOps) {
        this.layerOps = ops;
        this.layers = layers;
        this.currentLayerIndex = currentLayerIndex;
        this.updateLayerList();
        this.updateControls();
    }

    // レイヤー操作
    public addLayer(name = t('NEW_LAYER')) {
        this.layerOps?.addLayer(name);
    }

    /**
     * 画像ファイルからレイヤーを追加
     */
    public addImageLayer(file: TFile) {
        const leaves = this.app.workspace.getLeavesOfType(PSD_VIEW_TYPE);
        const painterLeaf = leaves.find((l) => l.view instanceof PainterView);
        const painter = painterLeaf?.view as PainterView | undefined;
        if (painter) {
            painter.createNewLayer(file.basename, file);
        }
    }

    public deleteLayer(index: number) {
        this.layerOps?.deleteLayer(index);
    }

    public toggleLayerVisibility(index: number) {
        this.layerOps?.toggleLayerVisibility(index);
    }

    public renameLayer(index: number, newName: string) {
        this.layerOps?.renameLayer(index, newName);
    }

    public setCurrentLayer(index: number) {
        this.layerOps?.setCurrentLayer(index);
        this.currentLayerIndex = index;
        this.updateLayerList();
        this.updateControls();
    }

    async onOpen(): Promise<void> {
        this.contentEl.empty();
        this.contentEl.addClass('psd-layer-sidebar');

        const createPsd = this.createPsd;
        const root = React.createElement(RightSidebarReactView, {
            view: this,
            layers: this.layers,
            currentLayerIndex: this.currentLayerIndex,
            currentRowIndex: this.currentRowIndex,
            currentImageUrl: this.currentImageUrl,
            currentImagePrompt: this.currentImagePrompt,
            createPsd,
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
            view: this,
            layers: this.layers,
            currentLayerIndex: this.currentLayerIndex,
            currentRowIndex: this.currentRowIndex,
            currentImageUrl: this.currentImageUrl,
            currentImagePrompt: this.currentImagePrompt,
            createPsd,
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
                if (this.fileOps?.loadPsdLayers) {
                    layers = await this.fileOps.loadPsdLayers(this.currentImageUrl);
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

    /**
     * コントローラーからデータアクセス用のコールバックを注入
     */
    public setFileOps(callbacks: FileOpsCallbacks) {
        this.fileOps = callbacks;
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
