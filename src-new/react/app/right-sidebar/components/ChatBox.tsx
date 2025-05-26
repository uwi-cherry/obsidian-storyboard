import React, { useState, useRef, useEffect } from 'react';
import type { Plugin } from 'obsidian';
import { t } from '../../../../constants/obsidian-i18n';
import { ADD_ICON_SVG, TABLE_ICONS } from '../../../../constants/icons';

interface ChatBoxProps {
  plugin?: Plugin;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

interface Attachment {
  url: string;
  data: string;
  type: 'image' | 'mask' | 'reference';
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<'image' | 'mask' | 'reference' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const type = pendingTypeRef.current ?? 'image';
    const reader = new FileReader();
    
    reader.onload = () => {
      const data = reader.result as string;
      setAttachments(prev => [...prev, { url, data, type }]);
    };
    
    reader.readAsDataURL(file);
    pendingTypeRef.current = null;
    e.target.value = '';
  };

  const openFileDialog = (type: 'image' | 'mask' | 'reference') => {
    pendingTypeRef.current = type;
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return updated;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!input.trim()) return;
    
    const userMessage = input;
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage, attachments },
    ]);
    
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    setInput('');
    setAttachments([]);
    setLoading(true);
    
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = `AI応答（開発中）: ${userMessage}`;
      
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          last.content = response;
        }
        return updated;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('AI_RESPONSE_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full border-t border-modifier-border bg-primary mb-6">
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm rounded px-2 py-1 max-w-full break-words ${
              msg.role === 'user' 
                ? 'bg-accent text-on-accent text-right ml-auto' 
                : 'bg-secondary mr-auto'
            }`}
          >
            {msg.attachments && msg.attachments.length > 0 && (
              <div className={`flex gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.attachments.map((att, aIdx) => {
                  const border = att.type === 'image'
                    ? 'border-blue-500'
                    : att.type === 'mask'
                    ? 'border-red-500'
                    : 'border-green-500';
                  return (
                    <img
                      key={aIdx}
                      src={att.url}
                      alt={`${att.type} attachment`}
                      className={`w-12 h-12 object-cover rounded border-2 ${border}`}
                    />
                  );
                })}
              </div>
            )}
            {msg.content}
          </div>
        ))}
        
        {loading && (
          <div className="text-xs text-text-faint text-center">
            {t('LOADING')}
          </div>
        )}
        
        {error && (
          <div className="text-xs text-error text-center">{error}</div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex flex-col p-2 border-t border-modifier-border w-full gap-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {attachments.length > 0 && (
          <div className="flex gap-2">
            {attachments.map((att, idx) => {
              const border = att.type === 'image'
                ? 'border-blue-500'
                : att.type === 'mask'
                ? 'border-red-500'
                : 'border-green-500';
              return (
                <div key={idx} className="relative">
                  <img
                    src={att.url}
                    alt={`${att.type} attachment`}
                    className={`w-12 h-12 object-cover rounded border-2 ${border}`}
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-secondary rounded-full p-1"
                    onClick={() => removeAttachment(idx)}
                    dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
              onClick={() => setShowMenu(prev => !prev)}
              dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }}
            />
            {showMenu && (
              <div className="absolute bottom-full left-0 mb-1 flex flex-col bg-secondary border border-modifier-border rounded z-10">
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-modifier-hover text-left flex items-center"
                  onClick={() => openFileDialog('image')}
                >
                  🖼️ {t('ATTACH_IMAGE')}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-modifier-hover text-left flex items-center"
                  onClick={() => openFileDialog('mask')}
                >
                  🎭 {t('ATTACH_MASK')}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-modifier-hover text-left flex items-center"
                  onClick={() => openFileDialog('reference')}
                >
                  📎 {t('ATTACH_REFERENCE')}
                </button>
              </div>
            )}
          </div>
          
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('CHAT_INPUT_PLACEHOLDER')}
            className="flex-1 p-1 border border-modifier-border rounded bg-primary text-text-normal"
            disabled={loading}
          />
          
          <button
            type="submit"
            className="p-1 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            {t('SEND')}
          </button>
        </div>
      </form>
    </div>
  );
} 
