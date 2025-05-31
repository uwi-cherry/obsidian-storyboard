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
  createStoryboardFileTool,
  renameFileExtensionTool,
  toggleStoryboardViewTool,
  loadStoryboardDataTool,
  saveStoryboardDataTool,
  exportStoryboardJsonTool,
  addStoryboardRowTool,
  addStoryboardRowsBulkTool,
  runStoryboardAiAgentTool
} from '../api/storyboard-tool';

import {
  createUsdFileTool,
  loadUsdFileTool,
  saveUsdFileTool,
  convertMdToUsdTool,
  convertUsdToMdTool
} from '../api/usd-tool';

import { initializeTimingTool } from '../api/markdown-tool/initialize-timing';

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
  generateTextTool,
  generateImageTool,
  generateVideoTool,
  inpaintImageTool,
  generativeFillTool
} from '../api/ai-tool';

export const ALL_TOOLS: Tool<any, any>[] = [
  createStoryboardFileTool,
  renameFileExtensionTool,
  toggleStoryboardViewTool,
  loadStoryboardDataTool,
  saveStoryboardDataTool,
  exportStoryboardJsonTool,
  addStoryboardRowTool,
  addStoryboardRowsBulkTool,
  runStoryboardAiAgentTool,
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
