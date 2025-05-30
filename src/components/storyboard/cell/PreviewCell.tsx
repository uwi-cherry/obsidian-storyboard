import { FC } from "react";
import TextAreaField from "src/components/utils/TextAreaField";
import { t } from "src/constants/obsidian-i18n";


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
