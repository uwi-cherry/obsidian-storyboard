import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import { getPluginSettings } from '../../../constants/plugin-settings';
import { ComfyUIWebSocketClient } from '../gateway/comfyui-websocket';
import { createTextToImageWorkflow, createImageToImageWorkflow, createInpaintingWorkflow, WorkflowParams } from '../gateway/comfyui-workflows';

namespace Internal {
  export interface GenerateImageInput {
    prompt: string;
    app: App;
    fileName?: string;
    imageUrls?: string[];
    guidanceScale?: number;
    numImages?: number;
    aspectRatio?: string;
    seed?: number;
    attachments?: any[];
  }

  export interface GenerateImageOutput {
    filePath: string;
    message: string;
    seed?: number;
  }

  export const GENERATE_IMAGE_METADATA = {
    name: 'generate_image',
    description: 'Generate image via FLUX.1 Kontext Max Multi and save to assets',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        app: { type: 'object', description: 'Obsidian app instance' },
        fileName: { type: 'string', description: 'File name', nullable: true },
        imageUrls: { 
          type: 'array', 
          description: 'Reference image URLs for context', 
          items: { type: 'string' },
          nullable: true 
        },
        guidanceScale: { 
          type: 'number', 
          description: 'CFG scale (1.0-20.0)', 
          minimum: 1.0, 
          maximum: 20.0,
          nullable: true 
        },
        numImages: { 
          type: 'integer', 
          description: 'Number of images to generate (1-4)', 
          minimum: 1, 
          maximum: 4,
          nullable: true 
        },
        aspectRatio: { 
          type: 'string', 
          description: 'Aspect ratio (e.g., "1:1", "16:9", "9:16")',
          nullable: true 
        },
        seed: { 
          type: 'integer', 
          description: 'Seed for reproducible results',
          nullable: true 
        }
      },
      required: ['prompt', 'app']
    }
  } as const;

  async function generateViafAlAI(prompt: string, apiKey: string): Promise<string> {
    const endpoint = 'https://fal.run/fal-ai/flux/schnell';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1
      })
    });
    
    if (!res.ok) {
      throw new Error(`fal.ai API エラー: ${res.status} ${await res.text()}`);
    }
    
    const result = await res.json();
    if (!result.images || !result.images[0] || !result.images[0].url) {
      throw new Error('fal.aiから画像URLが返されませんでした');
    }
    
    return result.images[0].url;
  }

  async function generateViaComfyUI(prompt: string, comfyUrl: string, attachments?: any[]): Promise<string> {
    const client = new ComfyUIWebSocketClient(comfyUrl);
    
    try {
      // WebSocket接続
      await client.connect();
      
      // attachmentsを解析してワークフローの種類を決定
      const enabledAttachments = attachments?.filter(att => (att as any).enabled !== false) || [];
      const i2iImage = enabledAttachments.find(att => att.type === 'image');
      const maskImage = enabledAttachments.find(att => att.type === 'mask');
      
      let uploadedI2IName: string | undefined;
      let uploadedMaskName: string | undefined;
      
      // 画像アップロード
      if (i2iImage) {
        const i2iBlob = await dataURLToBlob(i2iImage.data);
        uploadedI2IName = await client.uploadImage(i2iBlob, 'i2i_image.png');
      }
      
      if (maskImage) {
        const maskBlob = await dataURLToBlob(maskImage.data);
        uploadedMaskName = await client.uploadImage(maskBlob, 'mask_image.png');
      }
      
      // ワークフローパラメータ
      const workflowParams: WorkflowParams = {
        prompt,
        i2iImageName: uploadedI2IName,
        maskImageName: uploadedMaskName
      };
      
      // 適切なワークフローを選択
      let workflow: any;
      if (uploadedI2IName && uploadedMaskName) {
        // Inpainting
        workflow = createInpaintingWorkflow(workflowParams);
      } else if (uploadedI2IName) {
        // Image-to-Image
        workflow = createImageToImageWorkflow(workflowParams);
      } else {
        // Text-to-Image
        workflow = createTextToImageWorkflow(workflowParams);
      }
      
      // ワークフローをキューに追加
      const promptId = await client.queueWorkflow(workflow);
      console.log(`ComfyUI workflow queued with ID: ${promptId}`);
      
      // 完了を待機（プログレス監視付き）
      client.addProgressListener(promptId, (progress) => {
        if (progress.type === 'progress' && progress.data) {
          const { value, max } = progress.data;
          if (value !== undefined && max !== undefined) {
            console.log(`ComfyUI Progress: ${value}/${max} (${Math.round((value/max)*100)}%)`);
          }
        }
      });
      
      const historyData = await client.waitForCompletion(promptId);
      
      // 結果から画像URLを取得
      if (historyData[promptId]) {
        const outputs = historyData[promptId].outputs;
        if (outputs && outputs["9"] && outputs["9"].images) {
          const filename = outputs["9"].images[0].filename;
          return `${comfyUrl}/view?filename=${filename}&type=output`;
        }
      }
      
      throw new Error('ComfyUIから画像結果を取得できませんでした');
      
    } finally {
      client.disconnect();
    }
  }
  
  // Helper function to convert data URL to Blob
  async function dataURLToBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL);
    return response.blob();
  }

  export async function executeGenerateImage(args: GenerateImageInput): Promise<string> {
    const { prompt, app, fileName } = args;
    const settings = getPluginSettings();
    
    if (!settings) {
      throw new Error('プラグイン設定が見つかりません');
    }

    let imageUrl: string;
    
    if (settings.aiProvider === 'fal.ai') {
      if (!settings.falApiKey) {
        throw new Error('fal.ai API キーが設定されていません');
      }
      imageUrl = await generateViafAlAI(prompt, settings.falApiKey);
    } else {
      if (!settings.comfyApiUrl) {
        throw new Error('ComfyUI URL が設定されていません');
      }
      imageUrl = await generateViaComfyUI(prompt, settings.comfyApiUrl, args.attachments);
    }

    // 画像をダウンロードして保存
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`画像ダウンロードエラー: ${imageRes.status}`);
    }
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const bin = new Uint8Array(arrayBuffer);

    const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
    const folder = normalizePath(`${activeDir}/assets`);
    const ext = 'png';
    let baseName = fileName ?? `generated-${Date.now()}.${ext}`;
    if (!baseName.endsWith(`.${ext}`)) baseName += `.${ext}`;
    let fullPath = `${folder}/${baseName}`;
    
    try {
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
    } catch {
      /* ignore */
    }
    
    let i = 1;
    while (app.vault.getAbstractFileByPath(fullPath)) {
      fullPath = `${folder}/${Date.now()}_${i}.${ext}`;
      i++;
    }
    
    const imageFile: TFile = await app.vault.createBinary(fullPath, bin);
    const result: GenerateImageOutput = {
      filePath: imageFile.path,
      message: `画像を生成しました (${settings.aiProvider}): ${imageFile.path}`
    };
    return JSON.stringify(result);
  }
}

export const generateImageTool: Tool<Internal.GenerateImageInput> = {
  name: 'generate_image',
  description: 'Generate image via FLUX.1 Kontext Max Multi and save to assets',
  parameters: Internal.GENERATE_IMAGE_METADATA.parameters,
  execute: Internal.executeGenerateImage
};
