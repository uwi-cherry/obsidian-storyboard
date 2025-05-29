import { Tool } from './tool';
import { ToolsConfiguration, ToolConfig } from './tool-config-types';
import { ToolExecutor } from './tool-executor';
import { TOOLS_CONFIG } from '../../constants/tools-config';

namespace Internal {
  export const tools = new Map<string, Tool<any, any>>();
  export const aiEnabledTools = new Set<string>();
  export const config: ToolsConfiguration = TOOLS_CONFIG as ToolsConfiguration;

  export function isValidTool(obj: unknown): obj is Tool {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as any).name === 'string' &&
      typeof (obj as any).description === 'string' &&
      (obj as any).parameters !== undefined &&
      typeof (obj as any).execute === 'function'
    );
  }

  export async function loadToolFromConfig(toolConfig: ToolConfig): Promise<void> {
    try {
      // modulePath は tools-config.ts で定義された相対パス
      const module = await import(toolConfig.modulePath);
      const toolInstance: unknown = module[toolConfig.exportName];

      if (!toolInstance) {
        throw new Error(`Tool not found: ${toolConfig.exportName} in ${toolConfig.modulePath}`);
      }

      if (!isValidTool(toolInstance)) {
        throw new Error(`Invalid tool: ${toolConfig.exportName} for ${toolConfig.name}`);
      }

      const typedTool = toolInstance as Tool;
      registerToolInternal(typedTool);

      if (toolConfig.ai_enabled) {
        aiEnabledTools.add(typedTool.name);
      }

      if (config.config.enableLogging) {
      }
    } catch (error) {
      throw new Error(`Failed to load ${toolConfig.name}: ${error}`);
    }
  }

  export function registerToolInternal(tool: Tool<any, any>): void {
    if (tools.has(tool.name)) {
      if (config.config.enableLogging) {
      }
      return;
    }
    tools.set(tool.name, tool);
    if (config.config.enableLogging) {
    }
  }
}

export class ToolRegistry {
  /**
   * ツールの登録が完了した際に解決される Promise
   */
  readonly ready: Promise<void>;

  constructor() {
    if (Internal.config.config.autoRegister) {
      this.ready = this.autoRegisterTools();
    } else {
      this.ready = Promise.resolve();
    }
  }

  private async autoRegisterTools(): Promise<void> {
    if (Internal.config.config.enableLogging) {
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
        }

        if (Internal.config.config.failOnError) {
          throw new Error(`Tool registration failed for ${toolConfig.name}: ${error}`);
        }
      }
    }

    ToolExecutor.initialize(Internal.tools, Internal.aiEnabledTools, Internal.config);

    if (Internal.config.config.enableLogging) {
    }
  }

  getTool(name: string): Tool<any, any> | undefined {
    return ToolExecutor.getTool(name);
  }

  getAllTools(): Tool<any, any>[] {
    return Array.from(Internal.tools.values());
  }

  getAiEnabledTools(): Tool<any, any>[] {
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

  async executeTool<TInput = Record<string, unknown>, TOutput = string>(
    name: string,
    args: TInput
  ): Promise<TOutput> {
    return ToolExecutor.executeTool<TInput, TOutput>(name, args);
  }

  printToolInfo(): void {
    
    Internal.tools.forEach((tool, name) => {
      const aiEnabled = Internal.aiEnabledTools.has(name);
    });
  }
}

export const toolRegistry = new ToolRegistry(); 
