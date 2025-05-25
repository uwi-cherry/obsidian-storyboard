import React from 'react';
import { LayoutDirection } from '../../../../obsidian-api/zustand/storage/painter-layout-store';

interface ColorPropertiesProps {
  color: string;
  setColor: (color: string) => void;
  layoutDirection: LayoutDirection;
}

export default function ColorProperties({ color, setColor, layoutDirection }: ColorPropertiesProps) {
  const containerClass = layoutDirection === 'horizontal'
    ? "p-2 bg-secondary border-r border-modifier-border w-[80px] flex flex-col items-center gap-2"
    : "p-2 bg-secondary border-r border-modifier-border h-[80px] flex flex-row items-center gap-2";

  return (
    <div className={containerClass}>
      <div className="text-text-muted text-xs">カラー</div>
      <input
        type="color"
        className="w-12 h-12 p-0 border-2 border-modifier-border rounded cursor-pointer"
        value={color}
        onChange={e => setColor(e.currentTarget.value)}
      />
    </div>
  );
} 