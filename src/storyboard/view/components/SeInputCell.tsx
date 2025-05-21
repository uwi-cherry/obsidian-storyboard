import React, { useRef, useEffect } from 'react';
import { t } from 'src/i18n';

interface SeInputCellProps {
  sePrompt?: string;
  onSePromptChange: (newPrompt: string) => void;
  focusPrevCellPrompt?: () => void;
  focusNextCellPrompt?: () => void;
  refCallback?: (el: HTMLTextAreaElement | null) => void;
}

const SeInputCell: React.FC<SeInputCellProps> = ({
  sePrompt,
  onSePromptChange,
  focusPrevCellPrompt,
  focusNextCellPrompt,
  refCallback,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (refCallback) refCallback(textareaRef.current);
    return () => {
      if (refCallback) refCallback(null);
    };
  }, [refCallback]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSePromptChange(e.target.value);
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    if (e.key === 'ArrowUp' && selectionStart === 0) {
      e.preventDefault();
      focusPrevCellPrompt?.();
    } else if (e.key === 'ArrowDown' && selectionEnd === value.length) {
      e.preventDefault();
      focusNextCellPrompt?.();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={sePrompt || ''}
      onChange={handlePromptChange}
      onKeyDown={handlePromptKeyDown}
      placeholder={t('SE_PROMPT_PLACEHOLDER')}
      className="w-full border-none focus:border-none focus:outline-none focus:shadow-none shadow-none rounded-none bg-transparent p-0 text-text-normal placeholder-text-faint leading-tight resize-none field-sizing-content overflow-y-hidden [@supports_not(field-sizing:content)]:overflow-y-auto"
    />
  );
};

export default SeInputCell;
