import React, { useEffect, useRef } from 'react';
import { t } from '../../../obsidian-i18n';
import TextAreaField from '../../components/TextAreaField';
import useTextareaArrowNav from '../../hooks/useTextareaArrowNav';

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

  const handleDialogueTextareaChange = (newValue: string) => {
    onDialogueChange(newValue);
  };

  const handleDialogueKeyDown = useTextareaArrowNav(textareaRef, {
    onArrowUp: focusPrevCellDialogue,
    onArrowDown: focusNextCellDialogue,
  });

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
      <TextAreaField
        ref={textareaRef}
        value={dialogue}
        onChange={handleDialogueTextareaChange}
        onKeyDown={handleDialogueKeyDown}
        placeholder={t('DIALOGUE_PLACEHOLDER')}
        className="mt-2"
      />
    </div>
  );
};

export default SpeakerDialogueCell; 