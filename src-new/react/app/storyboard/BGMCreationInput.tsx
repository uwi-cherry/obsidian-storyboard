import React from 'react';
import { t } from '../../../obsidian-i18n';

interface BGMCreationInputProps {
  value: string;
  onChange: (value: string) => void;
  onDelete?: () => void;
  inputRef?: (element: HTMLInputElement | null) => void;
  className?: string;
  placeholder?: string;
}

const BGMCreationInput: React.FC<BGMCreationInputProps> = ({
  value,
  onChange,
  onDelete,
  inputRef,
  className = '',
  placeholder = t('BGM_PROMPT_PLACEHOLDER')
}) => {
  return (
    <div className={`flex items-center gap-2 p-2 border border-modifier-border rounded bg-secondary ${className}`}>
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm text-text-muted min-w-fit">🎵 {t('BGM_LABEL')}:</span>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border-none bg-transparent focus:outline-none text-sm text-text-normal placeholder:text-text-muted"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {onDelete && (
        <button
          className="text-text-faint hover:text-error text-sm px-1 py-0.5 leading-none min-w-fit"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          title={t('DELETE')}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default BGMCreationInput; 