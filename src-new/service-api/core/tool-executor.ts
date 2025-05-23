import { Tool } from './tool';
import { ToolsConfiguration } from './tool-config-types';

/**
 * 内部実装 - ツール実行ロジック
 */
namespace Internal {
  export let config: ToolsConfiguration;
  export let tools: Map<string, Tool>;
  export let aiEnabledTools: Set<string>;

  /**
   * 内部状態を初期化
   */
  export function initialize(
    toolsMap: Map<string, Tool>, 
    aiToolsSet: Set<string>, 
    configuration: ToolsConfiguration
  ): void {
    tools = toolsMap;
    aiEnabledTools = aiToolsSet;
    config = configuration;
  }
}

/**
 * ツール実行エンジン
 */
export class ToolExecutor {
  /**
   * 内部状態を初期化
   */
  static initialize(
    tools: Map<string, Tool>, 
    aiEnabledTools: Set<string>, 
    config: ToolsConfiguration
  ): void {
    Internal.initialize(tools, aiEnabledTools, config);
  }

  /**
   * ツールを実行
   */
  static async executeTool(name: string, args: any): Promise<string> {
    const tool = Internal.tools.get(name);
    if (!tool) {
      const availableTools = Array.from(Internal.tools.keys()).join(', ');
      throw new Error(`Tool "${name}" not found. Available tools: ${availableTools}`);
    }
    
    try {
      if (Internal.config.config.enableLogging) {
        console.log(`Executing tool: ${name} with args:`, args);
      }
      const result = await tool.execute(args);
      if (Internal.config.config.enableLogging) {
        console.log(`Tool ${name} executed successfully`);
      }
      return result;
    } catch (error) {
      if (Internal.config.config.enableLogging) {
        console.error(`Tool execution failed for "${name}":`, error);
      }
      throw new Error(`Tool execution failed for "${name}": ${error}`);
    }
  }

  /**
   * AI有効なツールかチェック
   */
  static isAiEnabled(name: string): boolean {
    return Internal.aiEnabledTools.has(name);
  }

  /**
   * ツールが存在するかチェック
   */
  static hasToolRegistered(name: string): boolean {
    return Internal.tools.has(name);
  }

  /**
   * ツール詳細を取得
   */
  static getTool(name: string): Tool | undefined {
    return Internal.tools.get(name);
  }
} 