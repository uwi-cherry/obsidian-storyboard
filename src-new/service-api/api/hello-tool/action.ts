import { Tool } from '../../core/tool';

/**
 * Hello Tool - 基本的な挨拶ツール
 */
export interface HelloToolInput {
  /** 挨拶する相手の名前 */
  name?: string;
}

/**
 * Hello Tool のメタデータ
 */
export const HELLO_TOOL_METADATA = {
  name: 'hello_tool',
  description: 'Simple hello world tool',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name to greet'
      }
    },
    required: []
  }
} as const;

/**
 * Hello Tool の実装
 */
export async function executeHelloTool(args: HelloToolInput): Promise<string> {
  const { name = 'World' } = args;
  return `Hello, ${name}!`;
}

/**
 * Hello Tool のファクトリー関数
 * リフレクションシステムから呼び出される
 */
export const helloTool: Tool<HelloToolInput> = {
  name: 'hello_tool',
  description: 'Simple hello world tool',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name to greet'
      }
    },
    required: []
  },
  execute: executeHelloTool
};