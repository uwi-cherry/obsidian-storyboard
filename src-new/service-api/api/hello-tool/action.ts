import { Tool } from '../../core/tool';

/**
 * 内部実装 - サービスAPI内部でのみ使用
 */
namespace Internal {
  /**
   * Hello Tool の入力型
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
   * Hello Tool の実行関数
   */
  export async function executeHelloTool(args: HelloToolInput): Promise<string> {
    const { name = 'World' } = args;
    return `Hello, ${name}!`;
  }
}

/**
 * 外部公開用のツール定義
 * リフレクションシステムでのみ使用される
 */
export const helloTool: Tool<Internal.HelloToolInput> = {
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
  execute: Internal.executeHelloTool
};