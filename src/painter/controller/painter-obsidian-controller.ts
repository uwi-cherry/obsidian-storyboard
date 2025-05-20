import { App, WorkspaceLeaf, TFile } from 'obsidian';
import { PainterView } from '../view/painter-obsidian-view';
import { loadPsdFile, savePsdFile, createPsdFile } from '../painter-files';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, BLEND_MODE_TO_COMPOSITE_OPERATION } from '../../constants';
import { t } from '../../i18n';
import * as agPsd from 'ag-psd';
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
        addLayer: (name?: string) => view.createNewLayer(name ?? t('NEW_LAYER')),
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

// レイヤー生成タイプの定義
type LayerType = 'image' | 'blank' | 'transparent';

// レイヤー生成の共通処理
async function createLayerFromImage(
    app: App,
    options: {
        type: LayerType;
        imageFile?: TFile;
        width: number;
        height: number;
        name: string;
    }
): Promise<{ canvas: HTMLCanvasElement; layer: Layer }> {
    const { type, imageFile, width, height, name } = options;

    const canvas = document.createElement('canvas');

    // ここでは一旦サイズを設定しない。各タイプの処理内で確定させる。
    let ctx: CanvasRenderingContext2D | null = null;

    switch (type) {
        case 'image': {
            if (!imageFile) throw new Error('画像ファイルが指定されていません');

            // 画像を読み込む
            const imageData = await app.vault.readBinary(imageFile);
            const blob = new Blob([imageData]);
            const imageUrl = URL.createObjectURL(blob);
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            // キャンバスサイズが 0 の場合は画像サイズに合わせる
            const finalWidth = width === 0 ? img.width : width;
            const finalHeight = height === 0 ? img.height : height;
            canvas.width = finalWidth;
            canvas.height = finalHeight;

            ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');

            // 画像を中央に配置
            const x = (finalWidth - img.width) / 2;
            const y = (finalHeight - img.height) / 2;
            ctx.drawImage(img, x, y);
            URL.revokeObjectURL(imageUrl);
            break;
        }
        case 'blank': {
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            break;
        }
        case 'transparent': {
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, width, height);
            break;
        }
    }

    return {
        canvas,
        layer: {
            name,
            visible: true,
            opacity: 1,
            blendMode: 'normal' as keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION,
            canvas
        }
    };
}

export async function createPsd(app: App, imageFile?: TFile, layerName?: string, isOpen = true, targetDir?: string): Promise<TFile> {
    const { layer } = await createLayerFromImage(
        app,
        {
            type: imageFile ? 'image' : 'blank',
            imageFile,
            width: imageFile ? 0 : DEFAULT_CANVAS_WIDTH,
            height: imageFile ? 0 : DEFAULT_CANVAS_HEIGHT,
            name: layerName || (imageFile ? imageFile.basename : t('BACKGROUND_LAYER'))
        }
    );

    // ストーリーボードから呼び出された場合は、指定されたディレクトリ直下にpsdディレクトリを作成
    let psdDir: string | undefined;
    if (targetDir) {
        psdDir = `${targetDir}/psd`;
    }

    const newFile = await createPsdFile(app, [layer], '無題のイラスト', psdDir);
    if (isOpen) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(newFile, { active: true });
    }
    return newFile;
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
async function addLayer(view: PainterView, name = t('NEW_LAYER'), imageFile?: TFile) {
    // ベースサイズ
    const baseWidth = view._canvas ? view._canvas.width : DEFAULT_CANVAS_WIDTH;
    const baseHeight = view._canvas ? view._canvas.height : DEFAULT_CANVAS_HEIGHT;

    // レイヤー名の重複を避けて連番を付加
    let layerName = name;
    if (name === t('NEW_LAYER')) {
        let counter = 1;
        while (view.psdDataHistory[view.currentIndex].layers.some(l => l.name === `${t('NEW_LAYER')} ${counter}`)) {
            counter++;
        }
        layerName = `${t('NEW_LAYER')} ${counter}`;
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

export async function generateThumbnail(app: App, file: TFile): Promise<string | null> {
    try {
        const buffer = await app.vault.readBinary(file);
        const psdData = agPsd.readPsd(buffer);
        
        // サムネイルが存在しない場合は生成
        if (!psdData.imageResources?.thumbnail) {
            // レイヤーを合成してサムネイルを生成
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = psdData.width;
            compositeCanvas.height = psdData.height;
            const ctx = compositeCanvas.getContext('2d');
            if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
            ctx.clearRect(0, 0, psdData.width, psdData.height);

            // レイヤーを下から上に合成（最初のレイヤーが最背面）
            const layers = [...(psdData.children || [])].reverse();
            for (const layer of layers) {
                if (!layer.hidden) {
                    ctx.globalAlpha = layer.opacity ?? 1;
                    const blend = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
                    ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
                    if (layer.canvas) {
                        ctx.drawImage(layer.canvas, 0, 0);
                    }
                }
            }

            // サムネイルサイズに縮小
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailSize = 512;
            const scale = Math.min(thumbnailSize / psdData.width, thumbnailSize / psdData.height);
            thumbnailCanvas.width = psdData.width * scale;
            thumbnailCanvas.height = psdData.height * scale;
            const thumbnailCtx = thumbnailCanvas.getContext('2d');
            if (!thumbnailCtx) throw new Error('2Dコンテキストの取得に失敗しました');
            thumbnailCtx.drawImage(compositeCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

            return thumbnailCanvas.toDataURL('image/jpeg', 0.8);
        } else if (psdData.imageResources.thumbnail instanceof HTMLCanvasElement) {
            return psdData.imageResources.thumbnail.toDataURL('image/jpeg');
        }
        return null;
    } catch (error) {
        console.error('サムネイルの生成に失敗しました:', error);
        return null;
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