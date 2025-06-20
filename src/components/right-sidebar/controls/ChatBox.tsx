import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { App } from 'obsidian';
import { TABLE_ICONS } from '../../../constants/icons';
import { useChatAttachmentsStore } from '../../../store/chat-attachments-store';
import { toolRegistry } from '../../../service/core/tool-registry';
import { TOOL_NAMES } from '../../../constants/tools-config';
import { useLayersStore } from '../../../storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../store/current-layer-index-store';
import { StreamingGenerator } from '../../../service/api/ai-tool/streaming-generate';
import { getPluginSettings } from '../../../constants/plugin-settings';

interface ChatBoxProps {
  app: App;
}

export default function ChatBox({ app }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generation' | 'streaming'>('generation');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingImage, setStreamingImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamingGeneratorRef = useRef<StreamingGenerator | null>(null);
  
  const { attachments, addAttachment, removeAttachment, clearAttachments } = useChatAttachmentsStore();

  // クリーンアップ: コンポーネントのアンマウント時にストリーミングを停止
  useEffect(() => {
    return () => {
      streamingGeneratorRef.current?.stop();
    };
  }, []);

  // プロンプト変更時にストリーミング生成のプロンプトを更新
  useEffect(() => {
    if (isStreaming && streamingGeneratorRef.current) {
      streamingGeneratorRef.current.updatePrompt(input || 'beautiful landscape');
    }
  }, [input, isStreaming]);

  // 画像添付変更時にストリーミング生成の画像を更新
  useEffect(() => {
    if (isStreaming && streamingGeneratorRef.current) {
      const i2iAttachment = attachments.find(att => att.type === 'image' && att.enabled !== false);
      streamingGeneratorRef.current.updateImage(i2iAttachment?.data);
    }
  }, [attachments, isStreaming]);


  const generateMergedLayersImage = (): string => {
    const { mergedCanvas } = useLayersStore.getState();
    if (!mergedCanvas) {
      console.log('mergedCanvas is null');
      return '';
    }
    return mergedCanvas.toDataURL();
  };

  const toggleI2iMode = (index: number) => {
    const attachment = attachments[index];
    if (!attachment || attachment.type !== 'image') return;
    
    const newEnabled = !attachment.enabled;
    let newData = '';
    let newUrl = '';
    
    if (newEnabled) {
      newData = generateMergedLayersImage();
      newUrl = newData;
    }
    
    // Update attachment
    const newAttachments = [...attachments];
    newAttachments[index] = {
      ...attachment,
      url: newUrl || attachment.url,
      data: newData || attachment.data,
      enabled: newEnabled
    };
    
    // Replace all attachments to trigger re-render
    useChatAttachmentsStore.setState({ attachments: newAttachments });
  };

  const handleReferenceSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    
    reader.onload = () => {
      const data = reader.result as string;
      addAttachment({ url, data, type: 'reference', enabled: true });
    };
    
    reader.readAsDataURL(file);
    e.target.value = '';
  };



  const handleSend = async (e: FormEvent) => {
    e.preventDefault();

    if (activeTab === 'streaming') {
      // ストリーミングモードのトグル処理
      if (isStreaming) {
        // 停止前に最後の画像をレイヤーに追加
        if (streamingImage) {
          try {
            console.log('Adding streaming result to layer:', streamingImage);
            
            // 画像をダウンロード
            const response = await fetch(streamingImage);
            const arrayBuffer = await response.arrayBuffer();
            
            // レイヤーに追加
            const layerResult = await toolRegistry.executeTool(TOOL_NAMES.ADD_LAYER, {
              name: `Streaming: ${input.substring(0, 30) || 'Generated'}`,
              fileData: arrayBuffer,
              app
            });
            console.log('Layer added:', layerResult);
          } catch (error) {
            console.error('Failed to add streaming result to layer:', error);
          }
        }
        
        // 停止
        await streamingGeneratorRef.current?.stop();
        streamingGeneratorRef.current = null;
        setIsStreaming(false);
      } else {
        // 開始
        const settings = getPluginSettings();
        if (!settings?.comfyApiUrl) {
          console.error('ComfyUI URL not configured');
          return;
        }
        
        const prompt = input.trim() || 'beautiful landscape';
        streamingGeneratorRef.current = new StreamingGenerator(settings.comfyApiUrl);
        
        try {
          // i2i画像を探して渡す
          const i2iAttachment = attachments.find(att => att.type === 'image' && att.enabled !== false);
          
          await streamingGeneratorRef.current.start(prompt, (imageUrl) => {
            setStreamingImage(imageUrl);
          }, i2iAttachment?.data);
          setIsStreaming(true);
        } catch (error) {
          console.error('Failed to start streaming:', error);
          streamingGeneratorRef.current = null;
          setIsStreaming(false);
          alert('ストリーミング生成の開始に失敗しました。ComfyUIが起動しているか確認してください。');
        }
      }
      return;
    }

    // 通常の生成処理
    const prompt = input.trim();
    setInput('');
    clearAttachments();
    setLoading(true);
    
    try {
      // AI画像生成
      console.log('🎨 画像生成開始:', { prompt, attachments });
      const result = await toolRegistry.executeTool(TOOL_NAMES.GENERATE_IMAGE, { 
        prompt,
        app,
        attachments 
      });
      console.log('✅ 画像生成完了:', result);
      
      // 結果から画像データを取得してレイヤーに追加
      const resultData = JSON.parse(result);
      console.log('📊 結果データ:', resultData);
      
      if (resultData.blobUrl) {
        console.log('🔄 レイヤー追加開始');
        
        try {
          // Blob URLから画像データを取得
          const response = await fetch(resultData.blobUrl);
          const arrayBuffer = await response.arrayBuffer();
          
          const layerResult = await toolRegistry.executeTool(TOOL_NAMES.ADD_LAYER, {
            name: prompt.substring(0, 30) || 'Generated Image',
            fileData: arrayBuffer,
            app
          });
          console.log('✅ レイヤー追加完了:', layerResult);
        } finally {
          // メモリリークを防ぐためにBlobURLを解放
          URL.revokeObjectURL(resultData.blobUrl);
        }
      } else {
        console.warn('⚠️ blobUrlが見つかりません:', resultData);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '画像生成に失敗しました';
      console.error('❌ 画像生成エラー:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full border-t border-modifier-border bg-primary">
      
      <div className="flex border-b border-modifier-border" role="tablist">
        <div
          role="tab"
          tabIndex={0}
          aria-selected={activeTab === 'generation'}
          className={`flex-1 p-2 text-sm font-medium rounded-t border-t border-l border-r transition-colors relative cursor-pointer ${
            activeTab === 'generation'
              ? 'text-text-normal bg-primary border-modifier-border -mb-px z-10'
              : 'text-text-muted bg-secondary border-transparent hover:text-text-normal hover:bg-modifier-hover'
          }`}
          onClick={() => setActiveTab('generation')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('generation');
            }
          }}
        >
          AI画像生成
        </div>
        <div
          role="tab"
          tabIndex={0}
          aria-selected={activeTab === 'streaming'}
          className={`flex-1 p-2 text-sm font-medium rounded-t border-t border-l border-r transition-colors relative cursor-pointer ${
            activeTab === 'streaming'
              ? 'text-text-normal bg-primary border-modifier-border -mb-px z-10'
              : 'text-text-muted bg-secondary border-transparent hover:text-text-normal hover:bg-modifier-hover'
          }`}
          onClick={() => setActiveTab('streaming')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('streaming');
            }
          }}
        >
          ストリーミング生成
        </div>
      </div>
      
      {loading && (
        <div className="text-xs text-text-faint text-center p-2">
          画像生成中...
        </div>
      )}

      <form onSubmit={handleSend} className="flex flex-col p-2 border-t border-modifier-border w-full gap-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReferenceSelect}
        />

        {/* ストリーミング生成プレビューエリア */}
        {activeTab === 'streaming' && (
          <div className="mb-3">
            <div className="w-full h-48 border-2 border-dashed border-modifier-border rounded-lg flex items-center justify-center bg-secondary relative overflow-hidden">
              {isStreaming && streamingImage ? (
                <img 
                  src={streamingImage} 
                  alt="Streaming preview" 
                  className="w-full h-full object-contain"
                />
              ) : isStreaming ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-text-muted">接続中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 19 20.1046 19 19V5C19 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8.5 14L12 10.5L15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm">ストリーミング生成プレビュー</span>
                  <span className="text-xs opacity-70">開始ボタンを押してリアルタイム生成を開始</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {attachments.map((att, idx) => {
            const border = att.type === 'image'
              ? 'border-blue-500'
              : att.type === 'mask'
              ? 'border-red-500'
              : att.type === 'reference'
              ? 'border-green-500'
              : 'border-gray-500';
            return (
              <div key={idx} className="relative">
                <img
                  src={att.url}
                  alt={`${att.type} attachment`}
                  className={`w-12 h-12 object-cover rounded border-2 ${border} ${att.type === 'image' && !att.enabled ? 'opacity-50' : ''}`}
                />
                
                {/* 右上のコントロールボタン */}
                <div className="absolute -top-1 -right-1">
                  {/* i2i画像ON/OFFボタン */}
                  {att.type === 'image' && (
                    <button
                      type="button"
                      className={`rounded-full p-1 text-xs hover:bg-modifier-hover ${att.enabled ? 'bg-accent text-accent-foreground' : 'bg-secondary'}`}
                      onClick={() => toggleI2iMode(idx)}
                      title={att.enabled ? 'i2i有効' : 'i2i無効'}
                    >
                      {att.enabled ? '👁' : '🚫'}
                    </button>
                  )}
                  
                  {/* 削除ボタン（リファレンス・マスクのみ） */}
                  {(att.type === 'reference' || att.type === 'mask') && (
                    <button
                      type="button"
                      className="bg-secondary rounded-full p-1"
                      onClick={() => removeAttachment(idx)}
                      dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          
          {/* リファレンス追加ボタン */}
          <button
            type="button"
            className="w-12 h-12 border-2 border-dashed border-modifier-border rounded flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            title="リファレンス画像を追加"
          >
            <span className="text-lg">+</span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={activeTab === 'streaming' ? "リアルタイム生成のプロンプト" : "プロンプトを入力"}
            className="flex-1 p-2 border border-modifier-border rounded bg-primary text-text-normal"
            disabled={loading}
          />
        </div>
        
        <div className="flex">
          <button
            type="submit"
            className="flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover disabled:opacity-50"
            disabled={loading}
          >
            {activeTab === 'generation' ? '生成' : isStreaming ? '停止' : '開始'}
          </button>
        </div>
        
      </form>
    </div>
  );
}
