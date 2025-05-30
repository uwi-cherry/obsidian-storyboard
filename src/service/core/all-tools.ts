import { Tool } from './tool';

// Painter tools
import { createPainterFileTool } from '../api/painter-tool/create-painter-file';
import { loadPainterFileTool } from '../api/painter-tool/load-painter-file';
import { savePainterFileTool } from '../api/painter-tool/save-painter-file';
import { generateThumbnailTool } from '../api/painter-tool/generate-thumbnail';
import { exportMergedImageTool } from '../api/painter-tool/export-merged-image';
import { undoPainterTool } from '../api/painter-tool/undo-painter';
import { redoPainterTool } from '../api/painter-tool/redo-painter';

// Storyboard tools
import { createStoryboardFileTool } from '../api/storyboard-tool/create-storyboard-file';
import { renameFileExtensionTool } from '../api/storyboard-tool/rename-file-extension';
import { toggleStoryboardViewTool } from '../api/storyboard-tool/toggle-storyboard-view';
import { loadStoryboardDataTool } from '../api/storyboard-tool/load-storyboard-data';
import { saveStoryboardDataTool } from '../api/storyboard-tool/save-storyboard-data';
import { exportStoryboardJsonTool } from '../api/storyboard-tool/export-storyboard-json';

// USD tools
import { createUsdFileTool } from '../api/usd-tool/create-usd-file';
import { loadUsdFileTool } from '../api/usd-tool/load-usd-file';
import { saveUsdFileTool } from '../api/usd-tool/save-usd-file';
import { convertMdToUsdTool } from '../api/usd-tool/convert-md-to-usd';
import { convertUsdToMdTool } from '../api/usd-tool/convert-usd-to-md';

// Markdown tools
import { initializeTimingTool } from '../api/markdown-tool/initialize-timing';

// Layer tools
import { addLayerTool } from '../api/layer-tool/add-layer';
import { removeLayerTool } from '../api/layer-tool/remove-layer';
import { setLayerOpacityTool } from '../api/layer-tool/set-layer-opacity';
import { setLayerBlendModeTool } from '../api/layer-tool/set-layer-blend-mode';
import { setLayerClippingTool } from '../api/layer-tool/set-layer-clipping';
import { renameLayerTool } from '../api/layer-tool/rename-layer';
import { toggleLayerVisibilityTool } from '../api/layer-tool/toggle-layer-visibility';

// AI tools
import { generateTextTool } from '../api/ai-tool/generate-text';
import { generateImageTool } from '../api/ai-tool/generate-image';
import { generateVideoTool } from '../api/ai-tool/generate-video';
import { inpaintImageTool } from '../api/ai-tool/inpaint-image';
import { generativeFillTool } from '../api/ai-tool/generative-fill';

export const ALL_TOOLS: Tool<any, any>[] = [
  createStoryboardFileTool,
  renameFileExtensionTool,
  toggleStoryboardViewTool,
  loadStoryboardDataTool,
  saveStoryboardDataTool,
  exportStoryboardJsonTool,
  createUsdFileTool,
  loadUsdFileTool,
  saveUsdFileTool,
  convertMdToUsdTool,
  convertUsdToMdTool,
  initializeTimingTool,
  createPainterFileTool,
  loadPainterFileTool,
  savePainterFileTool,
  generateThumbnailTool,
  exportMergedImageTool,
  undoPainterTool,
  redoPainterTool,
  addLayerTool,
  removeLayerTool,
  setLayerOpacityTool,
  setLayerBlendModeTool,
  setLayerClippingTool,
  renameLayerTool,
  toggleLayerVisibilityTool,
  generateTextTool,
  generateImageTool,
  generateVideoTool,
  inpaintImageTool,
  generativeFillTool
];
