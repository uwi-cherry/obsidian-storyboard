import MyPlugin from "main";
import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "src/ai/chat";
import { t } from "src/i18n";

interface ChatBoxProps {
  plugin?: MyPlugin;
}

function getGlobalPlugin(): MyPlugin | undefined {
  // @ts-ignore
  return window.__psdPainterPlugin;
}

const ChatBox: React.FC<ChatBoxProps> = ({ plugin }) => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input.trim()) return;
    const userMessage = input;
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    // プレースホルダの assistant メッセージを用意
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setInput("");
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
      <form onSubmit={handleSend} className="flex flex-col p-2 border-t border-modifier-border w-full gap-2">
        <input
          className="w-full rounded border border-modifier-border bg-primary text-text-normal px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('INPUT_PLACEHOLDER')}
        />
        <button
          type="submit"
          className="w-full py-1 bg-accent text-on-accent rounded hover:bg-accent-hover text-sm"
        >
          {t('SEND')}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
