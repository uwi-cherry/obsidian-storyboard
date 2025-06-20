import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import { getPluginSettings } from '../../../constants/plugin-settings';
import { ComfyUIWebSocketClient } from '../../comfy/comfyui-websocket';
import { WorkflowInjector } from '../../comfy/workflow-injector';
import { loadSettings } from '../../../storage/plugin-settings';
import { toolRegistry } from '../../core/tool-registry';
import { TOOL_NAMES } from '../../../constants/tools-config';
import i2iWorkflow from '../../comfy/i2i.json';
import inpaintWorkflow from '../../comfy/inpaint.json';

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
    blobUrl: string; // Blob URL
    message: string;
    seed?: number;
  }

  export const GENERATE_IMAGE_METADATA = {
    name: 'generate_image',
    description: 'Generate image via FLUX.1 Kontext Max Multi and return image data',
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
        },
      },
      required: ['prompt', 'app']
    }
  } as const;


  async function generateViaComfyUI(prompt: string, comfyUrl: string, attachments?: any[]): Promise<string> {
    const client = new ComfyUIWebSocketClient(comfyUrl);
    
    try {
      // WebSocket接続
      await client.connect();
      
      // attachmentsを解析してワークフローの種類を決定
      const enabledAttachments = attachments?.filter(att => (att as any).enabled !== false) || [];
      const i2iImage = enabledAttachments.find(att => att.type === 'image');
      const maskImage = enabledAttachments.find(att => att.type === 'mask');
      
      let uploadedImageName: string | undefined;
      
      // inpaint時はcombine-image-maskツールを使って合成
      if (i2iImage && maskImage) {
        // combine-image-maskツールを使って画像とマスクを合成
        const combineResult = await toolRegistry.executeTool('combine_image_mask', {
          imageData: i2iImage.data,
          maskData: maskImage.data
        });
        const combinedOutput = JSON.parse(combineResult);
        
        // 合成された画像をアップロード
        const combinedBlob = await dataURLToBlob(combinedOutput.combinedImageData);
        uploadedImageName = await client.uploadImage(combinedBlob, 'inpaint_image.png');
      } else if (i2iImage) {
        // i2i時は画像のみアップロード
        const i2iBlob = await dataURLToBlob(i2iImage.data);
        uploadedImageName = await client.uploadImage(i2iBlob, 'i2i_image.png');
      }
      
      // 設定からカスタムワークフローを取得
      const plugin = (globalThis as any).__obsidianPlugin;
      const settings = plugin ? await loadSettings(plugin) : null;
      
      // 適切なワークフローを選択
      let workflow: any;
      if (i2iImage && maskImage) {
        // Inpainting - カスタムワークフローがあれば使用
        if (settings?.inpaintingWorkflow) {
          workflow = JSON.parse(JSON.stringify(settings.inpaintingWorkflow));
        } else {
          workflow = JSON.parse(JSON.stringify(inpaintWorkflow));
        }
      } else {
        // T2I/I2I統合 - i2iワークフローをベースに使用
        if (settings?.imageToImageWorkflow) {
          workflow = JSON.parse(JSON.stringify(settings.imageToImageWorkflow));
        } else {
          workflow = JSON.parse(JSON.stringify(i2iWorkflow));
        }
        
        // 画像がない場合はEmptyLatentImageに差し替え
        if (!i2iImage) {
          // EmptyLatentImageノードを探すか追加
          let emptyLatentNodeId = null;
          for (const nodeId in workflow) {
            if (workflow[nodeId].class_type === "EmptyLatentImage") {
              emptyLatentNodeId = nodeId;
              break;
            }
          }
          
          // EmptyLatentImageがなければ追加
          if (!emptyLatentNodeId) {
            emptyLatentNodeId = "empty_latent";
            workflow[emptyLatentNodeId] = {
              "inputs": {
                "width": 512,
                "height": 512,
                "batch_size": 1
              },
              "class_type": "EmptyLatentImage",
              "_meta": {
                "title": "空の潜在画像"
              }
            };
          }
          
          // KSamplerのlatent_image入力をEmptyLatentImageに変更
          for (const nodeId in workflow) {
            const node = workflow[nodeId];
            if (node.class_type === "KSampler" || node.class_type === "KSamplerAdvanced" || node.class_type === "SamplerCustom") {
              node.inputs.latent_image = [emptyLatentNodeId, 0];
            }
          }
        }
      }
      
      // WorkflowInjectorを使用してプロンプトと画像を設定
      WorkflowInjector.inject({
        workflow,
        positivePrompt: prompt,
        negativePrompt: "bad quality, blurry, low resolution",
        imageName: uploadedImageName
      });
      
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
        
        // ノード番号はワークフローによって異なるので、画像出力を持つ最初のノードを探す
        for (const nodeId in outputs) {
          if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
            const filename = outputs[nodeId].images[0].filename;
            console.log(`Found image output in node ${nodeId}: ${filename}`);
            return `${comfyUrl}/view?filename=${filename}&type=output`;
          }
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
    const { prompt } = args;
    const settings = getPluginSettings();
    
    if (!settings) {
      throw new Error('プラグイン設定が見つかりません');
    }

    if (!settings.comfyApiUrl) {
      throw new Error('ComfyUI URL が設定されていません');
    }
    
    const imageUrl = await generateViaComfyUI(prompt, settings.comfyApiUrl, args.attachments);

    // 画像をダウンロード
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`画像ダウンロードエラー: ${imageRes.status}`);
    }
    
    const arrayBuffer = await imageRes.arrayBuffer();
    
    // ArrayBufferからBlobを作成してURLを生成
    const blob = new Blob([arrayBuffer], { type: 'image/png' });
    const blobUrl = URL.createObjectURL(blob);
    
    const result: GenerateImageOutput = {
      blobUrl: blobUrl,
      message: `画像を生成しました (ComfyUI)`
    };
    return JSON.stringify(result);
  }
}

export const generateImageTool: Tool<Internal.GenerateImageInput> = {
  name: 'generate_image',
  description: 'Generate image via FLUX.1 Kontext Max Multi and return image data',
  parameters: Internal.GENERATE_IMAGE_METADATA.parameters,
  execute: Internal.executeGenerateImage
};
