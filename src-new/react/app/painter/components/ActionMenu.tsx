import React from 'react';

interface ActionMenuProps {
  handlers: {
    fill: () => void;
    clear: () => void;
    edit?: () => void;
    cancel?: () => void;
  };
  mode?: 'global' | 'selection' | 'hidden';
  position?: { x: number; y: number };
}

const ActionMenu: React.FC<ActionMenuProps> = ({ 
  handlers, 
  mode = 'global',
  position = { x: 8, y: 8 }
}) => {
  if (mode === 'hidden') return null;

  return (
    <div
      className="absolute flex gap-1 bg-secondary border border-modifier-border p-1 rounded shadow-lg z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button 
        className="px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
        onClick={handlers.fill}
        title="塗りつぶし"
      >
        塗りつぶし
      </button>
      
      <button 
        className="px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
        onClick={handlers.clear}
        title="クリア"
      >
        クリア
      </button>
      
      {handlers.edit && (
        <button 
          className="px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
          onClick={handlers.edit}
          title="編集"
        >
          編集
        </button>
      )}
      
      {mode === 'selection' && handlers.cancel && (
        <button 
          className="px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer"
          onClick={handlers.cancel}
          title="キャンセル"
        >
          キャンセル
        </button>
      )}
    </div>
  );
};

export default ActionMenu; 