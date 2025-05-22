import { App, TFile, WorkspaceLeaf } from 'obsidian';

import { t } from '../i18n';
import { LAYER_SIDEBAR_VIEW_TYPE, LayerOps, RightSidebarView } from '../right-sidebar/right-sidebar-obsidian-view';
import { createPsd, loadPsdFile, savePsdFile, addLayer, deleteLayer } from './painter-files';
import { PainterView } from './view/painter-obsidian-view';
import { Layer } from './painter-types';

// PainterView の拡張型を定義（動的に追加されるプロパティを含む）
interface ExtendedPainterView {
    app: App;
    file?: TFile;
    layers?: {
        history: { layers: Layer[] }[];
        currentIndex: number;
        currentLayerIndex: number;
    };
    createNewLayer?: (name?: string, imageFile?: TFile) => void;
    deleteLayer?: (index: number) => void;
    renderCanvas?: () => void;
    saveLayerStateToHistory?: () => void;
    undo?: () => void;
    redo?: () => void;
}

export function createPainterView(leaf: WorkspaceLeaf): ExtendedPainterView {
    const view = new PainterView(leaf, {
        load: loadPsdFile,
        addLayer: (app: App, file: TFile, name?: string, imageFile?: TFile) => {
            // 実際のファイル操作は個別に処理
            const painterView = app.workspace.getActiveViewOfType(PainterView) as ExtendedPainterView;
            if (painterView) {
                addLayer(painterView as any, name, imageFile);
            }
        },
        deleteLayer: (app: App, file: TFile, index: number) => {
            // 実際のファイル操作は個別に処理
            const painterView = app.workspace.getActiveViewOfType(PainterView) as ExtendedPainterView;
            if (painterView) {
                deleteLayer(painterView as any, index);
            }
        },
    }) as ExtendedPainterView;

    // ===== レイヤーサイドバーの初期化 =====================
    // 右サイドバーにレイヤービューを開く。既に開いている場合は再利用。
    const app = view.app;
    const leaves = app.workspace.getLeavesOfType(LAYER_SIDEBAR_VIEW_TYPE);
    // 既存が複数ある場合は 0 番目を残して残りを閉じる
    for (let i = 1; i < leaves.length; i++) {
        leaves[i].detach();
    }

    let sidebarLeaf = leaves[0] as WorkspaceLeaf | undefined;
    if (!sidebarLeaf) {
        // まず既存の右サイドバーを取得（新規 split しない）
        sidebarLeaf = app.workspace.getRightLeaf(false) as WorkspaceLeaf;
        if (!sidebarLeaf) {
            // 右サイドバーがまったくない場合のみ新規作成
            sidebarLeaf = app.workspace.getRightLeaf(true) as WorkspaceLeaf;
        }
        if (sidebarLeaf) {
            sidebarLeaf.setViewState({ type: LAYER_SIDEBAR_VIEW_TYPE, active: true });
        }
    }

    const sidebarView = sidebarLeaf?.view as RightSidebarView | undefined;

    // === データアクセス用コールバックを Sidebar へ注入 =================
    if (sidebarView && typeof (sidebarView as any).setFileOps === 'function') {
        sidebarView.setFileOps({
            loadPsdLayers: async (path: string) => {
                const fileObj = view.app.vault.getAbstractFileByPath(path);
                if (fileObj instanceof TFile) {
                    const psdData = await loadPsdFile(view.app, fileObj);
                    return psdData.layers ?? [];
                }
                throw new Error('File not found');
            }
        });
    }

    if (sidebarView && typeof (sidebarView as any).setCreatePsd === 'function') {
        sidebarView.setCreatePsd(createPsd);
    }

    // LayerSidebarView へ操作コールバックを渡す
    const layerOps: LayerOps = {
        addLayer: (name?: string) => {
            if (view.createNewLayer) {
                view.createNewLayer(name ?? t('NEW_LAYER'));
                updateSidebar();
            }
        },
        deleteLayer: (index: number) => {
            if (view.deleteLayer) {
                view.deleteLayer(index);
                updateSidebar();
            }
        },
        toggleLayerVisibility: (index: number) => {
            if (view.layers?.history?.[view.layers.currentIndex]?.layers?.[index]) {
                const layer = view.layers.history[view.layers.currentIndex].layers[index];
                layer.visible = !layer.visible;
                if (view.saveLayerStateToHistory) {
                    view.saveLayerStateToHistory();
                }
                if (view.renderCanvas) {
                    view.renderCanvas();
                }
                updateSidebar();
                saveCurrentState();
            }
        },
        renameLayer: (index: number, newName: string) => {
            if (view.layers?.history?.[view.layers.currentIndex]?.layers?.[index]) {
                const layer = view.layers.history[view.layers.currentIndex].layers[index];
                layer.name = newName;
                if (view.saveLayerStateToHistory) {
                    view.saveLayerStateToHistory();
                }
                if (view.renderCanvas) {
                    view.renderCanvas();
                }
                updateSidebar();
                saveCurrentState();
            }
        },
        setCurrentLayer: (index: number) => {
            if (view.layers) {
                view.layers.currentLayerIndex = index;
                if (view.renderCanvas) {
                    view.renderCanvas();
                }
                updateSidebar();
            }
        },
        setOpacity: (index: number, opacity: number) => {
            if (view.layers?.history?.[view.layers.currentIndex]?.layers?.[index]) {
                const layer = view.layers.history[view.layers.currentIndex].layers[index];
                layer.opacity = opacity;
                if (view.saveLayerStateToHistory) {
                    view.saveLayerStateToHistory();
                }
                if (view.renderCanvas) {
                    view.renderCanvas();
                }
                updateSidebar();
                saveCurrentState();
            }
        },
        setBlendMode: (index: number, mode) => {
            if (view.layers?.history?.[view.layers.currentIndex]?.layers?.[index]) {
                const layer = view.layers.history[view.layers.currentIndex].layers[index];
                layer.blendMode = mode;
                if (view.saveLayerStateToHistory) {
                    view.saveLayerStateToHistory();
                }
                if (view.renderCanvas) {
                    view.renderCanvas();
                }
                updateSidebar();
                saveCurrentState();
            }
        }
    };

    // サイドバー更新関数
    function updateSidebar() {
        if (!view.layers?.history?.[view.layers.currentIndex]?.layers) return;

        const leaves = app.workspace.getLeavesOfType(LAYER_SIDEBAR_VIEW_TYPE);
        if (leaves.length === 0) return;
        
        const currentSidebarView = leaves[0].view as RightSidebarView | undefined;
        if (currentSidebarView && typeof (currentSidebarView as any).syncLayers === 'function') {
            const currentState = view.layers.history[view.layers.currentIndex];
            currentSidebarView.syncLayers(currentState.layers, view.layers.currentLayerIndex, layerOps);
        }
    }

    // 自動保存関数
    function saveCurrentState() {
        if (view.file && view.layers?.history?.[view.layers.currentIndex]?.layers) {
            savePsdFile(view.app, view.file, view.layers.history[view.layers.currentIndex].layers);
        }
    }

    // ビューに直接同期関数を設定
    if (view && typeof view === 'object') {
        (view as any)._updateSidebar = updateSidebar;
        (view as any)._saveCurrentState = saveCurrentState;
    }

    return view;
}

