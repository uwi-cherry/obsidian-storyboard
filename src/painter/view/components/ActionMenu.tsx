import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SelectionRect } from 'src/painter/painter-types';
import { PainterView } from 'src/painter/view/painter-obsidian-view';
interface ActionMenuContentProps {
  mode: 'global' | 'selection' | 'hidden';
  onFill: () => void;
  onClear: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

const ActionMenuContent: React.FC<ActionMenuContentProps> = ({ mode, onFill, onClear, onEdit, onCancel }) => {
  if (mode === 'hidden') return null;
  return (
    <div
      className="flex gap-1 bg-secondary border border-modifier-border p-1 rounded"
    >
      <button className="px-2 py-1 text-xs" onClick={onFill}>
        Fill
      </button>
      <button className="px-2 py-1 text-xs" onClick={onClear}>
        Clear
      </button>
      {onEdit && (
        <button className="px-2 py-1 text-xs" onClick={onEdit}>
          Edit
        </button>
      )}
      {mode === 'selection' && onCancel && (
        <button className="px-2 py-1 text-xs" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
};

export class ActionMenu {
  private view: PainterView;
  private container: HTMLDivElement;
  private root: Root;
  private mode: 'global' | 'selection' | 'hidden' = 'hidden';
  private handlers?: {
    fill: () => void;
    clear: () => void;
    edit?: () => void;
    cancel?: () => void;
  };

  constructor(view: PainterView) {
    this.view = view;
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.zIndex = '1000';
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
    this.render();
  }

  private render() {
    this.root.render(
      React.createElement(ActionMenuContent, {
        mode: this.mode,
        onFill: () => this.handlers?.fill(),
        onClear: () => this.handlers?.clear(),
        onEdit: this.handlers?.edit,
        onCancel: this.mode === 'selection' ? this.handlers?.cancel : undefined,
      })
    );
    this.container.style.display = this.mode === 'hidden' ? 'none' : 'flex';
  }

  /** グローバルメニュー（非選択時） */
  showGlobal(handlers: { fill: () => void; clear: () => void; edit?: () => void }) {
    this.mode = 'global';
    this.handlers = handlers;
    const rect = this.view._canvas.getBoundingClientRect();
    this.container.style.left = `${rect.left + 8}px`;
    this.container.style.top = `${rect.top + 8}px`;
    this.render();
  }

  /** 選択範囲用メニュー */
  showSelection(
    bounding: SelectionRect,
    handlers: {
      fill: () => void;
      clear: () => void;
      edit?: () => void;
      cancel: () => void;
    }
  ) {
    this.mode = 'selection';
    this.handlers = handlers;
    const canvasRect = this.view._canvas.getBoundingClientRect();
    const scale = this.view.zoom / 100;
    this.container.style.left = `${canvasRect.left + bounding.x * scale}px`;
    this.container.style.top = `${canvasRect.top + bounding.y * scale - 28}px`;
    this.render();
  }

  hide() {
    this.mode = 'hidden';
    this.render();
  }

  dispose() {
    this.root.unmount();
    this.container.remove();
  }
} 