import { ToolsConfiguration } from '../service/core/tool-config-types';

export const TOOL_NAMES = {
  CREATE_STORYBOARD_FILE: 'create_storyboard_file',
  RENAME_FILE_EXTENSION: 'rename_file_extension',
  TOGGLE_STORYBOARD_VIEW: 'toggle_storyboard_view',
  LOAD_STORYBOARD_DATA: 'load_storyboard_data',
  SAVE_STORYBOARD_DATA: 'save_storyboard_data',
  EXPORT_STORYBOARD_JSON: 'export_storyboard_json',

  CREATE_USD_FILE: 'create_usd_file',
  LOAD_USD_FILE: 'load_usd_file',
  SAVE_USD_FILE: 'save_usd_file',
  CONVERT_MD_TO_USD: 'convert_md_to_usd',
  CONVERT_USD_TO_MD: 'convert_usd_to_md',
  
  INITIALIZE_TIMING: 'initialize_timing',
  
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
  GENERATE_TEXT: 'generate_text',
  GENERATE_VIDEO: 'generate_video',
  INPAINT_IMAGE: 'inpaint_image',
  GENERATIVE_FILL: 'generative_fill',
  FLUX_MULTI_LAYER: 'flux_multi_layer'
  ADD_STORYBOARD_ROW: 'add_storyboard_row',
  ADD_STORYBOARD_ROWS_BULK: 'add_storyboard_rows_bulk',
  RUN_STORYBOARD_AI_AGENT: 'run_storyboard_ai_agent'
} as const;

export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];

export const TOOL_CATEGORIES = {
  STORYBOARD: 'storyboard',
  PAINTER: 'painter',
  TIMELINE: 'timeline',
  MARKDOWN: 'markdown'
} as const;

export type ToolCategory = typeof TOOL_CATEGORIES[keyof typeof TOOL_CATEGORIES];

export const TOOLS_CONFIG: ToolsConfiguration = {
  tools: [
    {
      name: TOOL_NAMES.CREATE_STORYBOARD_FILE,
      modulePath: "../api/storyboard-tool/create-storyboard-file",
      exportName: "createStoryboardFileTool",
      ai_enabled: false,
      description: "Create a new storyboard file with sample content",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.RENAME_FILE_EXTENSION,
      modulePath: "../api/storyboard-tool/rename-file-extension",
      exportName: "renameFileExtensionTool",
      ai_enabled: false,
      description: "Rename file extension with collision avoidance",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.TOGGLE_STORYBOARD_VIEW,
      modulePath: "../api/storyboard-tool/toggle-storyboard-view",
      exportName: "toggleStoryboardViewTool",
      ai_enabled: false,
      description: "Toggle between markdown and storyboard view",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.LOAD_STORYBOARD_DATA,
      modulePath: "../api/storyboard-tool/load-storyboard-data",
      exportName: "loadStoryboardDataTool",
      ai_enabled: true,
      description: "Load storyboard data from file",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.SAVE_STORYBOARD_DATA,
      modulePath: "../api/storyboard-tool/save-storyboard-data",
      exportName: "saveStoryboardDataTool",
      ai_enabled: false,
      description: "Save storyboard data to file",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.EXPORT_STORYBOARD_JSON,
      modulePath: "../api/storyboard-tool/export-storyboard-json",
      exportName: "exportStoryboardJsonTool",
      ai_enabled: false,
      description: "Export storyboard data as JSON file",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.CREATE_USD_FILE,
      modulePath: "../api/usd-tool/create-usd-file",
      exportName: "createUsdFileTool",
      ai_enabled: false,
      description: "Create new USD file",
      category: TOOL_CATEGORIES.TIMELINE
    },
    {
      name: TOOL_NAMES.LOAD_USD_FILE,
      modulePath: "../api/usd-tool/load-usd-file",
      exportName: "loadUsdFileTool",
      ai_enabled: false,
      description: "Load USD file",
      category: TOOL_CATEGORIES.TIMELINE
    },
    {
      name: TOOL_NAMES.SAVE_USD_FILE,
      modulePath: "../api/usd-tool/save-usd-file",
      exportName: "saveUsdFileTool",
      ai_enabled: false,
      description: "Save USD file",
      category: TOOL_CATEGORIES.TIMELINE
    },
    {
      name: TOOL_NAMES.CONVERT_MD_TO_USD,
      modulePath: "../api/usd-tool/convert-md-to-usd",
      exportName: "convertMdToUsdTool",
      ai_enabled: false,
      description: "Convert Markdown storyboard to USD stage",
      category: TOOL_CATEGORIES.TIMELINE
    },
    {
      name: TOOL_NAMES.CONVERT_USD_TO_MD,
      modulePath: "../api/usd-tool/convert-usd-to-md",
      exportName: "convertUsdToMdTool",
      ai_enabled: false,
      description: "Convert USD stage to Markdown storyboard",
      category: TOOL_CATEGORIES.TIMELINE
    },
    {
      name: TOOL_NAMES.INITIALIZE_TIMING,
      modulePath: "../api/markdown-tool/initialize-timing",
      exportName: "initializeTimingTool",
      ai_enabled: false,
      description: "Initialize timing information in markdown storyboard",
      category: TOOL_CATEGORIES.MARKDOWN
    },
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
      name: TOOL_NAMES.GENERATE_TEXT,
      modulePath: "../api/ai-tool/generate-text",
      exportName: "generateTextTool",
      ai_enabled: false,
      description: "Generate text via AI agent",
      category: TOOL_CATEGORIES.MARKDOWN
    },
    {
      name: TOOL_NAMES.GENERATE_VIDEO,
      modulePath: "../api/ai-tool/generate-video",
      exportName: "generateVideoTool",
      ai_enabled: false,
      description: "Generate video via AI",
      category: TOOL_CATEGORIES.TIMELINE
    },
    {
      name: TOOL_NAMES.INPAINT_IMAGE,
      modulePath: "../api/ai-tool/inpaint-image",
      exportName: "inpaintImageTool",
      ai_enabled: false,
      description: "Inpaint image via AI",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.GENERATIVE_FILL,
      modulePath: "../api/ai-tool/generative-fill",
      exportName: "generativeFillTool",
      ai_enabled: false,
      description: "Generative fill via AI",
      category: TOOL_CATEGORIES.PAINTER
    },
    {
      name: TOOL_NAMES.ADD_STORYBOARD_ROW,
      modulePath: "../api/storyboard-tool/add-row",
      exportName: "addStoryboardRowTool",
      ai_enabled: false,
      description: "Add one row to storyboard with default text",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.ADD_STORYBOARD_ROWS_BULK,
      modulePath: "../api/storyboard-tool/add-rows-bulk",
      exportName: "addStoryboardRowsBulkTool",
      ai_enabled: false,
      description: "Add multiple rows to storyboard at once",
      category: TOOL_CATEGORIES.STORYBOARD
    },
    {
      name: TOOL_NAMES.RUN_STORYBOARD_AI_AGENT,
      modulePath: "../api/storyboard-tool/ai-storyboard-agent",
      exportName: "runStoryboardAiAgentTool",
      ai_enabled: false,
      description: "Run AI agent to edit storyboard",
      category: TOOL_CATEGORIES.STORYBOARD
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
