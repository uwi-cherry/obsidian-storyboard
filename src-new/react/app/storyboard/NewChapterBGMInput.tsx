import React from 'react';
import { t } from '../../../obsidian-i18n';

interface NewChapterBGMInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  columnsCount: number;
}

const NewChapterBGMInput: React.FC<NewChapterBGMInputProps> = ({
  value,
  onChange,
  onSubmit,
  columnsCount
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length > 0) {
      onSubmit(newValue);
    }
  };

  return (
    <table className="w-full border-collapse border border-modifier-border mb-4 table-fixed">
      <tbody>
        <tr className="bg-secondary hover:bg-modifier-hover">
          <td className="border border-modifier-border px-4 py-2" colSpan={columnsCount + 1}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">🎵 {t('NEW_CHAPTER_BGM_LABEL')}:</span>
              <input
                type="text"
                className="flex-1 border-none bg-transparent focus:outline-none text-sm text-text-normal placeholder:text-text-muted"
                placeholder={t('NEW_CHAPTER_BGM_PLACEHOLDER')}
                value={value}
                onChange={handleChange}
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default NewChapterBGMInput; 