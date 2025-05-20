import React, { useState, useEffect, useCallback, useRef } from 'react';
import { t } from 'src/i18n';
import { App } from 'obsidian';
import { StoryboardData, StoryboardFrame, CharacterInfo } from '../storyboard-types'; 
import CharacterEditModal from './components/CharacterEditModal';
import EditableTable, { ColumnDef } from './components/EditableTable';
import ImageInputCell from './components/ImageInputCell';
import SpeakerDialogueCell from './components/SpeakerDialogueCell';
import { t } from 'src/i18n';

interface StoryboardReactViewProps {
  initialData: StoryboardData;
  onDataChange: (data: StoryboardData) => void;
  app: App;
}

const StoryboardReactView: React.FC<StoryboardReactViewProps> = ({ initialData, onDataChange, app }) => {
  const [storyboard, setStoryboard] = useState<StoryboardData>(initialData);
  const [charModalOpen, setCharModalOpen] = useState(false);

  // セリフ欄（textarea）のref配列
  const dialogueRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  // 話者欄（input）のref配列
  // プロンプト欄（textarea）のref配列
  const promptRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    setStoryboard(initialData);
  }, [initialData]);

  const handleCellChange = useCallback(
    (rowIndex: number, key: keyof StoryboardFrame, value: StoryboardFrame[keyof StoryboardFrame]) => {
      setStoryboard(prevStoryboard => {
        if (!prevStoryboard) return prevStoryboard;
        const updatedFrames = prevStoryboard.frames.map((frame, index) =>
          index === rowIndex ? { ...frame, [key]: value } : frame
        );
        const updatedStoryboard = { ...prevStoryboard, frames: updatedFrames };
        onDataChange(updatedStoryboard);
        return updatedStoryboard;
      });
    },
    [onDataChange]
  );

  const handleAddRow = () => {
    const newFrame = { imageUrl: '', speaker: '', dialogues: '', imagePrompt: '' } as StoryboardFrame;
    setStoryboard(prevStoryboard => {
      const updatedStoryboard = {
        ...prevStoryboard,
        frames: [...(prevStoryboard?.frames || []), newFrame]
      };
      onDataChange(updatedStoryboard);
      return updatedStoryboard;
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    setStoryboard(prevStoryboard => {
      const updatedStoryboard = {
        ...prevStoryboard,
        frames: prevStoryboard.frames.filter((frame, index) => index !== rowIndex)
      };
      onDataChange(updatedStoryboard);
      return updatedStoryboard;
    });
  };

  const handleMoveRowUp = (rowIndex: number) => {
    if (rowIndex <= 0) return;
    setStoryboard(prevStoryboard => {
      const frames = [...prevStoryboard.frames];
      const temp = frames[rowIndex];
      frames[rowIndex] = frames[rowIndex - 1];
      frames[rowIndex - 1] = temp;
      const updatedStoryboard = { ...prevStoryboard, frames };
      onDataChange(updatedStoryboard);
      return updatedStoryboard;
    });
  };

  const handleMoveRowDown = (rowIndex: number) => {
    if (rowIndex >= storyboard.frames.length - 1) return;
    setStoryboard(prevStoryboard => {
      const frames = [...prevStoryboard.frames];
      const temp = frames[rowIndex];
      frames[rowIndex] = frames[rowIndex + 1];
      frames[rowIndex + 1] = temp;
      const updatedStoryboard = { ...prevStoryboard, frames };
      onDataChange(updatedStoryboard);
      return updatedStoryboard;
    });
  };

  const handleInsertRowBelow = (rowIndex: number) => {
    const newFrame = { imageUrl: '', speaker: '', dialogues: '', imagePrompt: '' } as StoryboardFrame;
    setStoryboard(prevStoryboard => {
      const frames = [...prevStoryboard.frames];
      frames.splice(rowIndex + 1, 0, newFrame);
      const updatedStoryboard = { ...prevStoryboard, frames };
      onDataChange(updatedStoryboard);
      return updatedStoryboard;
    });
  };

  const handleSaveCharacters = (chars: CharacterInfo[]) => {
    setStoryboard(prev => {
      // 変更前後のキャラ名対応リストを作成
      const oldNames = (prev.characters ?? []).map(c => c.name);
      const newNames = chars.map(c => c.name);
      const nameMap: Record<string, string> = {};
      
      // キャラクターセクションの名前変更を記録
      oldNames.forEach((oldName, idx) => {
        if (oldName && oldName !== newNames[idx]) {
          nameMap[oldName] = newNames[idx];
        }
      });

      // frames内のspeakerを一括変換
      const updatedFrames = prev.frames.map(frame => {
        const newSpeaker = nameMap[frame.speaker];
        if (newSpeaker) {
          return { ...frame, speaker: newSpeaker };
        }
        return frame;
      });

      const updated = { ...prev, characters: chars, frames: updatedFrames };
      onDataChange(updated);
      return updated;
    });
  };

  const getUniqueSpeakers = (storyboardData: StoryboardData | null): string[] => {
    if (!storyboardData) return [];
    // キャラクターセクションのキャラ名
    const charNames = (storyboardData.characters ?? []).map(c => c.name);
    // シナリオセクションの話者名
    const frameSpeakers = (storyboardData.frames ?? []).map(f => f.speaker);
    // 両方を重複なくマージ
    return Array.from(new Set([...charNames, ...frameSpeakers])).filter(s => typeof s === 'string' && s.trim() !== '');
  };

  const uniqueSpeakers = getUniqueSpeakers(storyboard);

  // 編集モーダルに渡す全キャラリスト（説明がない場合は空欄で補完）
  const allSpeakers = getUniqueSpeakers(storyboard);
  const allCharacters: CharacterInfo[] = allSpeakers.map(name => {
    const found = (storyboard.characters ?? []).find(c => c.name === name);
    return found ? found : { name, attributes: { 説明: '' } };
  });

  const columns: ColumnDef<StoryboardFrame>[] = [
    {
      key: 'imageUrl',
      header: t('IMAGE_HEADER'),
      renderCell: (value: StoryboardFrame['imageUrl'], row: StoryboardFrame, onCellChangeForRow: (columnKey: keyof StoryboardFrame, newValue: StoryboardFrame[keyof StoryboardFrame]) => void, rowIndex: number) => (
        <ImageInputCell
          imageUrl={row.imageUrl}
          imagePrompt={row.imagePrompt}
          onImageUrlChange={(newUrl: string | null) => onCellChangeForRow('imageUrl', newUrl || '')}
          onImagePromptChange={(newImagePrompt: string) => onCellChangeForRow('imagePrompt', newImagePrompt)}
          app={app}
          focusPrevCellPrompt={() => {
            if (promptRefs.current[rowIndex - 1]) {
              promptRefs.current[rowIndex - 1]?.focus();
            }
          }}
          focusNextCellPrompt={() => {
            if (promptRefs.current[rowIndex + 1]) {
              promptRefs.current[rowIndex + 1]?.focus();
            }
          }}
          refCallback={(el: HTMLTextAreaElement | null) => {
            promptRefs.current[rowIndex] = el;
          }}
        />
      ),
    },
    {
      key: 'dialogues',
      header: t('SPEAKER_DIALOGUE_HEADER'),
      renderCell: (value: StoryboardFrame['dialogues'], row: StoryboardFrame, onCellChangeForRow: (columnKey: keyof StoryboardFrame, newValue: StoryboardFrame[keyof StoryboardFrame]) => void, rowIndex: number) => (
        <SpeakerDialogueCell
          dialogue={value || ''}
          speaker={row.speaker || ''}
          speakersList={uniqueSpeakers}
          onDialogueChange={(newDialogue: string) => onCellChangeForRow('dialogues', newDialogue)}
          onSpeakerChange={(newSpeaker: string) => onCellChangeForRow('speaker', newSpeaker)}
          focusPrevCellDialogue={() => {
            if (dialogueRefs.current[rowIndex - 1]) {
              dialogueRefs.current[rowIndex - 1]?.focus();
            }
          }}
          focusNextCellDialogue={() => {
            if (dialogueRefs.current[rowIndex + 1]) {
              dialogueRefs.current[rowIndex + 1]?.focus();
            }
          }}
          refCallback={(el: HTMLTextAreaElement | null) => {
            dialogueRefs.current[rowIndex] = el;
          }}
          isFirstRow={rowIndex === 0}
          onEditCharacters={() => setCharModalOpen(true)}
        />
      ),
    },
  ];

  const handleRowSelect = useCallback((row: StoryboardFrame, index: number) => {
    // サイドバーへ選択行を通知
    window.dispatchEvent(
      new CustomEvent('storyboard-row-selected', {
        detail: { rowIndex: index, frame: row },
      })
    );
  }, []);

  // サイドバーからの画像・プロンプト更新を受信
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const { rowIndex, imageUrl, imagePrompt } = custom.detail || {};
      if (rowIndex === undefined) return;
      setStoryboard(prev => {
        if (!prev) return prev;
        if (!prev.frames[rowIndex]) return prev;
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx !== rowIndex) return f;
          return {
            ...f,
            imageUrl: imageUrl !== undefined ? imageUrl : f.imageUrl,
            imagePrompt: imagePrompt !== undefined ? imagePrompt : f.imagePrompt,
          };
        });
        const updated = { ...prev, frames: updatedFrames };
        onDataChange(updated);
        return updated;
      });
    };
    window.addEventListener('psd-sidebar-update-image', handler);
    return () => window.removeEventListener('psd-sidebar-update-image', handler);
  }, [onDataChange]);

  return (
    <>
      <CharacterEditModal
        open={charModalOpen}
        characters={allCharacters}
        frames={storyboard.frames}
        onClose={() => setCharModalOpen(false)}
        onSave={handleSaveCharacters}
      />
      <EditableTable<StoryboardFrame>
        data={storyboard.frames}
        columns={columns.map((col) =>
          col.key === 'dialogues'
            ? {
                ...col,
                renderCell: (value, row, onCellChangeForRow, rowIndex) =>
                  col.renderCell?.(value, row, onCellChangeForRow, rowIndex),
              }
            : col
        )}
        onCellChange={handleCellChange}
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        onMoveRowUp={handleMoveRowUp}
        onMoveRowDown={handleMoveRowDown}
        onInsertRowBelow={handleInsertRowBelow}
        onRowClick={handleRowSelect}
      />
    </>
  );
};

export default StoryboardReactView;
