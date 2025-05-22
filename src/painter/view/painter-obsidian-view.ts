import { FileView, TFile, WorkspaceLeaf, App } from 'obsidian';
import {
        PSD_ICON,
        PSD_VIEW_TYPE,
        DEFAULT_COLOR,
        BLEND_MODE_TO_COMPOSITE_OPERATION,
        MAX_HISTORY_SIZE
} from '../../constants';
import { Layer, PsdData } from '../painter-types';
import { t } from '../../i18n';
import type { SelectionState } from '../hooks/useSelectionState';
import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { ActionMenuController } from '../controller/action-menu-controller';
import { SelectionController } from '../controller/selection-controller';
import { TransformEditController } from '../controller/transform-edit-controller';
import PainterReactView from './PainterReactView';
import type { LayersState } from '../hooks/useLayers';
export class PainterView extends FileView {
        isDrawing = false;
        lastX = 0;
        lastY = 0;
        isPanning = false;
        panLastX = 0;
        panLastY = 0;
        currentColor = DEFAULT_COLOR;
	currentLineWidth = 5;
        currentTool = 'brush';
        public layers!: LayersState;

        zoom = 100;
        rotation = 0;

        // PainterViewInterface で必要なプロパティ
        psdDataHistory: { layers: Layer[] }[] = [];
        currentIndex = -1;
        currentLayerIndex = 0;

	// React リファクタリング後、DOM 参照はコンポーネント側で取得する
	public _canvas: HTMLCanvasElement | undefined;

	// ポインタイベントハンドラ
	public onPointerDown: ((e: PointerEvent) => void) | null = null;
	public onPointerMove: ((e: PointerEvent) => void) | null = null;
	public onPointerUp: ((e: PointerEvent) => void) | null = null;

	// レイヤー変更イベント登録用
	private _layerChangeCallbacks: (() => void)[] = [];

	// 選択範囲状態
	public _selectionState: SelectionState | null = null;

        // コントローラーから注入されるレイヤー操作デリゲート
        private _addLayerDelegate?: (view: PainterView, name?: string, imageFile?: TFile) => void;
        private _deleteLayerDelegate?: (view: PainterView, index: number) => void;

        public _selectionController?: SelectionController;

        // フローティングメニュー（クリア・塗りつぶし）用
        public actionMenu!: ActionMenuController;

        // 選択範囲編集コントローラー
        public editController?: TransformEditController;

	// ファイル入出力デリゲート
	public _loadDelegate?: (app: App, file: TFile) => Promise<{ width: number; height: number; layers: Layer[] }>;

	// React ルート（レイアウトをマウント）
	private reactRoot?: Root;

  /**
   * SelectionController への public アクセス
   */
	public get selectionController(): SelectionController | undefined {
		return this._selectionController;
	}

	/**
	 * ViewModel からキャンバス要素へアクセスするための公開ゲッター。
	 * 内部実装（_canvas）のカプセル化を保ちつつ読み取り専用で提供する。
	 */
        public get canvasElement(): HTMLCanvasElement | undefined {
                return this._canvas;
        }


        public getCanvasSize(): { width: number; height: number } {
                return { width: this._canvas?.width ?? 0, height: this._canvas?.height ?? 0 };
        }

	public onLayerChanged(cb: () => void) {
		this._layerChangeCallbacks.push(cb);
	}

	private _emitLayerChanged() {
		this._layerChangeCallbacks.forEach(cb => cb());
	}

	/**
	 * コントローラーからファイルの読み書き処理を注入する
	 */
	public setFileOperations(ops: {
		save: (app: App, file: TFile, layers: Layer[]) => Promise<void>; // 型安全に修正
		load: (app: App, file: TFile) => Promise<{ width: number; height: number; layers: Layer[] }>;
	}) {
		this._loadDelegate = ops.load;
	}

	/**
	 * コントローラーからレイヤー操作を注入する
	 */
        public setLayerOperations(ops: {
                add: (view: PainterView, name?: string, imageFile?: TFile) => void;
                delete: (view: PainterView, index: number) => void;
	}) {
		this._addLayerDelegate = ops.add;
		this._deleteLayerDelegate = ops.delete;
	}

