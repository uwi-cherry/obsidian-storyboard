import { Tool } from './tool';
import { ToolsConfiguration, ToolConfig } from './tool-config-types';
import { ToolExecutor } from './tool-executor';
import toolsConfig from './tools-config.json';

// 静的インポート - 動的インポートの問題を回避
import { createStoryboardFileTool } from '../api/storyboard-tool/create-storyboard-file';
import { renameFileExtensionTool } from '../api/storyboard-tool/rename-file-extension';
import { toggleStoryboardViewTool } from '../api/storyboard-tool/toggle-storyboard-view';
import { loadStoryboardDataTool } from '../api/storyboard-tool/load-storyboard-data';
import { saveStoryboardDataTool } from '../api/storyboard-tool/save-storyboard-data';
import { createPainterFileTool } from '../api/painter-tool/create-painter-file';
import { undoPainterTool } from '../api/painter-tool/undo-painter';
import { redoPainterTool } from '../api/painter-tool/redo-painter';
import { loadPainterFileTool } from '../api/painter-tool/load-painter-file';
import { savePainterFileTool } from '../api/painter-tool/save-painter-file';
import { generateThumbnailTool } from '../api/painter-tool/generate-thumbnail';
import { addLayerTool } from '../api/layer-tool/add-layer';
import { deleteLayerTool } from '../api/layer-tool/delete-layer';
import { updateLayerTool } from '../api/layer-tool/update-layer';
import { duplicateLayerTool } from '../api/layer-tool/duplicate-layer';
import { initializePainterDataTool } from '../api/layer-tool/initialize-painter-data';
import { setCurrentLayerTool } from '../api/layer-tool/set-current-layer';

/**
 * 内部実装 - 外部からアクセス不可
 */
namespace Internal {
  export const tools = new Map<string, Tool<any>>();
  export const aiEnabledTools = new Set<string>();
  export const config: ToolsConfiguration = toolsConfig as ToolsConfiguration;

  // 静的ツールマッピング
  export const staticTools: Record<string, Tool<any>> = {
    'create_storyboard_file': createStoryboardFileTool,
    'rename_file_extension': renameFileExtensionTool,
    'toggle_storyboard_view': toggleStoryboardViewTool,
    'load_storyboard_data': loadStoryboardDataTool,
    'save_storyboard_data': saveStoryboardDataTool,
    'create_painter_file': createPainterFileTool,
    'load_painter_file': loadPainterFileTool,
    'save_painter_file': savePainterFileTool,
    'generate_thumbnail': generateThumbnailTool,
    'undo_painter': undoPainterTool,
    'redo_painter': redoPainterTool,
    'add_layer': addLayerTool,
    'delete_layer': deleteLayerTool,
    'update_layer': updateLayerTool,
    'duplicate_layer': duplicateLayerTool,
    'initialize_painter_data': initializePainterDataTool,
    'set_current_layer': setCurrentLayerTool
  };

  /**
   * オブジェクトがToolインターフェースを実装しているかチェック
   */
  export function isValidTool(obj: any): obj is Tool<any> {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.name === 'string' && 
           typeof obj.description === 'string' && 
           obj.parameters && 
           typeof obj.execute === 'function';
  }

  /**
   * 設定からツールを静的にロード（動的インポートの問題を回避）
   */
  export function loadToolFromConfig(toolConfig: ToolConfig): void {
    try {
      const toolInstance = staticTools[toolConfig.name];
      
      if (!toolInstance) {
        throw new Error(`Tool not found in static tools: ${toolConfig.name}`);
      }

      if (!isValidTool(toolInstance)) {
        throw new Error(`Invalid tool: ${toolConfig.exportName} for ${toolConfig.name}`);
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
  export function registerToolInternal(tool: Tool<any>): void {
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
   * コンフィグファイルに基づいてツールを自動登録（静的ロード）
   */
  private autoRegisterTools(): void {
    if (Internal.config.config.enableLogging) {
      console.log('Starting config-based tool registration...');
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

  getTool(name: string): Tool<any> | undefined {
    return ToolExecutor.getTool(name);
  }

  getAllTools(): Tool<any>[] {
    return Array.from(Internal.tools.values());
  }

  /**
   * AI有効なツールのみを取得
   */
  getAiEnabledTools(): Tool<any>[] {
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