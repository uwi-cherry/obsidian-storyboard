// Common type definitions for the custom Agent SDK clone

/**
 * Very loose JSON-Schema representation. For stricter type-safety you could
 * replace this with `zod` or `json-schema-to-ts` etc.
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Function-calling tool definition (fal.ai "function" tool).
 */
export interface Tool<TInput = Record<string, unknown>> {
  /** Unique function name (<50 chars, snake_case) */
  name: string;
  /** Natural-language description presented to the model */
  description: string;
  /** JSON-Schema describing `args` */
  parameters: JsonSchema;
  /** Actual implementation */
  execute: (args: TInput) => Promise<string>;
}

export interface ModelSettings {
  /** 使用するモデル名 ("gpt-4o", "gpt-3.5-turbo" など) */
  model?: string;
  /** 出力トークン数上限 */
  maxTokens?: number;
  /** 温度 */
  temperature?: number;
  /** nucleus sampling */
  topP?: number;
  /** frequency_penalty */
  frequencyPenalty?: number;
  /** presence_penalty */
  presencePenalty?: number;
  /** モデルが応答を停止するトークン列 */
  stopSequences?: string[];
  // TODO: 他パラメータ
}

/**
 * チャットメッセージ型定義（共有）
 */
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'function';
  content?: string;
  name?: string;
  function_call?: { name: string; arguments: string };
  attachments?: Attachment[];
};

export interface Attachment {
  type: 'image' | 'mask' | 'reference';
  /** base64 または URL */
  url: string;
}

/**
 * ガードレール関数の型。true を返した場合は通過。
 * false または Error を throw した場合は違反とみなす。
 */
export type Guardrail<TContext = unknown> = (context: TContext) => Promise<boolean> | boolean;

/** Agent ループ終了後の結果 */
export interface RunResult {
  /** 最終的な LLM からのアウトプット */
  finalOutput: string | null;
  /** 完了までのターン数 */
  turns: number;
  /** LLM との全メッセージ履歴 */
  history: ChatMessage[];
  /** 呼び出されたツールのログ */
  toolCalls: { name: string; args: unknown; result: string }[];
}

/** ストリーミング版 RunResult */
export interface RunResultStreaming extends RunResult {
  /** onToken コールバックが登録されている場合は都度呼び出す */
  onToken?: (token: string) => void;
}
