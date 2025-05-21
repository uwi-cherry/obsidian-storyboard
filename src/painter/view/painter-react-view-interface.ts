import type { PainterView } from './painter-obsidian-view';

export interface PainterReactViewProps {
  /**
   * Obsidian の FileView を継承した PainterView。
   * Obsidian API 依存の箇所は PainterView に残し、
   * 本コンポーネントは純粋な UI 操作のみを担当する。
   */
  view: PainterView;
}
