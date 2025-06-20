import { ComfyUIWebSocketClient } from '../../comfy/comfyui-websocket';
import { WorkflowInjector } from '../../comfy/workflow-injector';
import { loadSettings } from '../../../storage/plugin-settings';
import streamingWorkflow from '../../comfy/streaming.json';

export class StreamingGenerator {
  private client: ComfyUIWebSocketClient | null = null;
  private isActive = false;
  private onImageGenerated?: (imageUrl: string) => void;
  private currentPrompt = '';
  private currentImageData?: string;
  private uploadedImageName?: string;
  private isGenerating = false;
  private generationCompletePromise: Promise<void> | null = null;

  constructor(private comfyUrl: string) {}

  async start(prompt: string, onImageGenerated: (imageUrl: string) => void, imageData?: string): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    this.currentPrompt = prompt;
    this.currentImageData = imageData;
    this.onImageGenerated = onImageGenerated;
    
    try {
      // WebSocket接続
      this.client = new ComfyUIWebSocketClient(this.comfyUrl);
      await this.client.connect();
      
      // 画像がある場合はアップロード
      if (imageData && this.client) {
        console.log('Starting image upload for streaming...');
        const imageBlob = await this.dataURLToBlob(imageData);
        this.uploadedImageName = await this.client.uploadImage(imageBlob, 'streaming_input.png');
        console.log('Uploaded image for streaming:', this.uploadedImageName);
      } else {
        console.log('No image data provided for streaming');
        this.uploadedImageName = undefined;
      }
      
      // 初回生成
      await this.triggerGeneration();
    } catch (error) {
      console.error('Failed to start streaming generation:', error);
      this.isActive = false;
      throw error;
    }
  }

  private async triggerGeneration(): Promise<void> {
    if (!this.isActive) return;
    
    // 既に生成中の場合は完了を待機
    if (this.generationCompletePromise) {
      await this.generationCompletePromise;
    }
    
    this.isGenerating = true;
    
    this.generationCompletePromise = (async () => {
      try {
        await this.generateOnce();
      } catch (error) {
        console.error('Streaming generation error:', error);
      } finally {
        this.isGenerating = false;
        this.generationCompletePromise = null;
      }
    })();
    
    await this.generationCompletePromise;
  }

  private async generateOnce(): Promise<void> {
    if (!this.client || !this.isActive) return;
    
    try {
      // 設定からカスタムワークフローを取得
      const plugin = (globalThis as any).__obsidianPlugin;
      const settings = plugin ? await loadSettings(plugin) : null;
      
      // ワークフローを選択
      let workflow: any;
      if (settings?.streamingWorkflow) {
        workflow = JSON.parse(JSON.stringify(settings.streamingWorkflow));
      } else {
        workflow = JSON.parse(JSON.stringify(streamingWorkflow));
      }
      
      // 画像がない場合はt2iモードに切り替え
      if (!this.uploadedImageName) {
        // SamplerCustomをEmptyLatentImageに接続
        const samplerNodes = WorkflowInjector.findNodesByType(workflow, 'SamplerCustom');
        const emptyLatentNodes = WorkflowInjector.findNodesByType(workflow, 'EmptyLatentImage');
        
        if (samplerNodes.length > 0 && emptyLatentNodes.length > 0) {
          const [samplerId] = samplerNodes[0];
          const [emptyLatentId] = emptyLatentNodes[0];
          workflow[samplerId].inputs.latent_image = [emptyLatentId, 0];
          console.log(`Switched to t2i mode: ${samplerId} -> ${emptyLatentId}`);
        }
      }
      
      // プロンプトと画像を注入（WorkflowInjectorに任せる）
      console.log('Injecting into workflow:', { 
        prompt: this.currentPrompt, 
        imageName: this.uploadedImageName 
      });
      
      WorkflowInjector.inject({
        workflow,
        positivePrompt: this.currentPrompt,
        negativePrompt: "bad quality, blurry, low resolution",
        imageName: this.uploadedImageName
      });
      
      // ワークフローをキューに追加
      const promptId = await this.client.queueWorkflow(workflow);
      
      // 完了を待機（短めのタイムアウトでリアルタイム性を重視）
      const historyData = await this.client.waitForCompletion(promptId, 10000);
      
      // 結果から画像URLを取得（SaveImageノードを使用）
      if (historyData[promptId]) {
        const outputs = historyData[promptId].outputs;
        
        // WorkflowInjectorを使ってSaveImageノードを探す
        const saveImageNodes = WorkflowInjector.findNodesByType(workflow, 'SaveImage');
        
        for (const [nodeId] of saveImageNodes) {
          const nodeOutput = outputs[nodeId];
          if (nodeOutput?.images && nodeOutput.images.length > 0) {
            const filename = nodeOutput.images[0].filename;
            const imageUrl = `${this.comfyUrl}/view?filename=${filename}&type=output`;
            
            console.log(`Streaming image saved in SaveImage node ${nodeId}: ${filename}`);
            
            if (this.onImageGenerated) {
              this.onImageGenerated(imageUrl);
            }
            return;
          }
        }
      }
    } catch (error) {
      // 個別の生成エラーは無視して継続
      console.warn('Single generation failed:', error);
    }
  }

  updatePrompt(prompt: string): void {
    this.currentPrompt = prompt;
    this.triggerGeneration();
  }

  async updateImage(imageData: string | undefined): Promise<void> {
    this.currentImageData = imageData;
    
    if (imageData && this.client) {
      try {
        const imageBlob = await this.dataURLToBlob(imageData);
        this.uploadedImageName = await this.client.uploadImage(imageBlob, 'streaming_input_updated.png');
        console.log('Updated streaming image:', this.uploadedImageName);
      } catch (error) {
        console.error('Failed to update streaming image:', error);
        this.uploadedImageName = undefined;
      }
    } else {
      console.log('Clearing streaming image');
      this.uploadedImageName = undefined;
    }
    
    this.triggerGeneration();
  }

  private async dataURLToBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL);
    return response.blob();
  }

  async stop(): Promise<void> {
    this.isActive = false;
    
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  isRunning(): boolean {
    return this.isActive;
  }
}