import { TOOL_ICONS } from './icons';
import { t } from './i18n';

export const PSD_VIEW_TYPE = 'psd-view';
export const PSD_EXTENSION = 'psd';
export const PSD_ICON = 'psd-icon';

// キャンバスのデフォルトサイズ
export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 600;

// ブレンドモードの定義
export const BLEND_MODE_TO_COMPOSITE_OPERATION = {
    'normal': 'source-over',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color dodge': 'color-dodge',
    'color burn': 'color-burn',
    'hard light': 'hard-light',
    'soft light': 'soft-light',
    'difference': 'difference',
    'exclusion': 'exclusion',
    'hue': 'hue',
    'saturation': 'saturation',
    'color': 'color',
    'luminosity': 'luminosity',
    'pass through': 'source-over'
} as const;

// ツールの定義
export const TOOLS = [
    { id: 'brush', title: t('TOOL_BRUSH'), icon: TOOL_ICONS.brush },
    { id: 'eraser', title: t('TOOL_ERASER'), icon: TOOL_ICONS.eraser },
    { id: 'selection', title: t('TOOL_SELECTION'), icon: TOOL_ICONS.selection },
] as const;

// 履歴の最大サイズ
export const MAX_HISTORY_SIZE = 20;

// デフォルトの色
export const DEFAULT_COLOR = '#000000'; 