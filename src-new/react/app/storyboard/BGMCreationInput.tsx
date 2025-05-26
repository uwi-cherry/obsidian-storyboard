import React from 'react';
import { t } from '../../../constants/obsidian-i18n';

interface BGMCreationInputProps {
  value: string;
  onChange: (value: string) => void;
  onDelete?: () => void;
  onSubmit?: (value: string) => void;
  inputRef?: (element: HTMLInputElement | null) => void;
  className?: string;
  placeholder?: string;
  columnsCount?: number;
  isNewChapter?: boolean;
}

const BGMCreationInput: React.FC<BGMCreationInputProps> = ({
  value,
  onChange,
  onDelete,
  onSubmit,
  inputRef,
  className = '',
  placeholder,
  columnsCount,
  isNewChapter = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (isNewChapter && onSubmit && newValue.length > 0) {
      onSubmit(newValue);
    }
  };

  const defaultPlaceholder = isNewChapter 
    ? t('NEW_CHAPTER_BGM_PLACEHOLDER') 
    : t('BGM_PROMPT_PLACEHOLDER');
  
  const label = isNewChapter 
    ? t('NEW_CHAPTER_BGM_LABEL') 
    : t('BGM_LABEL');

  if (isNewChapter && columnsCount !== undefined) {
    return (
      <table className="w-full border-collapse border border-modifier-border mb-4 table-fixed">
        <tbody>
          <tr className="bg-secondary hover:bg-modifier-hover">
            <td className="border border-modifier-border px-4 py-2" colSpan={columnsCount + 1}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">🎵 {label}:</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 border-none bg-transparent focus:outline-none text-sm text-text-normal placeholder:text-text-muted"
                  placeholder={placeholder || defaultPlaceholder}
                  value={value}
                  onChange={handleChange}
                />
                {onSubmit && (
                  <button
                    className="p-1 bg-accent text-on-accent rounded text-xs hover:bg-accent-hover"
                    onClick={() => onSubmit('')}
                  >
                    {t('ADD_SILENT_SECTION')}
                  </button>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 border border-modifier-border rounded bg-secondary ${className}`}>
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm text-text-muted min-w-fit">🎵 {label}:</span>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 border-none bg-transparent focus:outline-none text-sm text-text-normal placeholder:text-text-muted"
          placeholder={placeholder || defaultPlaceholder}
          value={value}
          onChange={isNewChapter ? handleChange : (e) => onChange(e.target.value)}
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
