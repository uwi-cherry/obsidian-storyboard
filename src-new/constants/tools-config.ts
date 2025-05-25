import { ToolsConfiguration } from '../service-api/core/tool-config-types';

export const TOOL_NAMES = {
  CREATE_STORYBOARD_FILE: 'create_storyboard_file',
  RENAME_FILE_EXTENSION: 'rename_file_extension',
  TOGGLE_STORYBOARD_VIEW: 'toggle_storyboard_view',
  LOAD_STORYBOARD_DATA: 'load_storyboard_data',
  SAVE_STORYBOARD_DATA: 'save_storyboard_data',
  
  CREATE_PAINTER_FILE: 'create_painter_file',
  LOAD_PAINTER_FILE: 'load_painter_file',
  SAVE_PAINTER_FILE: 'save_painter_file',
  GENERATE_THUMBNAIL: 'generate_thumbnail',
  UNDO_PAINTER: 'undo_painter',
  REDO_PAINTER: 'redo_painter',
  
  ADD_LAYER: 'add_layer',
  REMOVE_LAYER: 'remove_layer',
  SET_LAYER_OPACITY: 'set_layer_opacity',
  SET_LAYER_BLEND_MODE: 'set_layer_blend_mode',
  RENAME_LAYER: 'rename_layer',
  TOGGLE_LAYER_VISIBILITY: 'toggle_layer_visibility'
} as const;

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];

export const TOOL_CATEGORIES = {
  STORYBOARD: 'storyboard',
  PAINTER: 'painter'
} as const;

export type ToolCategory = typeof TOOL_CATEGORIES[keyof typeof TOOL_CATEGORIES];

export const TOOLS_CONFIG: ToolsConfiguration = {
  tools: [
    {
      name: TOOL_NAMES.CREATE_STORYBOARD_FILE,
      modulePath: "../../src-new/service-api/api/storyboard-tool/create-storyboard-file",
      exportName: "createStoryboardFileTool",
      ai_enabled: false,
      description: "Create a new storyboard file with sample content",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.RENAME_FILE_EXTENSION,
      modulePath: "../../src-new/service-api/api/storyboard-tool/rename-file-extension",
      exportName: "renameFileExtensionTool",
      ai_enabled: false,
      description: "Rename file extension with collision avoidance",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.TOGGLE_STORYBOARD_VIEW,
      modulePath: "../../src-new/service-api/api/storyboard-tool/toggle-storyboard-view",
      exportName: "toggleStoryboardViewTool",
      ai_enabled: false,
      description: "Toggle between markdown and storyboard view",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.LOAD_STORYBOARD_DATA,
      modulePath: "../../src-new/service-api/api/storyboard-tool/load-storyboard-data",
      exportName: "loadStoryboardDataTool",
      ai_enabled: false,
      description: "Load storyboard data from file",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.SAVE_STORYBOARD_DATA,
      modulePath: "../../src-new/service-api/api/storyboard-tool/save-storyboard-data",
      exportName: "saveStoryboardDataTool",
      ai_enabled: false,
      description: "Save storyboard data to file",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.CREATE_PAINTER_FILE,
      modulePath: "../../src-new/service-api/api/painter-tool/create-painter-file",
      exportName: "createPainterFileTool",
      ai_enabled: false,
      description: "Create new PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.LOAD_PAINTER_FILE,
      modulePath: "../../src-new/service-api/api/painter-tool/load-painter-file",
      exportName: "loadPainterFileTool",
      ai_enabled: false,
      description: "Load PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SAVE_PAINTER_FILE,
      modulePath: "../../src-new/service-api/api/painter-tool/save-painter-file",
      exportName: "savePainterFileTool",
      ai_enabled: false,
      description: "Save PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.GENERATE_THUMBNAIL,
      modulePath: "../../src-new/service-api/api/painter-tool/generate-thumbnail",
      exportName: "generateThumbnailTool",
      ai_enabled: false,
      description: "Generate thumbnail from PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.UNDO_PAINTER,
      modulePath: "../../src-new/service-api/api/painter-tool/undo-painter",
      exportName: "undoPainterTool",
      ai_enabled: false,
      description: "Undo painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.REDO_PAINTER,
      modulePath: "../../src-new/service-api/api/painter-tool/redo-painter",
      exportName: "redoPainterTool",
      ai_enabled: false,
      description: "Redo painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.ADD_LAYER,
      modulePath: "../../src-new/service-api/api/layer-tool/add-layer",
      exportName: "addLayerTool",
      ai_enabled: false,
      description: "Add new layer to painter view (supports fileData)",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.REMOVE_LAYER,
      modulePath: "../../src-new/service-api/api/layer-tool/remove-layer",
      exportName: "removeLayerTool",
      ai_enabled: false,
      description: "Remove layer from painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SET_LAYER_OPACITY,
      modulePath: "../../src-new/service-api/api/layer-tool/set-layer-opacity",
      exportName: "setLayerOpacityTool",
      ai_enabled: false,
      description: "Set layer opacity in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SET_LAYER_BLEND_MODE,
      modulePath: "../../src-new/service-api/api/layer-tool/set-layer-blend-mode",
      exportName: "setLayerBlendModeTool",
      ai_enabled: false,
      description: "Set layer blend mode in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.RENAME_LAYER,
      modulePath: "../../src-new/service-api/api/layer-tool/rename-layer",
      exportName: "renameLayerTool",
      ai_enabled: false,
      description: "Rename layer in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.TOGGLE_LAYER_VISIBILITY,
      modulePath: "../../src-new/service-api/api/layer-tool/toggle-layer-visibility",
      exportName: "toggleLayerVisibilityTool",
      ai_enabled: false,
      description: "Toggle layer visibility in painter view",
      category: TOOL_CATEGORIES.PAINTER
    }
  ],
  config: {
    autoRegister: true,
    enableLogging: true,
    failOnError: false
  }
};

export function isValidToolName(name: string): name is ToolName {
  return Object.values(TOOL_NAMES).includes(name as ToolName);
}

export function isValidToolCategory(category: string): category is ToolCategory {
  return Object.values(TOOL_CATEGORIES).includes(category as ToolCategory);
}

export function getConfiguredToolNames(): ToolName[] {
  return TOOLS_CONFIG.tools.map(tool => tool.name as ToolName);
} 
