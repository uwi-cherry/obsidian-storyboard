import React from 'react';
import { TOOL_ICONS } from 'src-new/constants/icons';
import { t } from 'src-new/constants/obsidian-i18n';
import { usePainterLayoutStore } from 'src-new/zustand/storage/painter-layout-store';

interface ToolbarProps {
  tool: string;
  onChange: (tool: string) => void;
}

export default function Toolbar({ tool, onChange }: ToolbarProps) {
  const { layoutDirection } = usePainterLayoutStore();

  const TOOLS = [
    { id: 'settings', title: '設定', icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>' },
    { id: 'pen', title: t('TOOL_PEN'), icon: TOOL_ICONS.pen },
    { id: 'brush', title: t('TOOL_BRUSH'), icon: TOOL_ICONS.brush },
    { id: 'paint-brush', title: t('TOOL_PAINT_BRUSH'), icon: TOOL_ICONS['paint-brush'] },
    { id: 'color-mixer', title: t('TOOL_COLOR_MIXER'), icon: TOOL_ICONS['color-mixer'] },
    { id: 'eraser', title: t('TOOL_ERASER'), icon: TOOL_ICONS.eraser },
    { id: 'selection', title: t('TOOL_SELECTION'), icon: TOOL_ICONS.selection },
    { id: 'hand', title: t('TOOL_HAND'), icon: TOOL_ICONS.hand }
  ];

  const containerClass = layoutDirection === 'horizontal' 
    ? "w-[60px] bg-secondary border-r border-modifier-border flex flex-col gap-1 p-1"
    : "h-[60px] bg-secondary border-b border-modifier-border flex flex-row gap-1 p-1";

  const toolContainerClass = layoutDirection === 'horizontal' 
    ? "flex flex-col gap-1"
    : "flex flex-row gap-1";

  return (
    <div className={containerClass}>
      <div className={toolContainerClass}>
        {TOOLS.map(btn => (
          <button
            key={btn.id}
            className={`w-10 h-10 border-none rounded cursor-pointer flex items-center justify-center transition-all duration-200 ${
              tool === btn.id 
                ? 'shadow-lg scale-110 ring-2 ring-opacity-50' 
                : 'bg-primary text-text-normal hover:bg-modifier-hover hover:scale-105'
            }`}
            style={tool === btn.id ? {
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderWidth: '2px',
              borderColor: '#2563eb',
            } as React.CSSProperties : {}}
            title={btn.title}
            onClick={() => onChange(btn.id)}
            dangerouslySetInnerHTML={{ __html: btn.icon }}
          />
        ))}
      </div>
    </div>
  );
}
