import MyPlugin from 'main';
import { Attachment, RunResult } from '../agent-module/types';
import { sendChatMessage } from '../ai/chat';

export interface IChatService {
    sendMessage(
        message: string,
        attachments?: Attachment[],
        onToken?: (token: string) => void
    ): Promise<RunResult>;
}

export class ChatService implements IChatService {
    constructor(private plugin: MyPlugin) {}

    async sendMessage(
        message: string,
        attachments: Attachment[] = [],
        onToken?: (token: string) => void
    ): Promise<RunResult> {
        return await sendChatMessage(message, this.plugin, onToken, attachments);
    }
}
