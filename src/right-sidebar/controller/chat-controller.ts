import MyPlugin from 'main';
import { Attachment, RunResult } from '../../agent-module/types';
import { sendChatMessage } from '../../ai/chat';

export class ChatController {
  constructor(private plugin: MyPlugin) {}

  async sendMessage(
    message: string,
    attachments: Attachment[] = [],
    onToken?: (token: string) => void,
  ): Promise<RunResult> {
    return await sendChatMessage(message, this.plugin, onToken, attachments);
  }
}