export function undoActive(app: App) {
    const view = app.workspace.getActiveViewOfType(PainterView) as ExtendedPainterView;
    if (view && view.undo) {
        view.undo();
    }
}

export function redoActive(app: App) {
    const view = app.workspace.getActiveViewOfType(PainterView) as ExtendedPainterView;
    if (view && view.redo) {
        view.redo();
    }
}

// ==== レイヤー操作のユーティリティ ===========================
function getActivePainterView(app: App): ExtendedPainterView | null {
    return app.workspace.getActiveViewOfType(PainterView) as ExtendedPainterView ?? null;
}

// 保存
export function saveActive(app: App) {
    const view = getActivePainterView(app);
    if (view && view.file && view.layers?.history?.[view.layers.currentIndex]?.layers) {
        savePsdFile(app, view.file, view.layers.history[view.layers.currentIndex].layers);
    }
}

/**
 * Layer サイドバー用の View を生成するファクトリ関数。
 * plugin.registerView から呼び出されることを想定。
 * ここでは必要最低限の生成のみ行い、詳細なコールバック注入は
 * PainterView 生成時（createPainterView 内）で実施する。
 */
export function createLayerSidebar(leaf: WorkspaceLeaf): RightSidebarView {
    const view = new RightSidebarView(leaf);
    // データアクセス用コールバックを Sidebar へ注入
    if (typeof (view as any).setFileOps === 'function') {
        view.setFileOps({
            loadPsdLayers: async (path: string) => {
                const fileObj = view.app.vault.getAbstractFileByPath(path);
                if (fileObj instanceof TFile) {
                    const psdData = await loadPsdFile(view.app, fileObj);
                    return psdData.layers ?? [];
                }
                throw new Error('File not found');
            }
        });
    }
    if (typeof (view as any).setCreatePsd === 'function') {
        view.setCreatePsd(createPsd);
    }
    return view;
}
