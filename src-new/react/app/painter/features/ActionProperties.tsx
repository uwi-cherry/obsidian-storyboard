import React from 'react';
import { LayoutDirection } from '../../../../obsidian-api/zustand/storage/painter-layout-store';

interface ActionPropertiesProps {
  handlers: {
    fill: () => void;
    clear: () => void;
    edit?: () => void;
    cancel?: () => void;
  };
  mode?: 'global' | 'selection' | 'hidden';
  position?: { x: number; y: number };
  isFloating?: boolean;
  layoutDirection?: LayoutDirection;
}

const ActionProperties: React.FC<ActionPropertiesProps> = ({ 
  handlers, 
  mode = 'global',
  position = { x: 8, y: 8 },
  isFloating = false,
  layoutDirection = 'horizontal'
}) => {
  if (mode === 'hidden') return null;

  const baseClasses = "flex gap-1 bg-secondary border border-modifier-border p-2 rounded";
  
  let containerClasses: string;
  if (isFloating) {
    containerClasses = `absolute ${baseClasses} shadow-lg z-50`;
  } else {
    containerClasses = layoutDirection === 'horizontal'
      ? `${baseClasses} border-r border-l-0 border-t-0 border-b-0 w-[250px] flex-col`
      : `${baseClasses} border-b border-l-0 border-t-0 border-r-0 flex-row items-center`;
  }

  const buttonClasses = "px-2 py-1 text-xs bg-primary hover:bg-modifier-hover text-text-normal rounded border-none cursor-pointer";

  return (
    <div
      className={containerClasses}
      style={isFloating ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      } : undefined}
    >
      <button 
        className={buttonClasses}
        onClick={handlers.fill}
        title="塗りつぶし"
      >
        塗りつぶし
      </button>
      
      <button 
        className={buttonClasses}
        onClick={handlers.clear}
        title="クリア"
      >
        クリア
      </button>
      
      {handlers.edit && (
        <button 
          className={buttonClasses}
          onClick={handlers.edit}
          title="編集"
        >
          編集
        </button>
      )}
      
      {mode === 'selection' && handlers.cancel && (
        <button 
          className={buttonClasses}
          onClick={handlers.cancel}
          title="キャンセル"
        >
          キャンセル
        </button>
      )}
    </div>
  );
};

export default ActionProperties; 
