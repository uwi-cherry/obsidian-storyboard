import { ToolsConfiguration } from '../service/core/tool-config-types';

export const TOOL_NAMES = {
  CREATE_PAINTER_FILE: 'create_painter_file',
  LOAD_PAINTER_FILE: 'load_painter_file',
  SAVE_PAINTER_FILE: 'save_painter_file',
  GENERATE_THUMBNAIL: 'generate_thumbnail',
  EXPORT_MERGED_IMAGE: 'export_merged_image',
  UNDO_PAINTER: 'undo_painter',
  REDO_PAINTER: 'redo_painter',
  
  ADD_LAYER: 'add_layer',
  REMOVE_LAYER: 'remove_layer',
  SET_LAYER_OPACITY: 'set_layer_opacity',
  SET_LAYER_BLEND_MODE: 'set_layer_blend_mode',
  SET_LAYER_CLIPPING: 'set_layer_clipping',
  RENAME_LAYER: 'rename_layer',
  TOGGLE_LAYER_VISIBILITY: 'toggle_layer_visibility',
  
  GENERATE_IMAGE: 'generate_image',
  COMBINE_IMAGE_MASK: 'combine_image_mask'
} as const;

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];

export const TOOL_CATEGORIES = {
  PAINTER: 'painter',
  AI: 'ai'
} as const;

export type ToolCategory = typeof TOOL_CATEGORIES[keyof typeof TOOL_CATEGORIES];

export const TOOLS_CONFIG: ToolsConfiguration = {
  tools: [
    {
      name: TOOL_NAMES.CREATE_PAINTER_FILE,
      modulePath: "../api/painter-tool/create-painter-file",
      exportName: "createPainterFileTool",
      ai_enabled: false,
      description: "Create new PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.LOAD_PAINTER_FILE,
      modulePath: "../api/painter-tool/load-painter-file",
      exportName: "loadPainterFileTool",
      ai_enabled: false,
      description: "Load PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SAVE_PAINTER_FILE,
      modulePath: "../api/painter-tool/save-painter-file",
      exportName: "savePainterFileTool",
      ai_enabled: false,
      description: "Save PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.EXPORT_MERGED_IMAGE,
      modulePath: "../api/painter-tool/export-merged-image",
      exportName: "exportMergedImageTool",
      ai_enabled: false,
      description: "Export merged image as PNG",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.GENERATE_THUMBNAIL,
      modulePath: "../api/painter-tool/generate-thumbnail",
      exportName: "generateThumbnailTool",
      ai_enabled: false,
      description: "Generate thumbnail from PSD file",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.UNDO_PAINTER,
      modulePath: "../api/painter-tool/undo-painter",
      exportName: "undoPainterTool",
      ai_enabled: false,
      description: "Undo painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.REDO_PAINTER,
      modulePath: "../api/painter-tool/redo-painter",
      exportName: "redoPainterTool",
      ai_enabled: false,
      description: "Redo painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.ADD_LAYER,
      modulePath: "../api/layer-tool/add-layer",
      exportName: "addLayerTool",
      ai_enabled: false,
      description: "Add new layer to painter view (supports fileData)",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.REMOVE_LAYER,
      modulePath: "../api/layer-tool/remove-layer",
      exportName: "removeLayerTool",
      ai_enabled: false,
      description: "Remove layer from painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SET_LAYER_OPACITY,
      modulePath: "../api/layer-tool/set-layer-opacity",
      exportName: "setLayerOpacityTool",
      ai_enabled: false,
      description: "Set layer opacity in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SET_LAYER_BLEND_MODE,
      modulePath: "../api/layer-tool/set-layer-blend-mode",
      exportName: "setLayerBlendModeTool",
      ai_enabled: false,
      description: "Set layer blend mode in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.SET_LAYER_CLIPPING,
      modulePath: "../api/layer-tool/set-layer-clipping",
      exportName: "setLayerClippingTool",
      ai_enabled: false,
      description: "Set layer clipping in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.RENAME_LAYER,
      modulePath: "../api/layer-tool/rename-layer",
      exportName: "renameLayerTool",
      ai_enabled: false,
      description: "Rename layer in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.TOGGLE_LAYER_VISIBILITY,
      modulePath: "../api/layer-tool/toggle-layer-visibility",
      exportName: "toggleLayerVisibilityTool",
      ai_enabled: false,
      description: "Toggle layer visibility in painter view",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.GENERATE_IMAGE,
      modulePath: "../api/ai-tool/generate-image",
      exportName: "generateImageTool",
      ai_enabled: false,
      description: "Generate image via AI",
      category: TOOL_CATEGORIES.AI
    },
    {
      name: TOOL_NAMES.COMBINE_IMAGE_MASK,
      modulePath: "../api/ai-tool/combine-image-mask",
      exportName: "combineImageMaskTool",
      ai_enabled: false,
      description: "Combine image and mask with alpha channel",
      category: TOOL_CATEGORIES.AI
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
