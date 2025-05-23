import type MyPlugin from '../../main';
import { loadSettings } from '../settings/settings';
import { AiAgent } from '../agent-module/AiAgent';
import { AiAgentRunner } from '../agent-module/AiAgentRunner';
import { RunResult, ChatMessage, Attachment } from '../agent-module/types';
import { aiTools } from './tools';

// ==============================================
// 会話履歴（モジュールスコープに保持）
// ==============================================

const chatHistory: ChatMessage[] = [];
// 現在のユーザー添付画像を保持
let currentAttachments: Attachment[] = [];

export function getCurrentAttachments(): Attachment[] {
  return currentAttachments;
}

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
  attachments: Attachment[] = [],
): Promise<RunResult> {
  currentAttachments = attachments;
  if (!plugin) {
    throw new Error('プラグインインスタンスが取得できませんでした');
  }
  const settings = await loadSettings(plugin);
  const provider = settings.provider;
  const apiKey = provider === 'fal' ? settings.falApiKey : settings.replicateApiKey;
  if (!apiKey) {
    throw new Error(`${provider} APIキーが設定されていません。設定画面で入力してください。`);
  }

  const agent = new AiAgent({
    apiKey,
    provider,
    instructions:
      'あなたは親切なアシスタントです。' +
      '\nユーザーは画像を添付することがあります。' +
      '\nimage は編集対象、mask はインペイント領域、reference は参考画像を表します。' +
      '\n必要に応じて edit_image_from_attachments ツールを呼び出して画像を生成してください。',
    tools: aiTools,
    // model, maxTokens, temperature は必要に応じて設定可能
  });

  // --- function_call判定のための1トークンお試しリクエスト ---
  if (onToken) {
    // 1. まず max_tokens=1 で非ストリーミングAPIを叩く
    const agentForCheck = new AiAgent({
      ...agent,
      maxTokens: 1,
    });
    const checkResult = await AiAgentRunner.run(agentForCheck, userMessage, chatHistory, attachments);
    const lastMsg = checkResult.history[checkResult.history.length - 1];
    const isFunctionCall = lastMsg && lastMsg.role === 'function';

    if (!isFunctionCall) {
      // function_callでなければストリーミングで返す
      return await AiAgentRunner.runStreamed(agent, userMessage, onToken, chatHistory, attachments);
    }
    // function_callなら通常runで返す（ツール実行）
    return await AiAgentRunner.run(agent, userMessage, chatHistory, attachments);
  } else {
    // onToken無し（ストリーミング不要）なら従来通り
    return await AiAgentRunner.run(agent, userMessage, chatHistory, attachments);
  }
}
