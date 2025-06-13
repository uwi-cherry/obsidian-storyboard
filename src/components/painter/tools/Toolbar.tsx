import { TOOL_ICONS } from '../../../constants/icons';
import { t } from '../../../constants/obsidian-i18n';
import { usePainterLayoutStore } from 'src/storage/painter-layout-store';

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


  return (
    <div className={containerClass}>
      <div className={toolContainerClass}>
        {NAVIGATION_TOOLS.map(btn => {
          const isActive = tool === btn.id;
          return (
            <label
              key={btn.id}
              className="w-10 h-10 p-1 rounded cursor-pointer flex items-center justify-center transition-all duration-200 border"
              style={isActive ? {
                backgroundColor: 'var(--background-modifier-hover)',
                color: 'var(--text-normal)',
                borderColor: 'var(--background-modifier-border-hover)'
              } : {
                backgroundColor: 'var(--background-primary)',
                borderColor: 'var(--background-modifier-border)',
                color: 'var(--text-normal)'
              }}
              title={btn.title}
            >
              <input
                type="radio"
                name="navigation-tool"
                value={btn.id}
                checked={isActive}
                onChange={() => onChange(btn.id)}
                className="hidden"
              />
              <span dangerouslySetInnerHTML={{ __html: btn.icon }} />
            </label>
          );
        })}
        <div className={layoutDirection === 'horizontal' ? 'w-8 h-px bg-modifier-border my-1' : 'h-full w-px bg-modifier-border mx-1'} />
        {DRAWING_TOOLS.map(btn => {
          const isActive = tool === btn.id;
          return (
            <label
              key={btn.id}
              className="w-10 h-10 p-1 rounded cursor-pointer flex items-center justify-center transition-all duration-200 border"
              style={isActive ? {
                backgroundColor: 'var(--background-modifier-hover)',
                color: 'var(--text-normal)',
                borderColor: 'var(--background-modifier-border-hover)'
              } : {
                backgroundColor: 'var(--background-primary)',
                borderColor: 'var(--background-modifier-border)',
                color: 'var(--text-normal)'
              }}
              title={btn.title}
            >
              <input
                type="radio"
                name="drawing-tool"
                value={btn.id}
                checked={isActive}
                onChange={() => onChange(btn.id)}
                className="hidden"
              />
              <span dangerouslySetInnerHTML={{ __html: btn.icon }} />
            </label>
          );
        })}
      </div>
    </div>
  );
}
