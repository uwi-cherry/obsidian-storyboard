import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SelectionRect } from 'src/painter/painter-types';
import { PsdView } from 'src/painter/view/painter-obsidian-view';
interface ActionMenuContentProps {
  mode: 'global' | 'selection' | 'hidden';
  onFill: () => void;
  onClear: () => void;
  onCancel?: () => void;
}

const ActionMenuContent: React.FC<ActionMenuContentProps> = ({ mode, onFill, onClear, onCancel }) => {
  if (mode === 'hidden') return null;
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        background: 'var(--background-secondary)',
        border: '1px solid var(--background-modifier-border)',
        padding: '4px',
        borderRadius: '4px',
      }}
    >
      <button className="px-2 py-1 text-xs" onClick={onFill}>
        Fill
      </button>
      <button className="px-2 py-1 text-xs" onClick={onClear}>
        Clear
      </button>
      {mode === 'selection' && onCancel && (
        <button className="px-2 py-1 text-xs" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  );
};

export class ActionMenu {
  private view: PsdView;
  private container: HTMLDivElement;
  private root: Root;
  private mode: 'global' | 'selection' | 'hidden' = 'hidden';
  private handlers?: { fill: () => void; clear: () => void; cancel?: () => void };

  constructor(view: PsdView) {
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
        onCancel: this.mode === 'selection' ? this.handlers?.cancel : undefined,
      })
    );
    this.container.style.display = this.mode === 'hidden' ? 'none' : 'flex';
  }

  /** グローバルメニュー（非選択時） */
  showGlobal(handlers: { fill: () => void; clear: () => void }) {
    this.mode = 'global';
    this.handlers = handlers;
    const rect = this.view._canvas.getBoundingClientRect();
    this.container.style.left = `${rect.left + 8}px`;
    this.container.style.top = `${rect.top + 8}px`;
    this.render();
  }

  /** 選択範囲用メニュー */
  showSelection(bounding: SelectionRect, handlers: { fill: () => void; clear: () => void; cancel: () => void }) {
    this.mode = 'selection';
    this.handlers = handlers;
    const canvasRect = this.view._canvas.getBoundingClientRect();
    this.container.style.left = `${canvasRect.left + bounding.x}px`;
    this.container.style.top = `${canvasRect.top + bounding.y - 28}px`;
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