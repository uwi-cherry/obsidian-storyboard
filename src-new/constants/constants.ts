export const PSD_VIEW_TYPE = 'psd-view';
export const PSD_EXTENSION = 'psd';
export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 600;
export const MAX_HISTORY_SIZE = 20;
export const DEFAULT_COLOR = '#000000';

/** グローバル変数のキー定数 */
export const GLOBAL_VARIABLE_KEYS = {
  // ストーリーボード関連
  SELECTED_FRAME: 'selectedFrame',
  SELECTED_ROW_INDEX: 'selectedRowIndex',
  
  // レイヤー関連
  LAYERS: 'layers',
  CURRENT_LAYER_INDEX: 'currentLayerIndex',
  CURRENT_FILE: 'currentFile',
  
  // ペインター関連
  PAINTER_DATA: 'painterData',
  PAINTER_VIEW: 'painterView',
} as const;
