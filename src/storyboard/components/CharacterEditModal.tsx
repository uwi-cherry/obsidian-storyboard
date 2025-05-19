import React, { useState, useEffect } from 'react';
import { CharacterInfo, StoryboardFrame } from '../storyboard-types';

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
      <div className="bg-white rounded shadow-lg p-6 w-[400px] max-h-[80vh] overflow-auto">
        <h2 className="text-lg font-bold mb-2">キャラクター編集</h2>
        <div className="flex gap-2 items-center mb-4">
          <select value={selectedIdx} onChange={handleSelectChange} className="border rounded px-2 py-1 flex-1">
            {editChars.map((char, idx) => (
              <option key={idx} value={idx}>{char.name || '(未設定)'}</option>
            ))}
          </select>
          <button className="text-blue-600 px-2 py-1 border rounded" onClick={handleAddChar}>＋</button>
          <button 
            className="text-red-500 px-2 py-1 border rounded" 
            onClick={handleDeleteChar} 
            disabled={editChars.length === 0 || usedCharacterNames.includes(selectedChar.name)}
            title={usedCharacterNames.includes(selectedChar.name) ? "シナリオで使用中のキャラクターは削除できません" : ""}
          >
            削除
          </button>
        </div>
        <div className="mb-2">
          <label className="block text-sm mb-1">キャラ名</label>
          <input className="border rounded px-2 py-1 w-full" value={selectedChar.name} onChange={e => handleNameChange(e.target.value)} placeholder="キャラ名" />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">説明</label>
          <input className="border rounded px-2 py-1 w-full" value={selectedChar.attributes['説明'] || ''} onChange={e => handleDescriptionChange(e.target.value)} placeholder="説明" />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="text-gray-600 px-2 py-1 border rounded" onClick={onClose}>キャンセル</button>
          <button className="text-white bg-blue-600 px-2 py-1 rounded" onClick={() => { onSave(editChars); onClose(); }}>保存</button>
        </div>
      </div>
    </div>
  );
};

export default CharacterEditModal; 