	/**
	 * ラッパー: PSD を読み込み
	 */
	private async loadPsdFile(app: App, file: TFile): Promise<PsdData> {
		if (this._loadDelegate) {
			return await this._loadDelegate(app, file);
		}
		return { width: 0, height: 0, layers: [] };
	}

	/**
	 * ファイルからレイヤーを読み込み、ビューの状態を初期化
	 */
	public async _loadAndRenderFile(file: TFile) {
		const data = await this.loadPsdFile(this.app, file);
		if (this._canvas) {
			this._canvas.width = data.width;
			this._canvas.height = data.height;
		}

                this.layers.history = [{ layers: data.layers }];
                this.layers.currentIndex = 0;
                this.layers.currentLayerIndex = 0;

		this.renderCanvas();
		this._emitLayerChanged();
	}

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

        public saveLayerStateToHistory() {
                this.layers.saveHistory();
                this.renderCanvas();
                this._emitLayerChanged();
        }

        undo() {
                if (this.layers.currentIndex > 0) {
                        this.layers.currentIndex--;
                        this.renderCanvas();
                        this._emitLayerChanged();
                }
        }

        redo() {
                if (this.layers.currentIndex < this.layers.history.length - 1) {
                        this.layers.currentIndex++;
                        this.renderCanvas();
                        this._emitLayerChanged();
                }
        }

	getViewType(): string {
		return PSD_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.file?.basename ?? 'PSD View';
	}

	getIcon(): string {
		return PSD_ICON;
	}

	getState(): { file: string | null } {
		return {
			file: this.file?.path ?? null
		};
	}

	async setState(state: { file: string | null }) {
		if (!state.file) return;

		const file = this.app.vault.getAbstractFileByPath(state.file);
		if (!(file instanceof TFile)) return;

		this.file = file;
		await this._loadAndRenderFile(file);

		// 初期レイヤー情報をサイドバーなどのリスナーへ通知
		this._emitLayerChanged();
	}

        async onOpen() {
                // 履歴初期化
                if (!this.layers) {
                        this.layers = {
                                history: [{ layers: [] }],
                                currentIndex: 0,
                                currentLayerIndex: 0,
                                maxHistorySize: MAX_HISTORY_SIZE,
                                saveHistory() {},
                                undo() {},
                                redo() {}
                        } as LayersState;
                } else if (this.layers.history.length === 0) {
                        this.layers.history = [{ layers: [] }];
                        this.layers.currentIndex = 0;
                        this.layers.currentLayerIndex = 0;
                }

		// 既存コンテンツをクリア
		this.contentEl.empty();
		this.contentEl.addClass('psd-view');

		// Undo / Redo アクション（Obsidian ヘッダー）
                const redoBtn = this.addAction('arrow-right', t('REDO'), () => this.redo()) as HTMLElement;
                redoBtn.querySelector('svg')?.remove();
                redoBtn.textContent = t('REDO');

                const undoBtn = this.addAction('arrow-left', t('UNDO'), () => this.undo()) as HTMLElement;
                undoBtn.querySelector('svg')?.remove();
                undoBtn.textContent = t('UNDO');

		// React レイアウトをマウント
		if (!this.reactRoot) {
			this.reactRoot = createRoot(this.contentEl);
		}
                this.reactRoot.render(
                        React.createElement(PainterReactView, {
                                file: this.file ?? null,
                                zoom: this.zoom,
                                rotation: this.rotation,
                                currentTool: this.currentTool,
                                lineWidth: this.currentLineWidth,
                                color: this.currentColor,
                                setZoom: (z) => {
                                        this.zoom = z;
                                },
                                setRotation: (a) => {
                                        this.rotation = a;
                                },
                                setTool: (t) => {
                                        this.currentTool = t;
                                },
                                setLineWidth: (w) => {
                                        this.currentLineWidth = w;
                                },
                                setColor: (c) => {
                                        this.currentColor = c;
                                },
                                onPointerDown: (e) => this.handlePointerDown(e),
                                onPointerMove: (e) => this.handlePointerMove(e),
                                onPointerUp: () => this.handlePointerUp(),
                                setCanvas: (c) => {
                                        this._canvas = c;
                                },
                                setSelectionState: (s) => {
                                        this._selectionState = s;
                                },
                                layers: this.layers,
                                setLayers: (l) => {
                                        this.layers = l;
                                },
                                // コントローラー関連のプロパティは削除
                                renderCanvas: () => this.renderCanvas(),
                                loadAndRenderFile: this._loadAndRenderFile?.bind(this),
                                getCanvasSize: this.getCanvasSize.bind(this),
                                onFill: () => this.onFill(),
                                onClear: () => this.onClear(),
                                onEdit: () => this.onEdit(),
                                onCopy: () => this.onCopy(),
                                onCut: () => this.onCut(),
                                onPaste: () => this.onPaste(),
                                onSelectAll: () => this.onSelectAll(),
                                onDeselect: () => this.onDeselect(),
                        })
                );

		// Canvas がまだ React サイドで生成されていないため
		// ファイル読み込みや初期背景キャンバス作成は
                // PainterReactView 側の useEffect に移譲する。

		// Obsidian のファイルリストからのドラッグ＆ドロップをサポート
		this.setupDragAndDrop();
	}

