// 内部定数（大中小サイズのみ）
const SVG_BASE = 'xmlns="http://www.w3.org/2000/svg" fill="none"';
const SVG_FILLED = 'xmlns="http://www.w3.org/2000/svg" fill="currentColor"';
const STROKE_ATTRS = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

// 大中小サイズ
const SVG_LARGE = `${SVG_BASE} viewBox="0 0 24 24" ${STROKE_ATTRS}`;    // 24x24
const SVG_MEDIUM = `${SVG_BASE} viewBox="0 0 20 20" ${STROKE_ATTRS}`;   // 20x20  
const SVG_SMALL = `${SVG_FILLED} viewBox="0 0 16 16"`;                  // 16x16
const SVG_MEDIUM_SIZED = `width="18" height="18" viewBox="0 0 20 20" ${SVG_BASE} ${STROKE_ATTRS}`; // レイヤー用

// ───────────────────────────
// 1) ベース 24×24 アイコン
// ───────────────────────────

// PSDアイコン（サイズ属性ナシ）
export const PSD_ICON_SVG = `<svg ${SVG_LARGE}>
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  <line x1="3" y1="9" x2="21" y2="9"/>
  <line x1="9" y1="21" x2="9" y2="9"/>
</svg>`;

// ペインターアイコン（パレットと星の組み合わせ）
export const PAINTER_ICON_SVG = `<svg ${SVG_LARGE}>
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

// タイムラインアイコン（サイズ属性ナシ）
export const TIMELINE_ICON_SVG = `<svg ${SVG_LARGE}>
  <line x1="4" y1="12" x2="20" y2="12"/>
  <circle cx="6" cy="12" r="1.5"/>
  <circle cx="12" cy="12" r="1.5"/>
  <circle cx="18" cy="12" r="1.5"/>
  <line x1="6" y1="9" x2="6" y2="10.5"/>
  <line x1="12" y1="9" x2="12" y2="10.5"/>
  <line x1="18" y1="9" x2="18" y2="10.5"/>
</svg>`;

// ストーリーボード（サイズ属性ナシ）
export const STORYBOARD_ICON_SVG = `<svg ${SVG_LARGE}>
  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  <path d="M8 7h6"/><path d="M8 11h6"/><path d="M8 15h4"/>
</svg>`;

// ストーリーボードトグル（サイズ属性ナシ）
export const STORYBOARD_TOGGLE_ICON_SVG = `<svg ${SVG_LARGE}>
  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="8 21 3 21 3 16"/>
</svg>`;

// ───────────────────────────
// 2) テーブル操作 20×20 アイコン（統一サイズ）
// ───────────────────────────
export const TABLE_ICONS = {
  // 上へ
  moveUp: `<svg ${SVG_MEDIUM}>
    <polyline points="5 12 10 7 15 12"/>
  </svg>`,

  // 下へ
  moveDown: `<svg ${SVG_MEDIUM}>
    <polyline points="5 8 10 13 15 8"/>
  </svg>`,

  // 行を上に挿入
  add: `<svg ${SVG_MEDIUM}>
    <line x1="10" y1="6" x2="10" y2="14"/>
    <line x1="6"  y1="10" x2="14" y2="10"/>
  </svg>`,

  // 行を追加（下に）
  addBelow: `<svg ${SVG_MEDIUM}>
    <polyline points="10 4 10 12"/>
    <polyline points="6 8 10 12 14 8"/>
  </svg>`,

  // 行を削除
  delete: `<svg ${SVG_MEDIUM}>
    <line x1="7" y1="7" x2="13" y2="13"/>
    <line x1="13" y1="7" x2="7"  y2="13"/>
  </svg>`,

  // メニュー
  menu: `<svg ${SVG_MEDIUM}>
    <circle cx="10" cy="4"  r="1.5" fill="currentColor"/>
    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
  </svg>`
};

// ───────────────────────────
// 3) レイヤー操作アイコン（可視性改善）
// ───────────────────────────
export const LAYER_ICONS = {
  // レイヤー追加（可視性改善版）
  add: `<svg ${SVG_MEDIUM_SIZED}>
    <line x1="10" y1="6" x2="10" y2="14"/>
    <line x1="6" y1="10" x2="14" y2="10"/>
  </svg>`,

  // レイヤー削除（可視性改善版）
  delete: `<svg ${SVG_MEDIUM_SIZED}>
    <line x1="7" y1="7" x2="13" y2="13"/>
    <line x1="13" y1="7" x2="7" y2="13"/>
  </svg>`
};

// ───────────────────────────
// 4) そのほか（統一されたサイズ）
// ───────────────────────────
export const FOLD_ICON_SVG = `<svg ${SVG_MEDIUM}>
  <polyline points="8 5 13 10 8 15"/>
</svg>`;

export const NOTE_ICON_SVG = `<svg ${SVG_BASE} viewBox="0 0 24 24" fill="currentColor">
  <path d="M9 3v12.563A2.5 2.5 0 1 1 7 13V6.132L19 4v9.563A2.5 2.5 0 1 1 17 11V3H9z"/>
</svg>`;

// 汎用追加アイコン（テーブルアイコンと統一、可視性改善）
export const ADD_ICON_SVG = `<svg ${SVG_MEDIUM}>
  <line x1="10" y1="6" x2="10" y2="14"/>
  <line x1="6" y1="10" x2="14" y2="10"/>
</svg>`;

// ツールアイコン（24×24統一）
export const TOOL_ICONS = {
    brush: `<svg ${SVG_LARGE}>
        <path d="M20.71 5.63l-2.34 2.34a2 2 0 0 1-2.83 0L5.63 20.71a2 2 0 0 1-2.83-2.83l12.91-12.91a2 2 0 0 1 2.83 0l2.34 2.34a2 2 0 0 1 0 2.83z"/>
    </svg>`,
    eraser: `<svg ${SVG_LARGE}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>`,
    selection: `<svg ${SVG_LARGE}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>`,
    hand: `<svg ${SVG_LARGE}>
        <path d="M8 12V5a1 1 0 0 1 2 0v5"/>
        <path d="M12 13V3a1 1 0 0 1 2 0v8"/>
        <path d="M16 12V6a1 1 0 0 1 2 0v6"/>
        <path d="M5 14s1 3 4 3 4-3 4-3 1 3 4 3 4-3 4-3"/>
    </svg>`
};

// ボタンアイコン（16×16統一）
export const BUTTON_ICONS = {
    // ファイル選択
    fileSelect: `<svg ${SVG_SMALL}>
        <path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
        <path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .76-.063L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1z"/>
    </svg>`,
    // AI生成
    aiGenerate: `<svg ${SVG_SMALL}>
        <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.290 0-1.167.242-2.278.681-3.286"/>
        <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
    </svg>`,
    // パスをクリア
    clearPath: `<svg ${SVG_LARGE}>
        <path d="M3 6h18"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>`
}; 
