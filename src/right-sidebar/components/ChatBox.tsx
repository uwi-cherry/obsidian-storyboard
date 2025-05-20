import MyPlugin from "main";
import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "src/ai/chat";

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
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' }
    ]);
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
      setError(err.message || "AI応答エラー");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full border-t border-gray-300 bg-white dark:bg-gray-800">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm rounded px-2 py-1 max-w-full break-words ${msg.role === "user" ? "bg-blue-100 text-right ml-auto" : "bg-gray-200 mr-auto"}`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-gray-400 text-center">AIが応答中...</div>
        )}
        {error && (
          <div className="text-xs text-red-500 text-center">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex flex-col p-2 border-t border-gray-200 w-full gap-2">
        <input
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力..."
        />
        <button
          type="submit"
          className="w-full py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          送信
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
