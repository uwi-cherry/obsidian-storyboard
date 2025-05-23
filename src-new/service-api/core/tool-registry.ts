import { Tool } from './tool';
import { ToolsConfiguration, ToolConfig } from './tool-config-types';
import toolsConfig from './tools-config.json';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private aiEnabledTools: Set<string> = new Set();
  private config: ToolsConfiguration;

  constructor() {
    this.config = toolsConfig as ToolsConfiguration;
    if (this.config.config.autoRegister) {
      this.autoRegisterTools();
    }
  }

  /**
   * コンフィグファイルに基づいてツールを自動登録
   */
  private async autoRegisterTools(): Promise<void> {
    if (this.config.config.enableLogging) {
      console.log('Starting config-based tool registration...');
    }
    
    let successCount = 0;
    let errorCount = 0;

    for (const toolConfig of this.config.tools) {
      try {
        await this.loadToolFromConfig(toolConfig);
        successCount++;
      } catch (error) {
        errorCount++;
        if (this.config.config.enableLogging) {
          console.error(`Failed to load tool ${toolConfig.name}:`, error);
        }
        
        if (this.config.config.failOnError) {
          throw new Error(`Tool registration failed for ${toolConfig.name}: ${error}`);
        }
      }
    }

    if (this.config.config.enableLogging) {
      console.log(`Tool registration completed. Success: ${successCount}, Errors: ${errorCount}`);
      console.log('Available tools:', this.getRegisteredToolNames().join(', '));
      console.log('AI-enabled tools:', Array.from(this.aiEnabledTools).join(', '));
    }
  }

  /**
   * 設定からツールを動的にロード
   */
  private async loadToolFromConfig(toolConfig: ToolConfig): Promise<void> {
    try {
      // 動的インポート
      const module = await import(toolConfig.modulePath);
      const toolInstance = module[toolConfig.exportName];

      if (!this.isValidTool(toolInstance)) {
        throw new Error(`Invalid tool: ${toolConfig.exportName} from ${toolConfig.modulePath}`);
      }

      // ツール名の検証
      if (toolInstance.name !== toolConfig.name) {
        console.warn(`Tool name mismatch: config="${toolConfig.name}", actual="${toolInstance.name}"`);
      }

      this.registerTool(toolInstance);
      
      // AI有効フラグの管理
      if (toolConfig.ai_enabled) {
        this.aiEnabledTools.add(toolInstance.name);
      }

      if (this.config.config.enableLogging) {
        console.log(`Loaded tool: ${toolInstance.name} (AI: ${toolConfig.ai_enabled})`);
      }
    } catch (error) {
      throw new Error(`Failed to load ${toolConfig.name}: ${error}`);
    }
  }

  /**
   * オブジェクトがToolインターフェースを実装しているかチェック
   */
  private isValidTool(obj: any): obj is Tool {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           typeof obj.description === 'string' && 
           obj.parameters && 
           typeof obj.execute === 'function';
  }

  /**
   * ツールを登録
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      if (this.config.config.enableLogging) {
        console.warn(`Tool ${tool.name} is already registered. Skipping.`);
      }
      return;
    }
    this.tools.set(tool.name, tool);
    if (this.config.config.enableLogging) {
      console.log(`Successfully registered tool: ${tool.name}`);
    }
  }

  /**
   * 外部からのツール動的登録
   */
  registerExternalTool(tool: any, aiEnabled: boolean = false): boolean {
    if (this.isValidTool(tool)) {
      this.registerTool(tool);
      if (aiEnabled) {
        this.aiEnabledTools.add(tool.name);
      }
      return true;
    }
    console.error('Invalid tool provided for registration:', tool);
    return false;
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * AI有効なツールのみを取得
   */
  getAiEnabledTools(): Tool[] {
    return this.getAllTools().filter(tool => this.aiEnabledTools.has(tool.name));
  }

  getRegisteredToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getAiEnabledToolNames(): string[] {
    return Array.from(this.aiEnabledTools);
  }

  hasToolRegistered(name: string): boolean {
    return this.tools.has(name);
  }

  isAiEnabled(name: string): boolean {
    return this.aiEnabledTools.has(name);
  }

  async executeTool(name: string, args: any): Promise<string> {
    const tool = this.getTool(name);
    if (!tool) {
      const availableTools = this.getRegisteredToolNames().join(', ');
      throw new Error(`Tool "${name}" not found. Available tools: ${availableTools}`);
    }
    
    try {
      if (this.config.config.enableLogging) {
        console.log(`Executing tool: ${name} with args:`, args);
      }
      const result = await tool.execute(args);
      if (this.config.config.enableLogging) {
        console.log(`Tool ${name} executed successfully`);
      }
      return result;
    } catch (error) {
      if (this.config.config.enableLogging) {
        console.error(`Tool execution failed for "${name}":`, error);
      }
      throw new Error(`Tool execution failed for "${name}": ${error}`);
    }
  }

  /**
   * デバッグ用：登録されたツールの詳細情報を表示
   */
  printToolInfo(): void {
    console.log('\n=== Tool Registry Information ===');
    console.log(`Total registered tools: ${this.tools.size}`);
    console.log(`AI-enabled tools: ${this.aiEnabledTools.size}`);
    
    this.tools.forEach((tool, name) => {
      const aiEnabled = this.aiEnabledTools.has(name);
      console.log(`\n- Tool: ${name} ${aiEnabled ? '[AI]' : '[Manual]'}`);
      console.log(`  Description: ${tool.description}`);
      console.log(`  Parameters:`, tool.parameters);
    });
    console.log('==================================\n');
  }
}

export const toolRegistry = new ToolRegistry(); 