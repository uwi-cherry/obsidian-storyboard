import { App, WorkspaceLeaf, TFile } from 'obsidian';
import { PainterView } from '../view/painter-obsidian-view';
import { loadPsdFile, savePsdFile, createPsdFile } from '../painter-files';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../../constants';
import { createLayerFromImage, createPsd, generateThumbnail } from '../painter-files';
import { LAYER_SIDEBAR_VIEW_TYPE, RightSidebarView, LayerOps } from '../../right-sidebar/right-sidebar-obsidian-view';
import { Layer } from '../painter-types';

export function createPainterView(leaf: WorkspaceLeaf): PainterView {
    const view = new PainterView(leaf);
    // ファイル入出力をビューに委譲
    view.setFileOperations({
        save: savePsdFile,
        load: loadPsdFile
    });

    // レイヤー操作デリゲートを注入（imageFile オプショナル引数にも対応）
    view.setLayerOperations({
        add: addLayer,
        delete: deleteLayer
    });

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

    // LayerSidebarView へ操作コールバックを渡す
    const layerOps: LayerOps = {
        addLayer: (name?: string) => view.createNewLayer(name ?? '新規レイヤー'),
        deleteLayer: (index: number) => view.deleteLayer(index),
        toggleLayerVisibility: (index: number) => {
            const layer = view.psdDataHistory[view.currentIndex].layers[index];
            if (layer) {
                layer.visible = !layer.visible;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        },
        renameLayer: (index: number, newName: string) => {
            const layer = view.psdDataHistory[view.currentIndex].layers[index];
            if (layer) {
                layer.name = newName;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        },
        setCurrentLayer: (index: number) => {
            view.currentLayerIndex = index;
            view.renderCanvas();
        },
        setOpacity: (index: number, opacity: number) => {
            const layer = view.psdDataHistory[view.currentIndex].layers[index];
            if (layer) {
                layer.opacity = opacity;
                if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
                    (view as PainterView).saveLayerStateToHistory();
                }
                view.renderCanvas();
            }
        },
        setBlendMode: (index: number, mode) => {
            const layer = view.psdDataHistory[view.currentIndex].layers[index];
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
            const currentState = view.psdDataHistory[view.currentIndex];
            if (!currentState || !currentState.layers) return;

            // === 毎回最新＆確定した SidebarView を取得 ===
            const leaves = app.workspace.getLeavesOfType(LAYER_SIDEBAR_VIEW_TYPE);
            if (leaves.length === 0) return;
            const currentSidebarView = leaves[0].view as RightSidebarView | undefined;
            if (!currentSidebarView || typeof (currentSidebarView as any).syncLayers !== 'function') return;

            currentSidebarView.syncLayers(currentState.layers, view.currentLayerIndex, layerOps);
        };

        // 初期化が終わったあとにも同期されるようイベントリスナで対応
        view.onLayerChanged(sync);

        // SidebarView が完全にロードされる前に同期を呼ぶとエラーになる場合があるため、
        // 初期同期は onLayerChanged からのコールバックに任せる
    }

    // レイヤー変更時に PSD ファイルを自動保存
    view.onLayerChanged(() => {
        if (view.file) {
            savePsdFile(view.app, view.file, view.psdDataHistory[view.currentIndex].layers);
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
        savePsdFile(app, view.file, view.psdDataHistory[view.currentIndex].layers);
    }
}

// ============= レイヤー処理実装 =========================
async function addLayer(view: PainterView, name = '新規レイヤー', imageFile?: TFile) {
    // ベースサイズ
    const baseWidth = view._canvas ? view._canvas.width : DEFAULT_CANVAS_WIDTH;
    const baseHeight = view._canvas ? view._canvas.height : DEFAULT_CANVAS_HEIGHT;

    // レイヤー名の重複を避けて連番を付加
    let layerName = name;
    if (name === '新規レイヤー') {
        let counter = 1;
        while (view.psdDataHistory[view.currentIndex].layers.some(l => l.name === `新規レイヤー ${counter}`)) {
            counter++;
        }
        layerName = `新規レイヤー ${counter}`;
    }

    try {
        const { layer } = await createLayerFromImage(
            view.app,
            {
                type: imageFile ? 'image' : 'transparent',
                imageFile,
                width: baseWidth,
                height: baseHeight,
                name: layerName
            }
        );

        view.psdDataHistory[view.currentIndex].layers.unshift(layer);
        view.currentLayerIndex = 0;
        view.renderCanvas();

        if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
            (view as PainterView).saveLayerStateToHistory();
        }
    } catch (error) {
        console.error('レイヤーの作成に失敗しました:', error);
    }
}

function deleteLayer(view: PainterView, index: number) {
    if (view.psdDataHistory[view.currentIndex].layers.length <= 1) return;
    view.psdDataHistory[view.currentIndex].layers.splice(index, 1);
    if (view.currentLayerIndex >= view.psdDataHistory[view.currentIndex].layers.length) {
        view.currentLayerIndex = view.psdDataHistory[view.currentIndex].layers.length - 1;
    }

    view.renderCanvas();

    if (typeof (view as PainterView).saveLayerStateToHistory === 'function') {
        (view as PainterView).saveLayerStateToHistory();
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
    return view;
} 