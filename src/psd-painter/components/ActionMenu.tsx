import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { PsdView } from '../psd-painter-view';
import type { SelectionManager, SelectionRect } from '../viewmodel/SelectionManager';

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
  private selMgr?: SelectionManager;

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
        onFill: () => this.selMgr?.fillSelection(),
        onClear: () => this.selMgr?.clearSelection(),
        onCancel: this.mode === 'selection' ? () => this.selMgr?.cancelSelection() : undefined,
      })
    );
    this.container.style.display = this.mode === 'hidden' ? 'none' : 'flex';
  }

  /** グローバルメニュー（非選択時） */
  showGlobal() {
    this.mode = 'global';
    this.selMgr = this.view.selectionManager; // 最新を取得
    const rect = this.view._canvas.getBoundingClientRect();
    this.container.style.left = `${rect.left + 8}px`;
    this.container.style.top = `${rect.top + 8}px`;
    this.render();
  }

  /** 選択範囲用メニュー */
  showSelection(bounding: SelectionRect, selMgr: SelectionManager) {
    this.mode = 'selection';
    this.selMgr = selMgr;
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