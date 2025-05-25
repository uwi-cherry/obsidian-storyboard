import { Tool } from './tool';
import { ToolsConfiguration } from './tool-config-types';

namespace Internal {
  export let config: ToolsConfiguration;
  export let tools: Map<string, Tool>;
  export let aiEnabledTools: Set<string>;

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

export class ToolExecutor {
  
  static initialize(
    tools: Map<string, Tool>, 
    aiEnabledTools: Set<string>, 
    config: ToolsConfiguration
  ): void {
    Internal.initialize(tools, aiEnabledTools, config);
  }

  static async executeTool(name: string, args: any): Promise<string> {
    const tool = Internal.tools.get(name);
    if (!tool) {
      const availableTools = Array.from(Internal.tools.keys()).join(', ');
      throw new Error(`Tool "${name}" not found. Available tools: ${availableTools}`);
    }
    
    try {
      if (Internal.config.config.enableLogging) {
      }
      const result = await tool.execute(args);
      if (Internal.config.config.enableLogging) {
      }
      return result;
    } catch (error) {
      if (Internal.config.config.enableLogging) {
      }
      throw new Error(`Tool execution failed for "${name}": ${error}`);
    }
  }

  static isAiEnabled(name: string): boolean {
    return Internal.aiEnabledTools.has(name);
  }

  static hasToolRegistered(name: string): boolean {
    return Internal.tools.has(name);
  }

  static getTool(name: string): Tool | undefined {
    return Internal.tools.get(name);
  }
} 
