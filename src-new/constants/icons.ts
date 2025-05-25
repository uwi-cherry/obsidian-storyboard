const SVG_BASE = 'xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"';
const STROKE_ATTRS = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const VIEWBOX = '0 0 24 24';

const OBSIDIAN_SVG = `${SVG_BASE} viewBox="${VIEWBOX}" ${STROKE_ATTRS}`;

const REACT_SVG = `${SVG_BASE} width="20" height="20" viewBox="${VIEWBOX}" ${STROKE_ATTRS}`;

const PSD_ICON_PATH = `
  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
  <line x1="4" y1="10" x2="20" y2="10"/>
  <line x1="10" y1="20" x2="10" y2="10"/>
`;

const PAINTER_ICON_PATH = `
  <path d="M12 2l3 6L21 9l-4.5 4.5L18 21l-6-3.5L6 21l1.5-7.5L3 9l6-.5L12 2z"/>
  <circle cx="12" cy="12" r="2"/>
`;

const TIMELINE_ICON_PATH = `
  <line x1="4" y1="12" x2="20" y2="12"/>
  <circle cx="6" cy="12" r="1"/>
  <circle cx="12" cy="12" r="1"/>
  <circle cx="18" cy="12" r="1"/>
  <line x1="6" y1="8" x2="6" y2="10"/>
  <line x1="12" y1="8" x2="12" y2="10"/>
  <line x1="18" y1="8" x2="18" y2="10"/>
`;

const STORYBOARD_ICON_PATH = `
  <path d="M4 19v-14A2 2 0 0 1 6 3h14v18H6a2 2 0 0 1 0-4h14"/>
  <path d="M7 7h10"/><path d="M7 11h10"/><path d="M7 15h7"/>
`;

const STORYBOARD_TOGGLE_ICON_PATH = `
  <polyline points="15 4 20 4 20 9"/><line x1="4" y1="20" x2="20" y2="4"/><polyline points="9 20 4 20 4 15"/>
`;

const ADD_ICON_PATH = `
  <line x1="12" y1="7" x2="12" y2="17"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
`;

const FOLD_ICON_PATH = `
  <polyline points="9 6 15 12 9 18"/>
`;

const TABLE_ICON_PATHS = {
  moveUp: `<polyline points="6 14 12 8 18 14"/>`,
  moveDown: `<polyline points="6 10 12 16 18 10"/>`,
  add: `<line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/>`,
  addBelow: `<polyline points="12 5 12 15"/><polyline points="8 11 12 15 16 11"/>`,
  delete: `<line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>`,
  menu: `<circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/>`
};

const TOOL_ICON_PATHS = {
  pen: `<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>`,
  brush: `<path d="M20 5l-2 2a2 2 0 0 1-2.5 0L5 17l-2 2a2 2 0 0 1-2.5-2.5L13 6a2 2 0 0 1 2.5 0L20 5z"/>`,
  'paint-brush': `<path d="M18.37 2.63l3 3a1 1 0 0 1 0 1.41L8.5 19.91a2 2 0 0 1-1.41.59H3a1 1 0 0 1-1-1v-4.09a2 2 0 0 1 .59-1.41L15.46 1.22a1 1 0 0 1 1.41 0l1.5 1.41z"/><circle cx="6" cy="18" r="3"/>`,
  'color-mixer': `<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12l4 4" stroke="currentColor" stroke-width="2"/>`,
  eraser: `<path d="M18 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="14 3 20 3 20 9"/><line x1="10" y1="14" x2="20" y2="4"/>`,
  selection: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="10" y1="21" x2="10" y2="10"/>`,
  hand: `<path d="M7 12V6a1 1 0 0 1 2 0v5"/><path d="M11 13V3a1 1 0 0 1 2 0v8"/><path d="M16 12V7a1 1 0 0 1 2 0v5"/><path d="M5 14s1 2 4 2 4-2 4-2 1 2 4 2 4-2 4-2"/>`
};

const BUTTON_ICON_PATHS = {
  fileSelect: `<path d="M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/><path d="M17 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h6.5L17 6.5zM4 2a1 1 0 0 0-1 1v12l2.7-2.7a.5.5 0 0 1 .7-.1L10 14l2.6-3.6a.5.5 0 0 1 .9-.1L16 12V6.5h-2A2 2 0 0 1 12 4.5V2z"/>`,
  aiGenerate: `<path d="M7 .3a.9.9 0 0 1 .1 1 8.6 8.6 0 0 0-1 4.1c0 4.8 3.9 8.7 8.8 8.7q.9 0 1.8-.2a.9.9 0 0 1 1 .4.9.9 0 0 1 0 1.1A10 10 0 0 1 10 19C4.5 19 0 14.7 0 9.3 0 5.1 2.5 1.6 6.1.1A.9.9 0 0 1 7 .3M5.8 1.6A8.7 8.7 0 0 0 1.2 9.3c0 4.8 3.9 8.7 8.8 8.7a8.8 8.8 0 0 0 6.2-2.6q-.6.1-1.2.1c-5.5 0-10-4.5-10-10 0-1.4.3-2.7.8-3.9"/><path d="M13 3.8a.3.3 0 0 1 .5 0l.5 1.4c.2.6.7 1.1 1.3 1.3l1.4.5a.3.3 0 0 1 0 .5l-1.4.5a2.1 2.1 0 0 0-1.3 1.3l-.5 1.4a.3.3 0 0 1-.5 0l-.5-1.4a2.1 2.1 0 0 0-1.3-1.3l-1.4-.5a.3.3 0 0 1 0-.5l1.4-.5c.4-.1.7-.5 1.3-1.3zM16.6.1a.2.2 0 0 1 .3 0l.3.9c.1.4.5.7.9.9l.9.3a.2.2 0 0 1 0 .3l-.9.3a1.4 1.4 0 0 0-.9.9l-.3.9a.2.2 0 0 1-.3 0l-.3-.9a1.4 1.4 0 0 0-.9-.9l-.9-.3a.2.2 0 0 1 0-.3l.9-.3c.4-.1.7-.5.9-.9z"/>`,
  clearPath: `<path d="M2 6h20"/><path d="M19 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>`
};

