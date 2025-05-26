import type MyPlugin from '../../../../main';
import { loadSettings } from '../../../obsidian-api/settings/settings-data';
import { initAgent, AgentState, Attachment, ChatMessage } from '../agent-tool/init-agent';
import { runAgent } from '../agent-tool/run-agent';
import { getAgentHistory } from '../agent-tool/get-agent-history';

const chatHistory: ChatMessage[] = [];
let currentAttachments: Attachment[] = [];

export function getCurrentAttachments(): Attachment[] {
  return currentAttachments;
}

export function clearChatHistory() {
  chatHistory.length = 0;
}

export async function generateText(
  userMessage: string,
  plugin?: MyPlugin,
  onToken?: (token: string) => void,
  attachments: Attachment[] = [],
): Promise<{ finalOutput: string; history: ChatMessage[] }> {
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

  const agent: AgentState = initAgent({
    apiKey,
    provider,
    instructions:
      'あなたは親切なアシスタントです。' +
      '\nユーザーは画像を添付することがあります。' +
      '\nimage は編集対象、mask はインペイント領域、reference は参考画像を表します。' +
      '\n必要に応じて edit_image_from_attachments ツールを呼び出して画像を生成してください。',
  });

  const result = await runAgent(agent, userMessage, chatHistory, attachments, onToken);
  return { finalOutput: result, history: getAgentHistory(agent) };
}
