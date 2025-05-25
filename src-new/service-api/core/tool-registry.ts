import { Tool } from './tool';
import { ToolsConfiguration, ToolConfig } from './tool-config-types';
import { ToolExecutor } from './tool-executor';
import { TOOLS_CONFIG, TOOL_NAMES } from '../../constants/tools-config';

import { createStoryboardFileTool } from '../api/storyboard-tool/create-storyboard-file';
import { renameFileExtensionTool } from "../api/storyboard-tool/rename-file-extension";
import { toggleStoryboardViewTool } from '../api/storyboard-tool/toggle-storyboard-view';
import { loadStoryboardDataTool } from '../api/storyboard-tool/load-storyboard-data';
import { saveStoryboardDataTool } from '../api/storyboard-tool/save-storyboard-data';
import { createPainterFileTool } from '../api/painter-tool/create-painter-file';
import { undoPainterTool } from '../api/painter-tool/undo-painter';
import { redoPainterTool } from '../api/painter-tool/redo-painter';
import { loadPainterFileTool } from '../api/painter-tool/load-painter-file';
import { savePainterFileTool } from '../api/painter-tool/save-painter-file';
import { generateThumbnailTool } from '../api/painter-tool/generate-thumbnail';
import { removeLayerTool } from '../api/layer-tool/remove-layer';
import { setLayerOpacityTool } from '../api/layer-tool/set-layer-opacity';
import { setLayerBlendModeTool } from '../api/layer-tool/set-layer-blend-mode';
import { renameLayerTool } from '../api/layer-tool/rename-layer';
import { toggleLayerVisibilityTool } from '../api/layer-tool/toggle-layer-visibility';
import { addLayerTool } from '../api/layer-tool/add-layer';

namespace Internal {
  export const tools = new Map<string, Tool>();
  export const aiEnabledTools = new Set<string>();
  export const config: ToolsConfiguration = TOOLS_CONFIG as ToolsConfiguration;

  export const staticTools: Record<string, Tool> = {
    [TOOL_NAMES.CREATE_STORYBOARD_FILE]: createStoryboardFileTool,
    [TOOL_NAMES.RENAME_FILE_EXTENSION]: renameFileExtensionTool,
    [TOOL_NAMES.TOGGLE_STORYBOARD_VIEW]: toggleStoryboardViewTool,
    [TOOL_NAMES.LOAD_STORYBOARD_DATA]: loadStoryboardDataTool,
    [TOOL_NAMES.SAVE_STORYBOARD_DATA]: saveStoryboardDataTool,
    [TOOL_NAMES.CREATE_PAINTER_FILE]: createPainterFileTool,
    [TOOL_NAMES.LOAD_PAINTER_FILE]: loadPainterFileTool,
    [TOOL_NAMES.SAVE_PAINTER_FILE]: savePainterFileTool,
    [TOOL_NAMES.GENERATE_THUMBNAIL]: generateThumbnailTool,
    [TOOL_NAMES.UNDO_PAINTER]: undoPainterTool,
    [TOOL_NAMES.REDO_PAINTER]: redoPainterTool,
    [TOOL_NAMES.ADD_LAYER]: addLayerTool,
    [TOOL_NAMES.REMOVE_LAYER]: removeLayerTool,
    [TOOL_NAMES.SET_LAYER_OPACITY]: setLayerOpacityTool,
    [TOOL_NAMES.SET_LAYER_BLEND_MODE]: setLayerBlendModeTool,
    [TOOL_NAMES.RENAME_LAYER]: renameLayerTool,
    [TOOL_NAMES.TOGGLE_LAYER_VISIBILITY]: toggleLayerVisibilityTool
  };

  export function isValidTool(obj: unknown): obj is Tool {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           typeof obj.description === 'string' && 
           obj.parameters && 
           typeof obj.execute === 'function';
  }

  export function loadToolFromConfig(toolConfig: ToolConfig): void {
    try {
      const toolInstance = staticTools[toolConfig.name];
      
      if (!toolInstance) {
        throw new Error(`Tool not found in static tools: ${toolConfig.name}`);
      }

      if (!isValidTool(toolInstance)) {
        throw new Error(`Invalid tool: ${toolConfig.exportName} for ${toolConfig.name}`);
      }

      if (toolInstance.name !== toolConfig.name) {
      }

      registerToolInternal(toolInstance);
      
      if (toolConfig.ai_enabled) {
        aiEnabledTools.add(toolInstance.name);
      }

      if (config.config.enableLogging) {
      }
    } catch (error) {
      throw new Error(`Failed to load ${toolConfig.name}: ${error}`);
    }
  }

  export function registerToolInternal(tool: Tool): void {
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
  constructor() {
    if (Internal.config.config.autoRegister) {
      this.autoRegisterTools();
    }
  }

  private autoRegisterTools(): void {
    if (Internal.config.config.enableLogging) {
    }
    
    let successCount = 0;
    let errorCount = 0;

    for (const toolConfig of Internal.config.tools) {
      try {
        Internal.loadToolFromConfig(toolConfig);
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

  getTool(name: string): Tool | undefined {
    return ToolExecutor.getTool(name);
  }

  getAllTools(): Tool[] {
    return Array.from(Internal.tools.values());
  }

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

  async executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    return ToolExecutor.executeTool(name, args);
  }

  printToolInfo(): void {
    
    Internal.tools.forEach((tool, name) => {
      const aiEnabled = Internal.aiEnabledTools.has(name);
    });
  }
}

export const toolRegistry = new ToolRegistry(); 
