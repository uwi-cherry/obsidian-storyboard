import React, { useRef, useEffect } from 'react';
import { t } from 'src/i18n';

interface SpeakerDialogueCellProps {
  speaker: string;
  dialogue: string;
  speakersList: string[];
  onSpeakerChange: (newSpeaker: string) => void;
  onDialogueChange: (newDialogue: string) => void;
  className?: string;
  focusPrevCellDialogue?: () => void;
  focusNextCellDialogue?: () => void;
  refCallback?: (el: HTMLTextAreaElement | null) => void;
  isFirstRow?: boolean;
  onEditCharacters?: () => void;
}

const SpeakerDialogueCell: React.FC<SpeakerDialogueCellProps> = ({
  speaker,
  dialogue,
  speakersList,
  onSpeakerChange,
  onDialogueChange,
  className = '',
  focusPrevCellDialogue,
  focusNextCellDialogue,
  refCallback,
  onEditCharacters,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (refCallback) {
      refCallback(textareaRef.current);
    }
    return () => {
      if (refCallback) refCallback(null);
    };
  }, [refCallback]);

  const handleDialogueTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDialogueChange(e.target.value);
  };

  const handleDialogueKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    if (e.key === 'ArrowUp') {
      if (selectionStart === 0) {
        e.preventDefault();
        if (focusPrevCellDialogue) focusPrevCellDialogue();
      }
    } else if (e.key === 'ArrowDown') {
      if (selectionEnd === value.length) {
        e.preventDefault();
        if (focusNextCellDialogue) focusNextCellDialogue();
      }
    }
  };

  const allSpeakers = Array.from(new Set([
    ...(speakersList || []),
    speaker
  ])).filter(s => s && s.trim() !== '');

  return (
    <div
      className={`flex flex-col gap-1 w-full justify-start ${className}`}
    >
      <div className="flex items-center">
        <select
          value={speaker}
          onChange={e => {
            if (e.target.value === "__edit__") {
              onEditCharacters && onEditCharacters();
              // 選択状態を元に戻すためにblur
              e.target.blur();
              return;
            }
            onSpeakerChange(e.target.value);
          }}
          className="appearance-none bg-transparent border-none font-bold text-lg focus:outline-none cursor-pointer"
          style={{
            boxShadow: 'none',
            outline: 'none',
            border: 'none',
            background: 'transparent',
            color: !speaker ? 'var(--text-faint)' : undefined,
            width: 'auto',
            minWidth: 0,
            maxWidth: '100%',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
          }}
        >
          <option value="" className="text-text-faint">{t('NO_SPEAKER')}</option>
          {allSpeakers.map((name, idx) => (
            <option key={idx} value={name} style={{ color: 'var(--text-normal)' }}>{name}</option>
          ))}
          <option value="__edit__" className="text-text-faint">{t('EDIT_CHARACTERS')}</option>
        </select>
      </div>
      <textarea
        ref={textareaRef}
        value={dialogue}
        onChange={handleDialogueTextareaChange}
        onKeyDown={handleDialogueKeyDown}
        placeholder={t('DIALOGUE_PLACEHOLDER')}
        className="w-full border-none focus:border-none focus:outline-none focus:shadow-none shadow-none rounded-none bg-transparent p-0 text-text-normal placeholder-text-faint leading-tight resize-none field-sizing-content overflow-y-hidden [@supports_not(field-sizing:content)]:overflow-y-auto mt-2"
      />
    </div>
  );
};

export default SpeakerDialogueCell;
