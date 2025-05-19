import type MyPlugin from '../../main';
import { loadAiSettings } from '../settings/settings';
import { OpenAiAgent } from '../agent/OpenAiAgent';
import { OpenAiAgentRunner } from '../agent/OpenAiAgentRunner';
import { RunResult, ChatMessage } from '../agent/types';
import { aiTools } from './tools';

// ==============================================
// 会話履歴（モジュールスコープに保持）
// ==============================================

const chatHistory: ChatMessage[] = [];

/**
 * 会話履歴をクリア
 */
export function clearChatHistory() {
  chatHistory.length = 0;
}

/**
 * ユーザーの入力をAIに送信し、応答を取得する
 * @param userMessage ユーザーのメッセージ
 * @param plugin Obsidianプラグインインスタンス
 * @param onToken トークンを受信したときに呼び出されるコールバック関数
 * @returns AIの返答メッセージ
 */
export async function sendChatMessage(
  userMessage: string,
  plugin?: MyPlugin,
  onToken?: (token: string) => void,
): Promise<RunResult> {
  if (!plugin) {
    throw new Error('プラグインインスタンスが取得できませんでした');
  }
  const settings = await loadAiSettings(plugin);
  const apiKey = settings.apiKey;
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。設定画面で入力してください。');
  }

  const agent = new OpenAiAgent({
    apiKey,
    instructions: 'あなたは親切なアシスタントです。',
    tools: aiTools,
    // model, maxTokens, temperature は必要に応じて設定可能
  });

  // --- function_call判定のための1トークンお試しリクエスト ---
  if (!!onToken) {
    // 1. まず max_tokens=1 で非ストリーミングAPIを叩く
    const agentForCheck = new OpenAiAgent({
      ...agent,
      maxTokens: 1,
    });
    const checkResult = await OpenAiAgentRunner.run(agentForCheck, userMessage, chatHistory);
    const lastMsg = checkResult.history[checkResult.history.length - 1];
    const isFunctionCall = lastMsg && lastMsg.role === 'function';

    if (!isFunctionCall) {
      // function_callでなければストリーミングで返す
      return await OpenAiAgentRunner.runStreamed(agent, userMessage, onToken, chatHistory);
    }
    // function_callなら通常runで返す（ツール実行）
    return await OpenAiAgentRunner.run(agent, userMessage, chatHistory);
  } else {
    // onToken無し（ストリーミング不要）なら従来通り
    return await OpenAiAgentRunner.run(agent, userMessage, chatHistory);
  }
}
