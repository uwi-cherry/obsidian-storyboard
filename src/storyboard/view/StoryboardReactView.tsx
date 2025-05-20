import React, { useState, useEffect, useCallback, useRef } from 'react';
import { t } from 'src/i18n';
import { App, TFile } from 'obsidian';
import { StoryboardData, StoryboardFrame, CharacterInfo } from '../storyboard-types';
import CharacterEditModal from './components/CharacterEditModal';
import EditableTable, { ColumnDef } from './components/EditableTable';
import ImageInputCell from './components/ImageInputCell';
import SpeakerDialogueCell from './components/SpeakerDialogueCell';
import { TABLE_ICONS } from 'src/icons';

interface StoryboardReactViewProps {
  initialData: StoryboardData;
  onDataChange: (data: StoryboardData) => void;
  app: App;
  generateThumbnail: (app: App, file: TFile) => Promise<string | null>;
  createPsd: (
    app: App,
    imageFile?: TFile,
    layerName?: string,
    isOpen?: boolean,
    targetDir?: string
  ) => Promise<TFile>;
}

const StoryboardReactView: React.FC<StoryboardReactViewProps> = ({
  initialData,
  onDataChange,
  app,
  generateThumbnail,
  createPsd,
}) => {
  const [storyboard, setStoryboard] = useState<StoryboardData>(initialData);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [openChapters, setOpenChapters] = useState<boolean[]>(
    initialData.chapters.map(() => true)
  );

  // セリフ欄（textarea）のref配列
  const dialogueRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  // 話者欄（input）のref配列
  // プロンプト欄（textarea）のref配列
  const promptRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    setStoryboard(initialData);
    setOpenChapters(initialData.chapters.map(() => true));
  }, [initialData]);

  const handleCellChange = useCallback(
    (
      chapterIndex: number,
      rowIndex: number,
      key: keyof StoryboardFrame,
      value: StoryboardFrame[keyof StoryboardFrame]
    ) => {
      setStoryboard(prev => {
        const chapters = prev.chapters.map((ch, cIdx) => {
          if (cIdx !== chapterIndex) return ch;
          const frames = ch.frames.map((f, fIdx) =>
            fIdx === rowIndex ? { ...f, [key]: value } : f
          );
          return { ...ch, frames };
        });
        const updated = { ...prev, chapters };
        onDataChange(updated);
        return updated;
      });
    },
    [onDataChange]
  );

  const handleAddRow = (chapterIndex: number) => {
    const newFrame = { imageUrl: '', speaker: '', dialogues: '', imagePrompt: '' } as StoryboardFrame;
    setStoryboard(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        return { ...ch, frames: [...ch.frames, newFrame] };
      });
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
  };

  const handleDeleteRow = (chapterIndex: number, rowIndex: number) => {
    setStoryboard(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        return { ...ch, frames: ch.frames.filter((_, idx) => idx !== rowIndex) };
      });
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
  };

  const handleMoveRowUp = (chapterIndex: number, rowIndex: number) => {
    if (rowIndex <= 0) return;
    setStoryboard(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        const frames = [...ch.frames];
        const temp = frames[rowIndex];
        frames[rowIndex] = frames[rowIndex - 1];
        frames[rowIndex - 1] = temp;
        return { ...ch, frames };
      });
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
  };

  const handleMoveRowDown = (chapterIndex: number, rowIndex: number) => {
    setStoryboard(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        if (rowIndex >= ch.frames.length - 1) return ch;
        const frames = [...ch.frames];
        const temp = frames[rowIndex];
        frames[rowIndex] = frames[rowIndex + 1];
        frames[rowIndex + 1] = temp;
        return { ...ch, frames };
      });
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
  };

  const handleInsertRowBelow = (chapterIndex: number, rowIndex: number) => {
    const newFrame = { imageUrl: '', speaker: '', dialogues: '', imagePrompt: '' } as StoryboardFrame;
    setStoryboard(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        const frames = [...ch.frames];
        frames.splice(rowIndex + 1, 0, newFrame);
        return { ...ch, frames };
      });
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
  };

  const handleAddChapter = (afterIndex: number) => {
    const newChapter = { title: t('UNTITLED_CHAPTER'), frames: [] };
    setStoryboard(prev => {
      const chapters = [...prev.chapters];
      chapters.splice(afterIndex + 1, 0, newChapter);
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
    setOpenChapters(prev => {
      const arr = [...prev];
      arr.splice(afterIndex + 1, 0, true);
      return arr;
    });
  };

  const handleDeleteChapter = (index: number) => {
    setStoryboard(prev => {
      const chapters = prev.chapters.filter((_, i) => i !== index);
      const updated = { ...prev, chapters };
      onDataChange(updated);
      return updated;
    });
    setOpenChapters(prev => prev.filter((_, i) => i !== index));
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
      const chapters = prev.chapters.map(ch => ({
        ...ch,
        frames: ch.frames.map(frame => {
          const newSpeaker = nameMap[frame.speaker];
          return newSpeaker ? { ...frame, speaker: newSpeaker } : frame;
        })
      }));

      const updated = { ...prev, characters: chars, chapters };
      onDataChange(updated);
      return updated;
    });
  };

  const getUniqueSpeakers = (storyboardData: StoryboardData | null): string[] => {
    if (!storyboardData) return [];
    // キャラクターセクションのキャラ名
    const charNames = (storyboardData.characters ?? []).map(c => c.name);
    // シナリオセクションの話者名
    const frameSpeakers = storyboardData.chapters
      .flatMap(ch => ch.frames.map(f => f.speaker));
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
      header: t('HEADER_IMAGE'),
      renderCell: (value: StoryboardFrame['imageUrl'], row: StoryboardFrame, onCellChangeForRow: (columnKey: keyof StoryboardFrame, newValue: StoryboardFrame[keyof StoryboardFrame]) => void, rowIndex: number) => (
        <ImageInputCell
          imageUrl={row.imageUrl}
          imagePrompt={row.imagePrompt}
          onImageUrlChange={(newUrl: string | null) => onCellChangeForRow('imageUrl', newUrl || '')}
          onImagePromptChange={(newImagePrompt: string) => onCellChangeForRow('imagePrompt', newImagePrompt)}
          app={app}
          generateThumbnail={generateThumbnail}
          createPsd={createPsd}
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
      header: t('HEADER_DIALOGUE'),
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
          let targetChapterIndex = 0;
          let idxInChapter = rowIndex;
          for (let i = 0; i < prev.chapters.length; i++) {
            if (idxInChapter < prev.chapters[i].frames.length) {
              targetChapterIndex = i;
              break;
            }
            idxInChapter -= prev.chapters[i].frames.length;
          }
          const chapters = prev.chapters.map((ch, cIdx) => {
            if (cIdx !== targetChapterIndex) return ch;
            const frames = ch.frames.map((f, idx) => {
              if (idx !== idxInChapter) return f;
              return {
                ...f,
                imageUrl: imageUrl !== undefined ? imageUrl : f.imageUrl,
                imagePrompt: imagePrompt !== undefined ? imagePrompt : f.imagePrompt,
              };
            });
            return { ...ch, frames };
          });
          const updated = { ...prev, chapters };
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
        frames={storyboard.chapters.flatMap(ch => ch.frames)}
        onClose={() => setCharModalOpen(false)}
        onSave={handleSaveCharacters}
      />
      <table className="w-full border-collapse border border-modifier-border mb-32 table-fixed">
        <tbody>
          {storyboard.chapters.map((chapter, cIdx) => (
            <React.Fragment key={cIdx}>
              <tr className="bg-secondary">
                <td
                  colSpan={columns.length}
                  className="border border-modifier-border px-4 py-2"
                >
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() =>
                      setOpenChapters(prev =>
                        prev.map((v, i) => (i === cIdx ? !v : v))
                      )
                    }
                  >
                    <span className="mr-2">
                      {openChapters[cIdx] ? '▼' : '▶'}
                    </span>
                    <input
                      className="border border-modifier-border rounded px-2 py-1 flex-1"
                      value={chapter.title}
                      onChange={e => {
                        const title = e.target.value;
                        setStoryboard(prev => {
                          const chapters = prev.chapters.map((ch, idx) =>
                            idx === cIdx ? { ...ch, title } : ch
                          );
                          const updated = { ...prev, chapters };
                          onDataChange(updated);
                          return updated;
                        });
                      }}
                    />
                  </div>
                </td>
                <td className="border border-modifier-border px-1 py-2 text-center align-middle whitespace-nowrap">
                  <div className="flex flex-col items-start gap-y-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleAddChapter(cIdx);
                      }}
                      className="text-text-faint hover:text-accent text-base px-1 py-0.5 leading-none"
                      title={t('INSERT_ROW_BELOW')}
                      dangerouslySetInnerHTML={{ __html: TABLE_ICONS.add }}
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteChapter(cIdx);
                      }}
                      className="text-text-faint hover:text-error text-base px-1 py-0.5 leading-none"
                      title={t('DELETE')}
                      dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
                    />
                  </div>
                </td>
              </tr>
              {openChapters[cIdx] && (
                <tr>
                  <td colSpan={columns.length + 1} className="p-0">
                    <EditableTable<StoryboardFrame>
                      data={chapter.frames}
                      columns={columns.map(col =>
                        col.key === 'dialogues'
                          ? {
                              ...col,
                              renderCell: (value, row, onCellChangeForRow, rowIndex) =>
                                col.renderCell?.(
                                  value,
                                  row,
                                  (k, v) => onCellChangeForRow(k, v),
                                  rowIndex
                                ),
                            }
                          : col
                      )}
                      onCellChange={(rowIndex, columnKey, newValue) =>
                        handleCellChange(cIdx, rowIndex, columnKey, newValue)
                      }
                      onAddRow={() => handleAddRow(cIdx)}
                      onDeleteRow={rowIndex => handleDeleteRow(cIdx, rowIndex)}
                      onMoveRowUp={rowIndex => handleMoveRowUp(cIdx, rowIndex)}
                      onMoveRowDown={rowIndex => handleMoveRowDown(cIdx, rowIndex)}
                      onInsertRowBelow={rowIndex => handleInsertRowBelow(cIdx, rowIndex)}
                      onRowClick={(row, rowIndex) => handleRowSelect(row, rowIndex)}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default StoryboardReactView;
