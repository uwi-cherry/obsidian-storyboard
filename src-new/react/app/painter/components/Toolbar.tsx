import React from 'react';
import { TOOL_ICONS } from '../../../../icons';
import { t } from '../../../../obsidian-i18n';

interface ToolbarProps {
  tool: string;
  onChange: (tool: string) => void;
}

const TOOLS = [
  { id: 'brush', title: t('TOOL_BRUSH'), icon: TOOL_ICONS.brush },
  { id: 'eraser', title: t('TOOL_ERASER'), icon: TOOL_ICONS.eraser },
  { id: 'hand', title: t('TOOL_HAND'), icon: TOOL_ICONS.hand }
];

export default function Toolbar({ tool, onChange }: ToolbarProps) {
  return (
    <div className="w-[60px] bg-secondary border-r border-modifier-border flex flex-col gap-1 p-1">
      {TOOLS.map(btn => (
        <button
          key={btn.id}
          className={`w-10 h-10 border-none bg-primary text-text-normal rounded cursor-pointer flex items-center justify-center hover:bg-modifier-hover ${tool === btn.id ? 'bg-accent text-on-accent' : ''}`}
          title={btn.title}
          onClick={() => onChange(btn.id)}
          dangerouslySetInnerHTML={{ __html: btn.icon }}
        />
      ))}
    </div>
  );
}
