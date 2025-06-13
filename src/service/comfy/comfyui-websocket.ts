/**
 * ComfyUI WebSocket client for real-time progress tracking
 */
export interface ComfyUIProgress {
  type: 'progress' | 'executing' | 'executed' | 'execution_start' | 'execution_cached' | 'execution_error';
  data?: {
    node?: string;
    value?: number;
    max?: number;
    prompt_id?: string;
    output?: any;
    exception_message?: string;
  };
}

export class ComfyUIWebSocketClient {
  private ws: WebSocket | null = null;
  private clientId: string;
  private listeners: Map<string, ((progress: ComfyUIProgress) => void)[]> = new Map();

  constructor(private comfyUrl: string) {
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.comfyUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      this.ws = new WebSocket(`${wsUrl}/ws?clientId=${this.clientId}`);

      this.ws.onopen = () => {
        console.log('ComfyUI WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('ComfyUI WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('ComfyUI WebSocket disconnected');
        this.ws = null;
      };
    });
  }

  private handleMessage(message: any) {
    const { type, data } = message;
    
    if (data?.prompt_id) {
      const promptListeners = this.listeners.get(data.prompt_id) || [];
      promptListeners.forEach(listener => {
        listener({ type, data });
      });
    }

    // Global listeners (for all prompts)
    const globalListeners = this.listeners.get('*') || [];
    globalListeners.forEach(listener => {
      listener({ type, data });
    });
  }

  addProgressListener(promptId: string, callback: (progress: ComfyUIProgress) => void) {
    if (!this.listeners.has(promptId)) {
      this.listeners.set(promptId, []);
    }
    this.listeners.get(promptId)!.push(callback);
  }

  removeProgressListener(promptId: string, callback: (progress: ComfyUIProgress) => void) {
    const listeners = this.listeners.get(promptId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async queueWorkflow(workflow: any): Promise<string> {
    const response = await fetch(`${this.comfyUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: workflow,
        client_id: this.clientId
      })
    });

    if (!response.ok) {
      throw new Error(`ComfyUI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.prompt_id;
  }

  async waitForCompletion(promptId: string, timeoutMs: number = 300000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeProgressListener(promptId, progressListener);
        reject(new Error('ComfyUI処理タイムアウト'));
      }, timeoutMs);

      const progressListener = (progress: ComfyUIProgress) => {
        if (progress.type === 'executed' && progress.data?.prompt_id === promptId) {
          clearTimeout(timeout);
          this.removeProgressListener(promptId, progressListener);
          
          // 結果を取得
          this.getHistory(promptId).then(resolve).catch(reject);
        } else if (progress.type === 'execution_error') {
          clearTimeout(timeout);
          this.removeProgressListener(promptId, progressListener);
          reject(new Error(progress.data?.exception_message || 'ComfyUI実行エラー'));
        }
      };

      this.addProgressListener(promptId, progressListener);
    });
  }

  async getHistory(promptId: string): Promise<any> {
    const response = await fetch(`${this.comfyUrl}/history/${promptId}`);
    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.status}`);
    }
    return response.json();
  }

  async uploadImage(imageData: Blob, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageData, filename);

    const response = await fetch(`${this.comfyUrl}/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.name; // ComfyUIが返すファイル名
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  getClientId(): string {
    return this.clientId;
  }
}