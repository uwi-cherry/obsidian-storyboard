import React, { useEffect, useState } from 'react';
import { ADD_ICON_SVG, TABLE_ICONS } from '../../../icons';
import { t } from '../../../obsidian-i18n';
import IconButtonGroup from '../../components/IconButtonGroup';
import Modal from '../../components/Modal';
import { CharacterInfo, StoryboardFrame } from '../../types/storyboard';

const CharacterEditModal: React.FC<{
  open: boolean;
  characters: CharacterInfo[];
  frames: StoryboardFrame[];  // シナリオのフレームデータを追加
  onClose: () => void;
  onSave: (chars: CharacterInfo[]) => void;
}> = ({ open, characters, frames, onClose, onSave }) => {
  const [editChars, setEditChars] = useState<CharacterInfo[]>(characters);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // 使用中のキャラクター名を取得
  const usedCharacterNames = Array.from(new Set(frames.map(frame => frame.speaker).filter(Boolean)));

  useEffect(() => {
    // キャラクター配列が空の場合、デフォルトで空文字のキャラクターを1つ追加
    const initialChars = characters.length === 0 
      ? [{ name: '', attributes: { 説明: '' } }] 
      : characters;
    setEditChars(initialChars);
    setSelectedIdx(0);
  }, [characters, open]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIdx(Number(e.target.value));
  };
  const handleDescriptionChange = (value: string) => {
    setEditChars(chars => chars.map((c, i) => i === selectedIdx ? { ...c, attributes: { 説明: value } } : c));
  };
  const handleNameChange = (value: string) => {
    setEditChars(chars => chars.map((c, i) => i === selectedIdx ? { ...c, name: value } : c));
  };
  const handleAddChar = () => {
    setEditChars(chars => [...chars, { name: '', attributes: { 説明: '' } }]);
    setSelectedIdx(editChars.length); // 新規キャラに即選択
  };
  const handleDeleteChar = () => {
    if (editChars.length === 0) return;
    const selectedChar = editChars[selectedIdx];
    if (usedCharacterNames.includes(selectedChar.name)) return; // 使用中のキャラは削除不可
    const newChars = editChars.filter((_, i) => i !== selectedIdx);
    setEditChars(newChars);
    setSelectedIdx(Math.max(0, selectedIdx - 1));
  };

  const selectedChar = editChars[selectedIdx] || { name: '', attributes: { 説明: '' } };

  const footer = (
    <>
      <button className="text-muted px-2 py-1 border border-modifier-border rounded" onClick={onClose}>
        {t('CANCEL')}
      </button>
      <button className="text-on-accent bg-accent px-2 py-1 rounded" onClick={() => { onSave(editChars); onClose(); }}>
        {t('SAVE')}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('CHARACTER_EDIT')}
      footer={footer}
    >
      <div className="flex gap-2 items-center mb-4">
        <select value={selectedIdx} onChange={handleSelectChange} className="border border-modifier-border rounded px-2 py-1 flex-1">
          {editChars.map((char, idx) => (
            <option key={idx} value={idx}>{char.name || `(${t('NO_SPEAKER')})`}</option>
          ))}
        </select>
        <IconButtonGroup
          buttons={[
            {
              icon: ADD_ICON_SVG,
              onClick: handleAddChar,
              title: '追加',
              variant: 'secondary'
            },
            {
              icon: TABLE_ICONS.delete,
              onClick: handleDeleteChar,
              title: t('DELETE'),
              variant: 'danger',
              disabled: editChars.length === 0 || usedCharacterNames.includes(selectedChar.name)
            }
          ]}
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">{t('CHARACTER_NAME')}</label>
        <input className="border border-modifier-border rounded px-2 py-1 w-full" value={selectedChar.name} onChange={e => handleNameChange(e.target.value)} placeholder={t('CHARACTER_NAME')} />
      </div>
      <div className="mb-4">
        <label className="block text-sm mb-1">{t('DESCRIPTION')}</label>
        <input className="border border-modifier-border rounded px-2 py-1 w-full" value={selectedChar.attributes['説明'] || ''} onChange={e => handleDescriptionChange(e.target.value)} placeholder={t('DESCRIPTION')} />
      </div>
    </Modal>
  );
};

export default CharacterEditModal; 