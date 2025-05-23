import { Tool } from './tool';
import { helloTool } from '../api/hello-tool/action';

// ツールの自動発見用レジストリ
const TOOL_MODULES = [
  helloTool
  // 新しいツールをここに追加するだけでOK
];

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.autoRegisterTools();
  }

  /**
   * Toolインターフェースを実装しているツールを自動登録
   */
  private autoRegisterTools(): void {
    console.log('Starting auto-registration of tools...');
    
    for (const toolCandidate of TOOL_MODULES) {
      if (this.isValidTool(toolCandidate)) {
        this.registerTool(toolCandidate);
      } else {
        console.warn('Invalid tool found in TOOL_MODULES:', toolCandidate);
      }
    }

    console.log(`Auto-registration completed. Registered ${this.tools.size} tools.`);
    console.log('Available tools:', this.getRegisteredToolNames().join(', '));
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
      console.warn(`Tool ${tool.name} is already registered. Skipping.`);
      return;
    }
    this.tools.set(tool.name, tool);
    console.log(`Successfully registered tool: ${tool.name}`);
  }

  /**
   * 外部からのツール動的登録
   */
  registerExternalTool(tool: any): boolean {
    if (this.isValidTool(tool)) {
      this.registerTool(tool);
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

  getRegisteredToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  hasToolRegistered(name: string): boolean {
    return this.tools.has(name);
  }

  async executeTool(name: string, args: any): Promise<string> {
    const tool = this.getTool(name);
    if (!tool) {
      const availableTools = this.getRegisteredToolNames().join(', ');
      throw new Error(`Tool "${name}" not found. Available tools: ${availableTools}`);
    }
    
    try {
      console.log(`Executing tool: ${name} with args:`, args);
      const result = await tool.execute(args);
      console.log(`Tool ${name} executed successfully`);
      return result;
    } catch (error) {
      console.error(`Tool execution failed for "${name}":`, error);
      throw new Error(`Tool execution failed for "${name}": ${error}`);
    }
  }

  /**
   * デバッグ用：登録されたツールの詳細情報を表示
   */
  printToolInfo(): void {
    console.log('\n=== Tool Registry Information ===');
    console.log(`Total registered tools: ${this.tools.size}`);
    
    this.tools.forEach((tool, name) => {
      console.log(`\n- Tool: ${name}`);
      console.log(`  Description: ${tool.description}`);
      console.log(`  Parameters:`, tool.parameters);
    });
    console.log('==================================\n');
  }
}

export const toolRegistry = new ToolRegistry(); 