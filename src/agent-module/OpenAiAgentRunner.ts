import { ChatMessage, RunResult, RunResultStreaming, Attachment } from './types';
import { OpenAiAgent } from './OpenAiAgent';

function buildApiMessages(messages: ChatMessage[]) {
  return messages.map(({ role, content, name, attachments }) => {
    if (attachments && attachments.length > 0) {
      const parts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
      if (content) parts.push({ type: 'text', text: content });
      for (const att of attachments) {
        parts.push({ type: 'image_url', image_url: { url: att.url } });
      }
      return { role, content: parts, name };
    }
    return { role, content, name };
  });
}

/**
 * OpenAiAgent を実行するユーティリティ。
 * Python Agents SDK の Runner.run / run_sync / run_streamed を模倣。
 */
export class OpenAiAgentRunner {
  /** 非同期フル実行 */
  static async run(
    agent: OpenAiAgent,
    userMessage: string,
    history: ChatMessage[] = [],
    attachments: Attachment[] = [],
  ): Promise<RunResult> {
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.instructions },
      ...history,
      { role: 'user', content: userMessage, attachments },
    ];
    const toolLogs: { name: string; args: unknown; result: string }[] = [];

    for (let turn = 0; turn < agent.maxTurns; turn++) {
      const payload = this.buildPayload(agent, messages, false);
      // ===== DEBUG LOG =====
      console.info('[OpenAiAgentRunner] turn', turn, 'payload', payload);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agent.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`OpenAI API Error: ${await res.text()}`);
      }
      const data = await res.json();
      console.info('[OpenAiAgentRunner] response', data);
      const msg = data.choices[0].message as ChatMessage;

      if (msg.function_call) {
        const tool = agent.tools.find((t) => t.name === msg.function_call!.name);
        if (tool) {
          console.info('[OpenAiAgentRunner] function_call detected', msg.function_call);
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(msg.function_call!.arguments || '{}');
          } catch {
            /* noop */
          }
          let final: string;
          try {
            final = await tool.execute(args);
            console.info('[OpenAiAgentRunner] tool result', final);
          } catch (err: any) {
            final = `Tool execution error: ${err?.message ?? err}`;
            console.error('[OpenAiAgentRunner] tool error', err);
          }
          // function ロールとして履歴に追加
          messages.push({ role: 'function', name: msg.function_call!.name, content: final });
          toolLogs.push({ name: msg.function_call!.name, args, result: final });

          // 直ちにユーザーへ返す
          console.info('[OpenAiAgentRunner] returning after tool execution');
          return {
            finalOutput: final,
            turns: turn + 1,
            history: messages,
            toolCalls: toolLogs,
          };
        }
      }

      const content = msg.content?.trim();
      if (content) {
        return { finalOutput: content, turns: turn + 1, history: messages, toolCalls: toolLogs };
      }
    }
    return { finalOutput: null, turns: agent.maxTurns, history: messages, toolCalls: toolLogs };
  }

  /** 同期版 (内部で run を await) */
  static async runSync(
    agent: OpenAiAgent,
    userMessage: string,
    history: ChatMessage[] = [],
    attachments: Attachment[] = [],
  ): Promise<RunResult> {
    return await this.run(agent, userMessage, history, attachments);
  }

  /** payload生成共通処理 */
  private static buildPayload(
    agent: OpenAiAgent,
    messages: ChatMessage[],
    stream: boolean,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      model: agent.model,
      ...(stream ? { stream: true } : {}),
      messages: buildApiMessages(messages),
      max_tokens: agent.maxTokens,
      temperature: agent.temperature,
      ...(agent.modelSettings.stopSequences?.length
        ? { stop: agent.modelSettings.stopSequences }
        : {}),
    };
    if (agent.tools.length) {
      Object.assign(payload, {
        functions: agent.buildFunctions(),
        function_call: 'auto',
      });
    }
    return payload;
  }

  /** ストリーミング実行。tokenごとに onToken が呼ばれる。*/
  static async runStreamed(
    agent: OpenAiAgent,
    userMessage: string,
    onToken: (token: string) => void,
    history: ChatMessage[] = [],
    attachments: Attachment[] = [],
  ): Promise<RunResultStreaming> {
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.instructions },
      ...history,
      { role: 'user', content: userMessage, attachments },
    ];
    const toolLogs: { name: string; args: unknown; result: string }[] = [];

    const payload = this.buildPayload(agent, messages, true);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agent.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok || !res.body) {
      throw new Error(`OpenAI API Error: ${res.status}`);
    }

    const stream = res.body!; // res.body は null ではないと既に確認済み
    let finalOutput = '';
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const reader = stream.getReader();
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const l of lines) {
          const line = l.trim();
          if (!line) continue;
          if (line === 'data: [DONE]') {
            buffer = '';
            done = true;
            break;
          }
          if (line.startsWith('data: ')) {
            const json = line.slice(6);
            try {
              const parsed = JSON.parse(json);
              const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                onToken(delta);
                finalOutput += delta;
              }
            } catch {
              /* JSON parse error */
            }
          }
        }
      }
    }

    return { finalOutput, turns: 1, history: messages, toolCalls: toolLogs, onToken };
  }

  /**
   * function_call対応ストリーミング: assistant deltaをonTokenで返し、途中でfunction_callが来たら即中断→ツール実行→再開
   */
  static async runStreamedWithTools(
    agent: OpenAiAgent,
    userMessage: string,
    onToken: (token: string) => void,
    history: ChatMessage[] = [],
    attachments: Attachment[] = []
  ): Promise<{ finalOutput: string, history: ChatMessage[], toolCalls: { name: string; args: unknown; result: string }[] }> {
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.instructions },
      ...history,
      { role: 'user', content: userMessage, attachments },
    ];
    let finalOutput = '';
    const toolCalls: { name: string; args: unknown; result: string }[] = [];

    for (;;) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agent.apiKey}`,
        },
        body: JSON.stringify(this.buildPayload(agent, messages, true)),
      });
      if (!res.ok || !res.body) {
        throw new Error(`OpenAI API Error: ${res.status}`);
      }

      const stream = res.body;
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let functionCall: { name: string, arguments: string } | null = null;
      let functionCallArgs = '';
      let functionCallName = '';
      let done = false;
      const reader = stream.getReader();
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const l of lines) {
            const line = l.trim();
            if (!line) continue;
            if (line === 'data: [DONE]') {
              buffer = '';
              done = true;
              break;
            }
            if (line.startsWith('data: ')) {
              const json = line.slice(6);
              try {
                const parsed = JSON.parse(json);
                const delta = parsed.choices?.[0]?.delta;
                // function_call delta
                if (delta?.function_call) {
                  if (delta.function_call.name) functionCallName = delta.function_call.name;
                  if (delta.function_call.arguments) functionCallArgs += delta.function_call.arguments;
                  functionCall = { name: functionCallName, arguments: functionCallArgs };
                  // function_callが来たら即中断
                  await reader.cancel();
                  done = true;
                  break;
                }
                // assistant content delta
                if (delta?.content) {
                  onToken(delta.content);
                  finalOutput += delta.content;
                }
              } catch { /* JSON parse error */ }
            }
          }
        }
      }
      // function_callが来た場合
      if (functionCall) {
        const tool = agent.tools.find(t => t.name === functionCall!.name);
        let toolResult = '';
        let args: Record<string, unknown> = {};
        if (tool) {
          try {
            args = JSON.parse(functionCall.arguments || '{}');
            toolResult = await tool.execute(args);
          } catch (e) {
            toolResult = `Tool execution error: ${e}`;
          }
        } else {
          toolResult = 'Tool not found';
        }
        toolCalls.push({ name: functionCall.name, args, result: toolResult });
        // functionロールでmessagesに追加し、再度APIに投げて続きをstream
        messages.push({ role: 'function', name: functionCall.name, content: toolResult });
        // 続きをループ
        continue;
      } else {
        // function_callがなければ最終出力
        return { finalOutput, history: messages, toolCalls };
      }
    }
  }
}
