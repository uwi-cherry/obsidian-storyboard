import { Tool } from '../../core/tool';

namespace Internal {
  export interface CombineImageMaskInput {
    imageData: string;  // data URL
    maskData: string;   // data URL
  }

  export interface CombineImageMaskOutput {
    combinedImageData: string;  // data URL
  }

  export const COMBINE_IMAGE_MASK_METADATA = {
    name: 'combine_image_mask',
    description: 'Combine image and mask into single image with alpha channel',
    parameters: {
      type: 'object',
      properties: {
        imageData: { type: 'string', description: 'Original image data URL' },
        maskData: { type: 'string', description: 'Mask image data URL' }
      },
      required: ['imageData', 'maskData']
    }
  } as const;

  export async function executeCombineImageMask(args: CombineImageMaskInput): Promise<string> {
    const { imageData, maskData } = args;
    
    console.log('🎨 画像とマスクを合成中...');

    try {
      // data URLをImageオブジェクトに変換
      const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = dataUrl;
        });
      };

      const [image, mask] = await Promise.all([
        loadImage(imageData),
        loadImage(maskData)
      ]);

      // Canvasで合成処理
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;

      // 画像を描画
      ctx.drawImage(image, 0, 0);

      // 画像データを取得
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // マスク用のcanvasを作成
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = mask.width;
      maskCanvas.height = mask.height;
      const maskCtx = maskCanvas.getContext('2d')!;
      maskCtx.drawImage(mask, 0, 0);
      const maskDataObj = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const maskPixels = maskDataObj.data;

      // インペイント用：マスクの白い部分（255）を透明に、黒い部分（0）を不透明にする
      for (let i = 0; i < data.length; i += 4) {
        // マスクのグレースケール値を取得（R値を使用）
        const maskValue = maskPixels[i];
        // インペイント用の逆転：白（255）→透明（0）、黒（0）→不透明（255）
        data[i + 3] = 255 - maskValue;
      }

      // 変更したデータを戻す
      ctx.putImageData(imageDataObj, 0, 0);

      // data URLとして出力
      const combinedDataUrl = canvas.toDataURL('image/png');

      const result: CombineImageMaskOutput = {
        combinedImageData: combinedDataUrl
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('画像とマスクの合成中にエラーが発生しました:', error);
      // エラー時は元画像を返す
      const result: CombineImageMaskOutput = {
        combinedImageData: imageData
      };
      return JSON.stringify(result);
    }
  }
}

export const combineImageMaskTool: Tool<Internal.CombineImageMaskInput> = {
  name: 'combine_image_mask',
  description: 'Combine image and mask into single image with alpha channel',
  parameters: Internal.COMBINE_IMAGE_MASK_METADATA.parameters,
  execute: Internal.executeCombineImageMask
};