export const OBSIDIAN_ICONS = {
  PSD_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${PSD_ICON_PATH}</svg>`,
  PAINTER_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${PAINTER_ICON_PATH}</svg>`,
  TIMELINE_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${TIMELINE_ICON_PATH}</svg>`,
  STORYBOARD_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${STORYBOARD_ICON_PATH}</svg>`,
  STORYBOARD_TOGGLE_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${STORYBOARD_TOGGLE_ICON_PATH}</svg>`,
  ADD_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${ADD_ICON_PATH}</svg>`,
  FOLD_ICON_SVG: `<svg ${OBSIDIAN_SVG}>${FOLD_ICON_PATH}</svg>`
};

export const PSD_ICON_SVG = `<svg ${REACT_SVG}>${PSD_ICON_PATH}</svg>`;
export const PAINTER_ICON_SVG = `<svg ${REACT_SVG}>${PAINTER_ICON_PATH}</svg>`;
export const TIMELINE_ICON_SVG = `<svg ${REACT_SVG}>${TIMELINE_ICON_PATH}</svg>`;
export const STORYBOARD_ICON_SVG = `<svg ${REACT_SVG}>${STORYBOARD_ICON_PATH}</svg>`;
export const STORYBOARD_TOGGLE_ICON_SVG = `<svg ${REACT_SVG}>${STORYBOARD_TOGGLE_ICON_PATH}</svg>`;
export const FOLD_ICON_SVG = `<svg ${REACT_SVG}>${FOLD_ICON_PATH}</svg>`;
export const ADD_ICON_SVG = `<svg ${REACT_SVG}>${ADD_ICON_PATH}</svg>`;

export const TABLE_ICONS = {
  moveUp: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.moveUp}</svg>`,
  moveDown: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.moveDown}</svg>`,
  add: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.add}</svg>`,
  addBelow: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.addBelow}</svg>`,
  delete: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.delete}</svg>`,
  menu: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.menu}</svg>`
};

export const LAYER_ICONS = {
  add: `<svg ${REACT_SVG}>${ADD_ICON_PATH}</svg>`,
  delete: `<svg ${REACT_SVG}>${TABLE_ICON_PATHS.delete}</svg>`
};

export const TOOL_ICONS = {
  pen: `<svg ${REACT_SVG}>${TOOL_ICON_PATHS.pen}</svg>`,
  brush: `<svg ${REACT_SVG}>${TOOL_ICON_PATHS.brush}</svg>`,
  'paint-brush': `<svg ${REACT_SVG}>${TOOL_ICON_PATHS['paint-brush']}</svg>`,
  'color-mixer': `<svg ${REACT_SVG}>${TOOL_ICON_PATHS['color-mixer']}</svg>`,
  eraser: `<svg ${REACT_SVG}>${TOOL_ICON_PATHS.eraser}</svg>`,
  selection: `<svg ${REACT_SVG}>${TOOL_ICON_PATHS.selection}</svg>`,
  hand: `<svg ${REACT_SVG}>${TOOL_ICON_PATHS.hand}</svg>`
};

export const BUTTON_ICONS = {
  fileSelect: `<svg ${REACT_SVG}>${BUTTON_ICON_PATHS.fileSelect}</svg>`,
  aiGenerate: `<svg ${REACT_SVG}>${BUTTON_ICON_PATHS.aiGenerate}</svg>`,
  clearPath: `<svg ${REACT_SVG}>${BUTTON_ICON_PATHS.clearPath}</svg>`
}; 
