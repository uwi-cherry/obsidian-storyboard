import React from 'react';
import { TOOL_ICONS } from 'src-new/constants/icons';
import { t } from 'src-new/constants/obsidian-i18n';
import { usePainterLayoutStore } from 'src-new/obsidian-api/zustand/storage/painter-layout-store';
import MenuIconButton from 'src-new/react/components/MenuIconButton';

interface ToolbarProps {
  tool: string;
  onChange: (tool: string) => void;
}

const TOOLS = [
  { id: 'brush', title: t('TOOL_BRUSH'), icon: TOOL_ICONS.brush },
  { id: 'eraser', title: t('TOOL_ERASER'), icon: TOOL_ICONS.eraser },
  { id: 'selection', title: t('TOOL_SELECTION'), icon: TOOL_ICONS.selection },
  { id: 'hand', title: t('TOOL_HAND'), icon: TOOL_ICONS.hand }
];

export default function Toolbar({ tool, onChange }: ToolbarProps) {
  const { layoutDirection, setLayoutDirection } = usePainterLayoutStore();

  const layoutMenuOptions = [
    {
      label: '横並び',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="4" height="12"/><rect x="7" y="2" width="7" height="12"/></svg>',
      onClick: () => setLayoutDirection('horizontal')
    },
    {
      label: '縦並び',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="4"/><rect x="2" y="7" width="12" height="7"/></svg>',
      onClick: () => setLayoutDirection('vertical')
    }
  ];

  const layoutIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/></svg>';

  const containerClass = layoutDirection === 'horizontal' 
    ? "w-[60px] bg-secondary border-r border-modifier-border flex flex-col gap-1 p-1"
    : "h-[60px] bg-secondary border-b border-modifier-border flex flex-row gap-1 p-1";

  const toolContainerClass = layoutDirection === 'horizontal' 
    ? "flex flex-col gap-1"
    : "flex flex-row gap-1";

  return (
    <div className={containerClass}>
      <MenuIconButton
        icon={layoutIcon}
        title="レイアウト設定"
        options={layoutMenuOptions}
        className="w-10 h-10"
        variant="primary"
      />
      <div className={toolContainerClass}>
        {TOOLS.map(btn => (
          <button
            key={btn.id}
            className={`w-10 h-10 border-none rounded cursor-pointer flex items-center justify-center transition-colors ${
              tool === btn.id 
                ? 'bg-accent text-on-accent shadow-md border-2 border-accent-hover' 
                : 'bg-primary text-text-normal hover:bg-modifier-hover'
            }`}
            title={btn.title}
            onClick={() => onChange(btn.id)}
            dangerouslySetInnerHTML={{ __html: btn.icon }}
          />
        ))}
      </div>
    </div>
  );
}
