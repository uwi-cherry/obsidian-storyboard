import type { CSSProperties } from 'react';
import { TOOL_ICONS } from '../../../constants/icons';
import { t } from '../../../constants/obsidian-i18n';
import { usePainterLayoutStore } from 'src/storage/painter-layout-store';
import IconButtonGroup from '../../utils/IconButtonGroup';

interface ToolbarProps {
  tool: string;
  onChange: (tool: string) => void;
}

export default function Toolbar({ tool, onChange }: ToolbarProps) {
  const { layoutDirection } = usePainterLayoutStore();

  const NAVIGATION_TOOLS = [
    { id: 'settings', title: t('TOOL_SETTINGS'), icon: TOOL_ICONS.settings },
    { id: 'selection', title: t('TOOL_SELECTION'), icon: TOOL_ICONS.selection },
    { id: 'hand', title: t('TOOL_HAND'), icon: TOOL_ICONS.hand },
  ];

  const DRAWING_TOOLS = [
    { id: 'pen', title: t('TOOL_PEN'), icon: TOOL_ICONS.pen },
    { id: 'brush', title: t('TOOL_BRUSH'), icon: TOOL_ICONS.brush },
    { id: 'paint-brush', title: t('TOOL_PAINT_BRUSH'), icon: TOOL_ICONS['paint-brush'] },
    { id: 'color-mixer', title: t('TOOL_COLOR_MIXER'), icon: TOOL_ICONS['color-mixer'] },
    { id: 'eraser', title: t('TOOL_ERASER'), icon: TOOL_ICONS.eraser },
  ];

  const containerClass = layoutDirection === 'horizontal' 
    ? "w-[60px] bg-secondary border-r border-modifier-border flex flex-col gap-1 p-1"
    : "h-[60px] bg-secondary border-b border-modifier-border flex flex-row gap-1 p-1";

  const toolContainerClass = layoutDirection === 'horizontal' 
    ? "flex flex-col gap-1 items-center"
    : "flex flex-row gap-1 items-center";

  const getButtonStyle = (btnId: string) => {
    return tool === btnId ? {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderWidth: '2px',
      borderColor: '#2563eb',
    } as CSSProperties : {};
  };

  const getButtonClass = (btnId: string) => {
    return `w-10 h-10 border-none rounded cursor-pointer flex items-center justify-center transition-all duration-200 ${
      tool === btnId 
        ? 'shadow-lg scale-110 ring-2 ring-opacity-50' 
        : 'bg-primary text-text-normal hover:bg-modifier-hover hover:scale-105'
    }`;
  };

  return (
    <div className={containerClass}>
      <div className={toolContainerClass}>
        <IconButtonGroup
          buttons={NAVIGATION_TOOLS.map(btn => ({
            icon: btn.icon,
            title: btn.title,
            className: getButtonClass(btn.id),
            style: getButtonStyle(btn.id),
            onClick: () => onChange(btn.id)
          }))}
          direction={layoutDirection === 'horizontal' ? 'vertical' : 'horizontal'}
          gap="gap-1"
        />
        <div className={layoutDirection === 'horizontal' ? 'w-8 h-px bg-modifier-border my-1' : 'h-full w-px bg-modifier-border mx-1'} />
        <IconButtonGroup
          buttons={DRAWING_TOOLS.map(btn => ({
            icon: btn.icon,
            title: btn.title,
            className: getButtonClass(btn.id),
            style: getButtonStyle(btn.id),
            onClick: () => onChange(btn.id)
          }))}
          direction={layoutDirection === 'horizontal' ? 'vertical' : 'horizontal'}
          gap="gap-1"
        />
      </div>
    </div>
  );
}
