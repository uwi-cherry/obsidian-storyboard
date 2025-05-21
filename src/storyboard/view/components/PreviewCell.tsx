import React from 'react';
import { t } from 'src/i18n';
import { BUTTON_ICONS } from 'src/icons';

interface PreviewCellProps {
  prompt?: string;
  startTime: string;
  endTime?: string;
  onPromptChange: (newVal: string) => void;
  onEndTimeChange: (newVal: string) => void;
}

const PreviewCell: React.FC<PreviewCellProps> = ({
  prompt,
  startTime,
  endTime,
  onPromptChange,
  onEndTimeChange,
}) => {
  return (
    <div className="flex flex-col gap-1 items-start">
      <textarea
        value={prompt || ''}
        onChange={e => onPromptChange(e.target.value)}
        placeholder="prompt"
        className="w-full border-2 border-modifier-border p-1 text-xs bg-transparent"
      />
      <div className="flex items-center gap-1 text-xs">
        <input
          type="text"
          className="w-20 border border-modifier-border p-1 bg-transparent"
          value={startTime}
          readOnly
        />
        <span>→</span>
        <input
          type="text"
          className="w-20 border border-modifier-border p-1 bg-transparent"
          value={endTime || ''}
          onChange={e => onEndTimeChange(e.target.value)}
          placeholder="00:00:00"
        />
      </div>
      <button
        className="p-1 bg-accent text-on-accent rounded cursor-pointer hover:bg-accent-hover flex items-center justify-center text-xs"
        onClick={() => {}}
        title={t('GENERATE_PREVIEW')}
        dangerouslySetInnerHTML={{ __html: BUTTON_ICONS.aiGenerate }}
      />
    </div>
  );
};

export default PreviewCell;
