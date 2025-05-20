import { App, normalizePath, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import {
    PSD_EXTENSION,
    BLEND_MODE_TO_COMPOSITE_OPERATION,
    DEFAULT_CANVAS_WIDTH,
    DEFAULT_CANVAS_HEIGHT
} from '../constants';
import { Layer } from './painter-types';
import { PainterView } from './view/painter-obsidian-view';
import { t } from '../i18n';

interface PsdLayer {
	name: string;
	hidden: boolean;
	opacity: number;
	blendMode: keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION;
	canvas: HTMLCanvasElement;
}

export async function savePsdFile(app: App, file: TFile, layers: Layer[]) {
	if (!file) return;

	const width = layers[0].canvas.width;
	const height = layers[0].canvas.height;
	const compositeCanvas = document.createElement('canvas');
	compositeCanvas.width = width;
	compositeCanvas.height = height;
	const ctx = compositeCanvas.getContext('2d');
	if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
	ctx.clearRect(0, 0, width, height);

	for (const layer of layers) {
		if (layer.visible) {
			ctx.globalAlpha = layer.opacity ?? 1;
			const blend = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
			ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
			ctx.drawImage(layer.canvas, 0, 0);
		}
	}

	const psdData = {
		width,
		height,
		children: layers.map(layer => ({
			name: layer.name,
			canvas: layer.canvas,
			hidden: !layer.visible,
			opacity: layer.opacity,
			blendMode: layer.blendMode,
			left: 0,
			top: 0
		})),
		canvas: compositeCanvas
	};

	const buffer = agPsd.writePsd(psdData, { generateThumbnail: false });
	await app.vault.modifyBinary(file, buffer);
}

export async function loadPsdFile(app: App, file: TFile) {
	const buffer = await app.vault.readBinary(file);
	const psdData = agPsd.readPsd(buffer);

	// レイヤー情報を復元
	const layers: Layer[] = (psdData.children || []).map((layer: PsdLayer) => ({
		name: layer.name,
		visible: !layer.hidden,
		opacity: layer.opacity,
		blendMode: layer.blendMode,
		canvas: layer.canvas
	}));

	return {
		width: psdData.width,
		height: psdData.height,
		layers: layers
	};
}

export async function createPsdFile(
	app: App,
	layers: Layer[],
        baseFileName = t('UNTITLED_ILLUSTRATION'),
	targetDir?: string
): Promise<TFile> {
	let fileName = baseFileName;
	let fileNumber = 1;

	// 保存先ディレクトリが指定されている場合は、そのディレクトリが存在するか確認し、なければ作成する
	if (targetDir) {
		try {
			// ディレクトリが存在するか確認
			const dirExists = await app.vault.adapter.exists(targetDir);
			if (!dirExists) {
				// ディレクトリが存在しない場合は作成
				await app.vault.createFolder(targetDir);
			}
		} catch (e) {
			console.error('ディレクトリの作成に失敗しました:', e);
			// エラーが発生した場合は、デフォルトの場所に保存する
			targetDir = '';
		}
	}

	// ファイルパスを組み立てる
	const getFullPath = (name: string) => {
		const fileNameWithExt = `${name}.${PSD_EXTENSION}`;
		return targetDir 
			? normalizePath(`${targetDir}/${fileNameWithExt}`) 
			: normalizePath(fileNameWithExt);
	};

	let fullPath = getFullPath(fileName);

	// ファイル名が重複する場合は連番を付与
	while (app.vault.getAbstractFileByPath(fullPath)) {
		fileName = `${baseFileName} ${fileNumber}`;
		fullPath = getFullPath(fileName);
		fileNumber++;
	}

	const newFile = await app.vault.createBinary(fullPath, new Uint8Array(0));
        await savePsdFile(app, newFile, layers);
        return newFile;
}

export async function generateThumbnail(app: App, file: TFile): Promise<string | null> {
        try {
                const buffer = await app.vault.readBinary(file);
                const psdData = agPsd.readPsd(buffer);

                if (!psdData.imageResources?.thumbnail) {
                        const compositeCanvas = document.createElement('canvas');
                        compositeCanvas.width = psdData.width;
                        compositeCanvas.height = psdData.height;
                        const ctx = compositeCanvas.getContext('2d');
                        if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
                        ctx.clearRect(0, 0, psdData.width, psdData.height);

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

export async function createPsd(
    app: App,
    imageFile?: TFile,
    layerName?: string,
    isOpen = true,
    targetDir?: string
): Promise<TFile> {
    const canvas = document.createElement('canvas');
    let ctx: CanvasRenderingContext2D | null = null;

    if (imageFile) {
        const imageData = await app.vault.readBinary(imageFile);
        const blob = new Blob([imageData]);
        const imageUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
        });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
        const x = (canvas.width - img.width) / 2;
        const y = (canvas.height - img.height) / 2;
        ctx.drawImage(img, x, y);
        URL.revokeObjectURL(imageUrl);
    } else {
        canvas.width = DEFAULT_CANVAS_WIDTH;
        canvas.height = DEFAULT_CANVAS_HEIGHT;
        ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const layer: Layer = {
        name: layerName || (imageFile ? imageFile.basename : t('BACKGROUND')),
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        canvas
    };

    let psdDir: string | undefined;
    if (targetDir) {
        psdDir = `${targetDir}/psd`;
    }

    const newFile = await createPsdFile(app, [layer], t('UNTITLED_ILLUSTRATION'), psdDir);
    if (isOpen) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(newFile, { active: true });
    }
    return newFile;
}

// ===== レイヤー処理 ======================================

type LayerType = 'image' | 'blank' | 'transparent';

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
    let ctx: CanvasRenderingContext2D | null = null;

    switch (type) {
        case 'image': {
            if (!imageFile) throw new Error('画像ファイルが指定されていません');
            const imageData = await app.vault.readBinary(imageFile);
            const blob = new Blob([imageData]);
            const imageUrl = URL.createObjectURL(blob);
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });
            const finalWidth = width === 0 ? img.width : width;
            const finalHeight = height === 0 ? img.height : height;
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
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

export async function addLayer(view: PainterView, name = t('NEW_LAYER'), imageFile?: TFile) {
    const baseWidth = view._canvas ? view._canvas.width : DEFAULT_CANVAS_WIDTH;
    const baseHeight = view._canvas ? view._canvas.height : DEFAULT_CANVAS_HEIGHT;

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

export function deleteLayer(view: PainterView, index: number) {
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
