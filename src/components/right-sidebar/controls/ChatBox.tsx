import { useState, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { App } from 'obsidian';
import { TABLE_ICONS } from '../../../constants/icons';
import { useChatAttachmentsStore } from '../../../store/chat-attachments-store';
import { toolRegistry } from '../../../service/core/tool-registry';
import { TOOL_NAMES } from '../../../constants/tools-config';

interface ChatBoxProps {
  app: App;
}

export default function ChatBox({ app }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generation' | 'streaming'>('generation');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { attachments, addAttachment, removeAttachment, toggleAttachment, clearAttachments } = useChatAttachmentsStore();

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

    if (!input.trim()) return;

    const prompt = input.trim();
    setInput('');
    clearAttachments();
    setLoading(true);
    
    try {
      // AI画像生成してレイヤーに追加
      await toolRegistry.executeTool(TOOL_NAMES.GENERATE_IMAGE, { 
        prompt,
        app,
        attachments 
      });
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
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-text-muted">リアルタイム生成中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 19 20.1046 19 19V5C19 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8.5 14L12 10.5L15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm">ストリーミング生成プレビュー</span>
                  <span className="text-xs opacity-70">プロンプト入力後にリアルタイム生成が開始されます</span>
                </div>
              )}
              
              {/* プレビュー画像表示エリア（将来の実装用） */}
              <div className="absolute inset-0 bg-transparent pointer-events-none">
                {/* ここに将来的にストリーミング画像を表示 */}
              </div>
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
                  className={`w-12 h-12 object-cover rounded border-2 ${border} ${(att as any).enabled === false ? 'opacity-50' : ''}`}
                />
                
                {/* 右上のコントロールボタン */}
                <div className="absolute -top-1 -right-1">
                  {/* 有効・無効切り替えボタン（i2i画像のみ） */}
                  {att.type === 'image' && (
                    <button
                      type="button"
                      className="bg-secondary rounded-full p-1 text-xs"
                      onClick={() => toggleAttachment(idx)}
                      title={(att as any).enabled === false ? '有効にする' : '無効にする'}
                    >
                      {(att as any).enabled === false ? '🚫' : '👁'}
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
            placeholder="プロンプトを入力"
            className="flex-1 p-1 border border-modifier-border rounded bg-primary text-text-normal"
            disabled={loading}
          />
        </div>
        
        <div className="flex">
          <button
            type="submit"
            className="flex-1 p-2 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            {activeTab === 'generation' ? '生成' : '確定'}
          </button>
        </div>
        
      </form>
    </div>
  );
}
