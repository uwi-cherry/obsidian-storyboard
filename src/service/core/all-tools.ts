import { Tool } from './tool';

import {
  createPainterFileTool,
  loadPainterFileTool,
  savePainterFileTool,
  createImageFileTool,
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
  generateImageTool,
  combineImageMaskTool
} from '../api/ai-tool';

export const ALL_TOOLS: Tool<any, any>[] = [
  createPainterFileTool,
  loadPainterFileTool,
  savePainterFileTool,
  createImageFileTool,
  undoPainterTool,
  redoPainterTool,
  addLayerTool,
  removeLayerTool,
  setLayerOpacityTool,
  setLayerBlendModeTool,
  setLayerClippingTool,
  renameLayerTool,
  toggleLayerVisibilityTool,
  generateImageTool,
  combineImageMaskTool
];
