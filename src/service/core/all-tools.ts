import { Tool } from './tool';

import {
  createPainterFileTool,
  loadPainterFileTool,
  savePainterFileTool,
  generateThumbnailTool,
  exportMergedImageTool,
  undoPainterTool,
  redoPainterTool
} from '../api/painter-tool';


import {
  addLayerTool,
  removeLayerTool,
  setLayerOpacityTool,
  setLayerBlendModeTool,
  setLayerClippingTool,
  renameLayerTool,
  toggleLayerVisibilityTool
} from '../api/layer-tool';

import {
  generateImageTool
} from '../api/ai-tool';

export const ALL_TOOLS: Tool<any, any>[] = [
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
  generateImageTool
];
