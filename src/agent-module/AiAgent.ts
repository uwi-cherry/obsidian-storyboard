import { Tool, JsonSchema, ModelSettings, Guardrail } from './types';

export type Provider = 'fal' | 'replicate';

/**
 * JSON Schema for function parameters. fal.ai API expects a JSON-Schema object.
 */
// JsonSchema & Tool are now imported from shared types

export interface AgentOptions {
  apiKey: string;
  provider: Provider;
  name?: string;
  instructions?: string;
  model?: string;
  modelSettings?: ModelSettings; // 追加
  maxTokens?: number; // TODO: deprecated, modelSettings.maxTokens を推奨
  temperature?: number; // TODO: deprecated, modelSettings.temperature を推奨
  tools?: Tool[];
  /** 言語や条件に応じて別エージェントへ委譲する際の候補 */
  handoffs?: AiAgent[];
  /** 最大ターン数（無限ループ防止） */
  maxTurns?: number;
  /** 追加のガードレール */
  guardrails?: Guardrail[];
}

/**
 * チャットメッセージ型定義
 */
// 既存 ChatMessage 型定義は types.ts に移動

export class AiAgent {
  public readonly apiKey: string;
  public readonly provider: Provider;
  public readonly name: string;
  public readonly instructions: string;
  public readonly model: string;
  public readonly modelSettings: ModelSettings;
  public readonly maxTokens: number;
  public readonly temperature: number;
  public readonly tools: Tool[];
  public readonly handoffs: AiAgent[];
  /** ループ上限 */
  public readonly maxTurns: number;
  public readonly guardrails: Guardrail[];

  constructor(options: AgentOptions) {
    this.apiKey = options.apiKey;
    this.provider = options.provider;
    this.name = options.name ?? 'Assistant';
    this.instructions = options.instructions ?? 'You are a helpful assistant.';
    this.model = options.model ?? 'gpt-4o';
    this.modelSettings = options.modelSettings ?? {
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    };
    this.maxTokens = this.modelSettings.maxTokens ?? 512;
    this.temperature = this.modelSettings.temperature ?? 0.8;
    this.tools = options.tools ?? [];
    this.handoffs = options.handoffs ?? [];
    this.maxTurns = options.maxTurns ?? 5;
    this.guardrails = options.guardrails ?? [];
  }

  /**
   * API呼び出しで利用するfunctions配列を生成
   */
  public buildFunctions(): Array<{ name: string; description: string; parameters: JsonSchema }> {
    return this.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters ?? {},
    }));
  }
}

// --- AiAgentRunner moved to separate file ---
