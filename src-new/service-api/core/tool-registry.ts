import { Tool } from './tool';
import { ToolsConfiguration, ToolConfig } from './tool-config-types';
import { ToolExecutor } from './tool-executor';
import toolsConfig from './tools-config.json';

/**
 * 内部実装 - 外部からアクセス不可
 */
namespace Internal {
  export const tools = new Map<string, Tool>();
  export const aiEnabledTools = new Set<string>();
  export const config: ToolsConfiguration = toolsConfig as ToolsConfiguration;

  /**
   * オブジェクトがToolインターフェースを実装しているかチェック
   */
  export function isValidTool(obj: any): obj is Tool {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           typeof obj.description === 'string' && 
           obj.parameters && 
           typeof obj.execute === 'function';
  }

  /**
   * 設定からツールを動的にロード
   */
  export async function loadToolFromConfig(toolConfig: ToolConfig): Promise<void> {
    try {
      // 動的インポート
      const module = await import(toolConfig.modulePath);
      const toolInstance = module[toolConfig.exportName];

      if (!isValidTool(toolInstance)) {
        throw new Error(`Invalid tool: ${toolConfig.exportName} from ${toolConfig.modulePath}`);
      }

      // ツール名の検証
      if (toolInstance.name !== toolConfig.name) {
        console.warn(`Tool name mismatch: config="${toolConfig.name}", actual="${toolInstance.name}"`);
      }

      registerToolInternal(toolInstance);
      
      // AI有効フラグの管理
      if (toolConfig.ai_enabled) {
        aiEnabledTools.add(toolInstance.name);
      }

      if (config.config.enableLogging) {
        console.log(`Loaded tool: ${toolInstance.name} (AI: ${toolConfig.ai_enabled})`);
      }
    } catch (error) {
      throw new Error(`Failed to load ${toolConfig.name}: ${error}`);
    }
  }

  /**
   * ツールを内部登録
   */
  export function registerToolInternal(tool: Tool): void {
    if (tools.has(tool.name)) {
      if (config.config.enableLogging) {
        console.warn(`Tool ${tool.name} is already registered. Skipping.`);
      }
      return;
    }
    tools.set(tool.name, tool);
    if (config.config.enableLogging) {
      console.log(`Successfully registered tool: ${tool.name}`);
    }
  }
}

/**
 * 公開API - ツールレジストリ
 */
export class ToolRegistry {
  constructor() {
    if (Internal.config.config.autoRegister) {
      this.autoRegisterTools();
    }
  }

  /**
   * コンフィグファイルに基づいてツールを自動登録
   */
  private async autoRegisterTools(): Promise<void> {
    if (Internal.config.config.enableLogging) {
      console.log('Starting config-based tool registration...');
    }
    
    let successCount = 0;
    let errorCount = 0;

    for (const toolConfig of Internal.config.tools) {
      try {
        await Internal.loadToolFromConfig(toolConfig);
        successCount++;
      } catch (error) {
        errorCount++;
        if (Internal.config.config.enableLogging) {
          console.error(`Failed to load tool ${toolConfig.name}:`, error);
        }
        
        if (Internal.config.config.failOnError) {
          throw new Error(`Tool registration failed for ${toolConfig.name}: ${error}`);
        }
      }
    }

    // ToolExecutorを初期化
    ToolExecutor.initialize(Internal.tools, Internal.aiEnabledTools, Internal.config);

    if (Internal.config.config.enableLogging) {
      console.log(`Tool registration completed. Success: ${successCount}, Errors: ${errorCount}`);
      console.log('Available tools:', this.getRegisteredToolNames().join(', '));
      console.log('AI-enabled tools:', Array.from(Internal.aiEnabledTools).join(', '));
    }
  }

  getTool(name: string): Tool | undefined {
    return ToolExecutor.getTool(name);
  }

  getAllTools(): Tool[] {
    return Array.from(Internal.tools.values());
  }

  /**
   * AI有効なツールのみを取得
   */
  getAiEnabledTools(): Tool[] {
    return this.getAllTools().filter(tool => Internal.aiEnabledTools.has(tool.name));
  }

  getRegisteredToolNames(): string[] {
    return Array.from(Internal.tools.keys());
  }

  getAiEnabledToolNames(): string[] {
    return Array.from(Internal.aiEnabledTools);
  }

  hasToolRegistered(name: string): boolean {
    return ToolExecutor.hasToolRegistered(name);
  }

  isAiEnabled(name: string): boolean {
    return ToolExecutor.isAiEnabled(name);
  }

  async executeTool(name: string, args: any): Promise<string> {
    return ToolExecutor.executeTool(name, args);
  }

  /**
   * デバッグ用：登録されたツールの詳細情報を表示
   */
  printToolInfo(): void {
    console.log('\n=== Tool Registry Information ===');
    console.log(`Total registered tools: ${Internal.tools.size}`);
    console.log(`AI-enabled tools: ${Internal.aiEnabledTools.size}`);
    
    Internal.tools.forEach((tool, name) => {
      const aiEnabled = Internal.aiEnabledTools.has(name);
      console.log(`\n- Tool: ${name} ${aiEnabled ? '[AI]' : '[Manual]'}`);
      console.log(`  Description: ${tool.description}`);
      console.log(`  Parameters:`, tool.parameters);
    });
    console.log('==================================\n');
  }
}

// 公開インスタンス
export const toolRegistry = new ToolRegistry(); 