        private handlePointerDown(e: PointerEvent) {
                if (!this._canvas) return;
                
                const rect = this._canvas.getBoundingClientRect();
                const scale = this.zoom / 100;
                const x = (e.clientX - rect.left) / scale;
                const y = (e.clientY - rect.top) / scale;

		if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
			this.isDrawing = true;
			this.lastX = x;
			this.lastY = y;
                        const ctx = this.layers.history[this.layers.currentIndex].layers[this.layers.currentLayerIndex].canvas.getContext('2d');
			if (!ctx) return; // nullチェック
			ctx.lineWidth = e.pressure !== 0 ? this.currentLineWidth * e.pressure : this.currentLineWidth;
			this.saveLayerStateToHistory();
                } else if (this.currentTool === 'selection' || this.currentTool === 'lasso') {
                        this.actionMenu.hide();
                        this._selectionController?.onPointerDown(x, y);
                        return;
                } else if (this.currentTool === 'hand') {
                        this.isPanning = true;
                        this.panLastX = e.clientX;
                        this.panLastY = e.clientY;
                        this._canvas.style.cursor = 'grabbing';
                        return;
                }
	}

        private handlePointerMove(e: PointerEvent) {
                if (!this._canvas) return;
                
                const rect = this._canvas.getBoundingClientRect();
                const scale = this.zoom / 100;
                const x = (e.clientX - rect.left) / scale;
                const y = (e.clientY - rect.top) / scale;

                // 選択ツールの場合はドラッグ状態に関係なく move を伝播
                if (this.currentTool === 'selection' || this.currentTool === 'lasso') {
                        this._selectionController?.onPointerMove(x, y);
                        return;
                }

                if (this.currentTool === 'hand' && this.isPanning) {
                        const container = this._canvas.parentElement as HTMLElement | null;
                        if (container) {
                                container.scrollLeft -= e.clientX - this.panLastX;
                                container.scrollTop -= e.clientY - this.panLastY;
                        }
                        this.panLastX = e.clientX;
                        this.panLastY = e.clientY;
                        return;
                }

		if (!this.isDrawing) return;

                const ctx = this.layers.history[this.layers.currentIndex].layers[this.layers.currentLayerIndex].canvas.getContext('2d');
		if (!ctx) return; // nullチェック
		ctx.beginPath();
		ctx.moveTo(this.lastX, this.lastY);
		ctx.lineTo(x, y);
		ctx.strokeStyle = this.currentTool === 'eraser' ? 'rgba(0, 0, 0, 1)' : this.currentColor;
		ctx.lineWidth = e.pressure !== 0 ? this.currentLineWidth * e.pressure : this.currentLineWidth;
		ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
		ctx.stroke();
		ctx.globalCompositeOperation = 'source-over';
		this.lastX = x;
		this.lastY = y;
		this.renderCanvas();
	}

        private handlePointerUp() {
                if (this.isDrawing) {
                        this.isDrawing = false;
                }

                if (this.currentTool === 'hand' && this.isPanning) {
                        this.isPanning = false;
                        if (this._canvas) {
                                this._canvas.style.cursor = 'grab';
                        }
                }

                if (this.currentTool === 'selection' || this.currentTool === 'lasso') {
                        const valid = this._selectionController?.onPointerUp() ?? false;
                        if (valid) {
                                const cancel = () => this._selectionController?.cancelSelection();
                                this.actionMenu.showSelection(cancel);
                        } else {
                                this.actionMenu.showGlobal();
                        }
                        return;
                }
        }

	private setupDragAndDrop() {
		this.contentEl.addEventListener('dragenter', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.addClass('drag-over');
		});

		this.contentEl.addEventListener('dragleave', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.removeClass('drag-over');
		});

		this.contentEl.addEventListener('dragover', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.addClass('drag-over');
		});

		this.contentEl.addEventListener('drop', async (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.removeClass('drag-over');

			const items = Array.from(e.dataTransfer?.items || []);
			for (const item of items) {
				if (item.kind === 'string' && item.type === 'text/uri-list') {
					item.getAsString(async (uri) => {
						const match = uri.match(/file=([^&]+)/);
						if (match) {
							const fileName = decodeURIComponent(match[1]);
							const tFile = this.app.vault.getAbstractFileByPath(fileName);

							if (tFile instanceof TFile) {
								const ext = tFile.extension.toLowerCase();
								if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
									// 画像ファイルを新規レイヤーとして追加（PsdController 側で画像読込＆履歴管理を行う）
									this.createNewLayer(tFile.basename, tFile);
								}
							}
						}
					});
				}
			}
		});
	}

        createNewLayer(name = t('NEW_LAYER'), imageFile?: TFile) {
		if (this._addLayerDelegate) {
			// 第3引数はオプショナル
                        (this._addLayerDelegate as (view: PainterView, name?: string, imageFile?: TFile) => void)(this, name, imageFile);
		}
	}

	deleteLayer(index: number) {
		if (this._deleteLayerDelegate) {
			this._deleteLayerDelegate(this, index);
		}
	}

	// ActionMenu 関連のメソッド
	onFill() {
		this.actionMenu?.fillSelection();
	}

	onClear() {
		this.actionMenu?.clearSelection();
	}

	onEdit() {
		this.actionMenu?.edit();
	}

	onCopy() {
		this.actionMenu?.copySelection();
	}

	onCut() {
		this.actionMenu?.cutSelection();
	}

	onPaste() {
		this.actionMenu?.pasteSelection();
	}

	onSelectAll() {
		this.actionMenu?.selectAll();
	}

	onDeselect() {
		this.actionMenu?.deselect();
	}

	renderCanvas() {
		if (!this._canvas) return;
		const ctx = this._canvas.getContext('2d');
		if (!ctx) return; // nullチェック
		ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

		// チェック柄の背景を描画
		const checkSize = 10;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
		ctx.fillStyle = '#e0e0e0';
		for (let y = 0; y < this._canvas.height; y += checkSize * 2) {
			for (let x = 0; x < this._canvas.width; x += checkSize * 2) {
				ctx.fillRect(x + checkSize, y, checkSize, checkSize);
				ctx.fillRect(x, y + checkSize, checkSize, checkSize);
			}
		}

		// 各レイヤーを上から下に向かって描画
                const currentLayers = this.layers.history[this.layers.currentIndex].layers;
		for (let i = currentLayers.length - 1; i >= 0; i--) {
			const layer = currentLayers[i];
			if (layer.visible) {
				ctx.globalAlpha = layer.opacity;
				ctx.globalCompositeOperation = BLEND_MODE_TO_COMPOSITE_OPERATION[layer.blendMode];
				ctx.drawImage(layer.canvas, 0, 0);
				ctx.globalCompositeOperation = 'source-over';
				ctx.globalAlpha = 1;
			}
		}

		// 選択範囲を描画
		this._selectionController?.drawSelection(ctx);

		this._emitLayerChanged();
	}

	async onClose() {
		// React ルートをアンマウント
		this.reactRoot?.unmount();
		this.reactRoot = undefined;

		// ActionMenu の破棄（保険）
		this.actionMenu?.dispose();

		// リサイズイベント解除（旧 onOpen が設定していた場合）
		const handler = (this as { _resizeHandler?: () => void })._resizeHandler;
		if (handler) {
			window.removeEventListener('resize', handler);
		}
	}
}