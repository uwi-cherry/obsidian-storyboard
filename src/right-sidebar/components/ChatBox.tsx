import MyPlugin from "main";
import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "src/ai/chat";
import { t } from "src/i18n";
import { ADD_ICON_SVG, TABLE_ICONS } from "src/icons";

interface ChatBoxProps {
  plugin?: MyPlugin;
}

interface Attachment {
  url: string;
  type: 'image' | 'mask' | 'reference';
}

function getGlobalPlugin(): MyPlugin | undefined {
  // @ts-ignore
  return window.__psdPainterPlugin;
}

const ChatBox: React.FC<ChatBoxProps> = ({ plugin }) => {
  const [messages, setMessages] = useState<{ role: string; content: string; attachments?: Attachment[] }[]>([]);
  const [input, setInput] = useState("");
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
    setAttachments(prev => [...prev, { url, type }]);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input.trim()) return;
    const userMessage = input;
    setMessages(prev => [
      ...prev,
      { role: "user", content: userMessage, attachments },
    ]);
    // プレースホルダの assistant メッセージを用意
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);
    setLoading(true);
    try {
      const aiResult = await sendChatMessage(
        userMessage,
        plugin ?? getGlobalPlugin(),
        (token) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              last.content += token;
            }
            return updated;
          });
        },
      );
      // 念のため最終出力を上書き（トークンで構築済みのはず）
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          last.content = aiResult.finalOutput ?? last.content;
        }
        return updated;
      });
    } catch (err: any) {
      setError(err.message || t('AI_RESPONSE_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full border-t border-modifier-border bg-primary">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm rounded px-2 py-1 max-w-full break-words ${msg.role === "user" ? "bg-accent text-right ml-auto" : "bg-secondary mr-auto"}`}
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
          <div className="text-xs text-faint text-center">{t('LOADING')}</div>
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
              title={t('ADD_IMAGE')}
              dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }}
            />
            {showMenu && (
              <div className="absolute bottom-full left-0 mb-1 flex flex-col bg-secondary border border-modifier-border rounded z-10">
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-modifier-hover text-left flex items-center"
                  onClick={() => openFileDialog('image')}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  {t('ADD_IMAGE')}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-modifier-hover text-left flex items-center"
                  onClick={() => openFileDialog('mask')}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />
                  {t('ADD_MASK')}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-sm hover:bg-modifier-hover text-left flex items-center"
                  onClick={() => openFileDialog('reference')}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
                  {t('ADD_CHARACTER_DESIGN')}
                </button>
              </div>
            )}
          </div>
          <input
            className="flex-1 rounded border border-modifier-border bg-primary text-text-normal px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('INPUT_PLACEHOLDER')}
          />
          <button
            type="submit"
            className="py-1 px-2 bg-accent text-on-accent rounded hover:bg-accent-hover text-sm"
          >
            {t('SEND')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
