import { App, normalizePath, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import { PSD_EXTENSION, BLEND_MODE_TO_COMPOSITE_OPERATION } from './constants';
import { Layer } from './psd-painter-types';

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
	baseFileName = '無題のイラスト',
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