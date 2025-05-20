import { FileView, TFile, WorkspaceLeaf, App } from 'obsidian';
import {
	PSD_ICON,
	PSD_VIEW_TYPE,
	MAX_HISTORY_SIZE,
	DEFAULT_COLOR,
	BLEND_MODE_TO_COMPOSITE_OPERATION
} from '../../constants';
import { Layer, PsdData } from '../painter-types';
import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { ActionMenuController } from '../controller/action-menu-controller';
import { SelectionController } from '../controller/selection-controller';
import PainterReactView from './PainterReactView';
import { t } from '../../i18n';
export class PainterView extends FileView {
	isDrawing = false;
	lastX = 0;
	lastY = 0;
	currentColor = DEFAULT_COLOR;
	currentLineWidth = 5;
	currentTool = 'brush';
	psdDataHistory: { layers: Layer[] }[] = [];
	currentIndex = 0;
	maxHistorySize = MAX_HISTORY_SIZE;
	currentLayerIndex = 0;

	// React リファクタリング後、DOM 参照はコンポーネント側で取得する
	public _canvas!: HTMLCanvasElement;

	// レイヤー変更イベント登録用
	private _layerChangeCallbacks: (() => void)[] = [];

	// コントローラーから注入されるレイヤー操作デリゲート
        private _addLayerDelegate?: (view: PainterView, name?: string, imageFile?: TFile) => void;
        private _deleteLayerDelegate?: (view: PainterView, index: number) => void;

        private _selectionController?: SelectionController;

	// フローティングメニュー（クリア・塗りつぶし）用
        public actionMenu!: ActionMenuController;

	// ファイル入出力デリゲート
	private _loadDelegate?: (app: App, file: TFile) => Promise<{ width: number; height: number; layers: Layer[] }>;

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
	private async _loadAndRenderFile(file: TFile) {
		const data = await this.loadPsdFile(this.app, file);
		if (this._canvas) {
			this._canvas.width = data.width;
			this._canvas.height = data.height;
		}

		this.psdDataHistory = [{ layers: data.layers }];
		this.currentIndex = 0;
		this.currentLayerIndex = 0;

		this.renderCanvas();
		this._emitLayerChanged();
	}

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	public saveLayerStateToHistory() {
		// 現在の状態を保存
		const currentState = {
			layers: this.psdDataHistory[this.currentIndex].layers.map(layer => {
				// 新しいキャンバスを作成して現在の状態をコピー
				const newCanvas = document.createElement('canvas');
				newCanvas.width = layer.canvas.width;
				newCanvas.height = layer.canvas.height;
				const ctx = newCanvas.getContext('2d');
				if (!ctx) return layer; // nullチェック

				ctx.drawImage(layer.canvas, 0, 0);

				return {
					...layer,
					canvas: newCanvas
				};
			})
		};

		// 現在のインデックス以降の履歴を削除
		this.psdDataHistory = this.psdDataHistory.slice(0, this.currentIndex + 1);

		// 新しい状態を追加
		this.psdDataHistory.push(currentState);
		this.currentIndex = this.psdDataHistory.length - 1;

		// 履歴サイズの制限
		if (this.psdDataHistory.length > this.maxHistorySize) {
			this.psdDataHistory.shift();
			this.currentIndex--;
		}

		// 状態を更新して保存
		this.renderCanvas();
		this._emitLayerChanged();
	}

	undo() {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			this.renderCanvas();
			this._emitLayerChanged();
		}
	}

	redo() {
		if (this.currentIndex < this.psdDataHistory.length - 1) {
			this.currentIndex++;
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
		if (!this.psdDataHistory || this.psdDataHistory.length === 0) {
			this.psdDataHistory = [{ layers: [] }];
			this.currentIndex = 0;
			this.currentLayerIndex = 0;
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
                this.reactRoot.render(React.createElement(PainterReactView, { view: this }));

		// Canvas がまだ React サイドで生成されていないため
		// ファイル読み込みや初期背景キャンバス作成は
                // PainterReactView 側の useEffect に移譲する。

		// Obsidian のファイルリストからのドラッグ＆ドロップをサポート
		this.setupDragAndDrop();
	}

	private handlePointerDown(e: PointerEvent) {
		const rect = this._canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
			this.isDrawing = true;
			this.lastX = x;
			this.lastY = y;
			const ctx = this.psdDataHistory[this.currentIndex].layers[this.currentLayerIndex].canvas.getContext('2d');
			if (!ctx) return; // nullチェック
			ctx.lineWidth = e.pressure !== 0 ? this.currentLineWidth * e.pressure : this.currentLineWidth;
			this.saveLayerStateToHistory();
                } else if (this.currentTool === 'selection' || this.currentTool === 'lasso') {
                        this.actionMenu.hide();
                        this._selectionController?.onPointerDown(x, y);
                        return;
                }
	}

	private handlePointerMove(e: PointerEvent) {
		const rect = this._canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// 選択ツールの場合はドラッグ状態に関係なく move を伝播
		if (this.currentTool === 'selection' || this.currentTool === 'lasso') {
			this._selectionController?.onPointerMove(x, y);
			return;
		}

		if (!this.isDrawing) return;

		const ctx = this.psdDataHistory[this.currentIndex].layers[this.currentLayerIndex].canvas.getContext('2d');
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
		const currentLayers = this.psdDataHistory[this.currentIndex].layers;
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