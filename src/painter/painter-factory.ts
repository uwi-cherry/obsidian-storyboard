import { App, WorkspaceLeaf } from 'obsidian';
import { BLEND_MODE_TO_COMPOSITE_OPERATION, DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from '../constants';
import { t } from '../i18n';
import { LAYER_SIDEBAR_VIEW_TYPE, LayerOps, RightSidebarView } from '../right-sidebar/right-sidebar-obsidian-view';
import { savePsdFile } from './painter-files';
import { PsdService } from '../services/psd-service';
import { LayerService } from '../services/layer-service';
import { Layer } from './painter-types';
import { PainterView } from './view/painter-obsidian-view';

export function createPainterView(leaf: WorkspaceLeaf): PainterView {
    const view = new PainterView(leaf);
    const psdService = new PsdService();
    const layerService = new LayerService();
    view.setServices({ psd: psdService, layer: layerService });

    // ===== レイヤーサイドバーの初期化・同期 =====================
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

    // === サービスを Sidebar へ注入 =================
    if (sidebarView && typeof (sidebarView as any).setPsdService === 'function') {
        sidebarView.setPsdService(psdService);
    }

    // LayerSidebarView へ操作コールバックを渡す
    const layerOps: LayerOps = {
        addLayer: (name?: string) => view.createNewLayer(name ?? t('NEW_LAYER')),
        deleteLayer: (index: number) => view.deleteLayer(index),
        toggleLayerVisibility: (index: number) => {
            const layer = view.layers.history[view.layers.currentIndex].layers[index];
            if (layer) {
                layer.visible = !layer.visible;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        },
        renameLayer: (index: number, newName: string) => {
            const layer = view.layers.history[view.layers.currentIndex].layers[index];
            if (layer) {
                layer.name = newName;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        },
        setCurrentLayer: (index: number) => {
            view.layers.currentLayerIndex = index;
            view.renderCanvas();
        },
        setOpacity: (index: number, opacity: number) => {
            const layer = view.layers.history[view.layers.currentIndex].layers[index];
            if (layer) {
                layer.opacity = opacity;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        },
        setBlendMode: (index: number, mode) => {
            const layer = view.layers.history[view.layers.currentIndex].layers[index];
            if (layer) {
                layer.blendMode = mode;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        }
    };

    // ビューが開けた場合はレイヤー変更時に同期
    if (sidebarView) {
        const sync = () => {
            const currentState = view.layers.history[view.layers.currentIndex];
            if (!currentState || !currentState.layers) return;

            // === 毎回最新＆確定した SidebarView を取得 ===
            const leaves = app.workspace.getLeavesOfType(LAYER_SIDEBAR_VIEW_TYPE);
            if (leaves.length === 0) return;
            const currentSidebarView = leaves[0].view as RightSidebarView | undefined;
            if (!currentSidebarView || typeof (currentSidebarView as any).syncLayers !== 'function') return;

            currentSidebarView.syncLayers(currentState.layers, view.layers.currentLayerIndex, layerOps);
        };

        // 初期化が終わったあとにも同期されるようイベントリスナで対応
        view.onLayerChanged(sync);

        // SidebarView が完全にロードされる前に同期を呼ぶとエラーになる場合があるため、
        // 初期同期は onLayerChanged からのコールバックに任せる
    }

    // レイヤー変更時に PSD ファイルを自動保存
    view.onLayerChanged(() => {
        if (view.file) {
            savePsdFile(view.app, view.file, view.layers.history[view.layers.currentIndex].layers);
        }
    });
    return view;
}

export function undoActive(app: App) {
    const view = app.workspace.getActiveViewOfType(PainterView);
    if (view) {
        view.undo();
    }
}

export function redoActive(app: App) {
    const view = app.workspace.getActiveViewOfType(PainterView);
    if (view) {
        view.redo();
    }
}

// ==== レイヤー操作のユーティリティ ===========================
function getActivePainterView(app: App): PainterView | null {
    return app.workspace.getActiveViewOfType(PainterView) ?? null;
}

// 保存
export function saveActive(app: App) {
    const view = getActivePainterView(app);
    if (view && view.file) {
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
    // サービスを注入
    const psdService = new PsdService();
    if (typeof (view as any).setPsdService === 'function') {
        view.setPsdService(psdService);
    }
    return view;
}
