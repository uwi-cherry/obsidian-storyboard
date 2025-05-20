import React, { useState, useEffect } from 'react';
import { CharacterInfo, StoryboardFrame } from 'src/storyboard/storyboard-types';
import { t } from 'src/i18n';

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
    setEditChars(characters);
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
  if (!open) return null;
  const selectedChar = editChars[selectedIdx] || { name: '', attributes: { 説明: '' } };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-primary rounded shadow-lg p-6 w-[400px] max-h-[80vh] overflow-auto">
        <h2 className="text-lg font-bold mb-2">{t('CHARACTER_EDIT')}</h2>
        <div className="flex gap-2 items-center mb-4">
          <select value={selectedIdx} onChange={handleSelectChange} className="border border-modifier-border rounded px-2 py-1 flex-1">
            {editChars.map((char, idx) => (
              <option key={idx} value={idx}>{char.name || `(${t('NO_SPEAKER')})`}</option>
            ))}
          </select>
          <button className="text-accent px-2 py-1 border border-modifier-border rounded" onClick={handleAddChar}>＋</button>
          <button 
            className="text-error px-2 py-1 border border-modifier-border rounded"
            onClick={handleDeleteChar}
            disabled={editChars.length === 0 || usedCharacterNames.includes(selectedChar.name)}
        >
            {t('DELETE')}
        </button>
        </div>
        <div className="mb-2">
          <label className="block text-sm mb-1">{t('CHARACTER_NAME')}</label>
          <input className="border border-modifier-border rounded px-2 py-1 w-full" value={selectedChar.name} onChange={e => handleNameChange(e.target.value)} placeholder={t('CHARACTER_NAME')} />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">{t('DESCRIPTION')}</label>
          <input className="border border-modifier-border rounded px-2 py-1 w-full" value={selectedChar.attributes['説明'] || ''} onChange={e => handleDescriptionChange(e.target.value)} placeholder={t('DESCRIPTION')} />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="text-muted px-2 py-1 border border-modifier-border rounded" onClick={onClose}>{t('CANCEL')}</button>
          <button className="text-on-accent bg-accent px-2 py-1 rounded" onClick={() => { onSave(editChars); onClose(); }}>{t('SAVE')}</button>
        </div>
      </div>
    </div>
  );
};

export default CharacterEditModal; 