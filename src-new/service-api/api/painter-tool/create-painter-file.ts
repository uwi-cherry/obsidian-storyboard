import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';

/**
 * 内部実装 - サービスAPI内部でのみ使用
 */
namespace Internal {
  /** Create Painter File の入力型 */
  export interface CreatePainterFileInput {
    app: App;
    imageFile?: TFile;
  }

  /** 出力型 */
  export interface CreatePainterFileOutput {
    filePath: string;
    message: string;
  }

  const DEFAULT_CANVAS_WIDTH = 800;
  const DEFAULT_CANVAS_HEIGHT = 600;

  /** Create Painter File のメタデータ */
  export const CREATE_PAINTER_FILE_METADATA = {
    name: 'create_painter_file',
    description: 'Create new PSD file',
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'object', description: 'Obsidian app instance' },
        imageFile: { type: 'object', description: 'Source image file', nullable: true }
      },
      required: ['app']
    }
  } as const;

  /** 実行関数 */
  export async function executeCreatePainterFile(args: CreatePainterFileInput): Promise<string> {
    const { app, imageFile } = args;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');

    if (imageFile) {
      const data = await app.vault.readBinary(imageFile);
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = url;
      });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    } else {
      canvas.width = DEFAULT_CANVAS_WIDTH;
      canvas.height = DEFAULT_CANVAS_HEIGHT;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const psdData = {
      width: canvas.width,
      height: canvas.height,
      children: [
        {
          name: imageFile ? imageFile.basename : 'Background',
          hidden: false,
          opacity: 1,
          blendMode: 'normal' as const,
          canvas,
          left: 0,
          top: 0
        }
      ],
      canvas
    } as agPsd.Psd;

    const buffer = agPsd.writePsd(psdData, { generateThumbnail: false });

    let counter = 1;
    let fileName = `untitled-${counter}.psd`;
    while (app.vault.getAbstractFileByPath(fileName)) {
      counter++;
      fileName = `untitled-${counter}.psd`;
    }

    const file = await app.vault.createBinary(fileName, buffer);

    const result: CreatePainterFileOutput = {
      filePath: file.path,
      message: `PSDファイル「${fileName}」を作成しました`
    };

    return JSON.stringify(result);
  }
}

/** 外部公開用ツール定義 */
export const createPainterFileTool: Tool<Internal.CreatePainterFileInput> = {
  name: 'create_painter_file',
  description: 'Create new PSD file',
  parameters: Internal.CREATE_PAINTER_FILE_METADATA.parameters,
  execute: Internal.executeCreatePainterFile
};
