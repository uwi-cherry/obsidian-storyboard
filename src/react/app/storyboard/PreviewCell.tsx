import type { FC } from 'react';
import { t } from '../../../constants/obsidian-i18n';
import TextAreaField from '../../components/TextAreaField';

interface PreviewCellProps {
  prompt?: string;
  onPromptChange: (newVal: string) => void;
}

const PreviewCell: FC<PreviewCellProps> = ({
  prompt,
  onPromptChange,
}) => {
  return (
    <TextAreaField
      value={prompt}
      onChange={onPromptChange}
      placeholder={t('PROMPT_PLACEHOLDER')}
    />
  );
};

export default PreviewCell; 
