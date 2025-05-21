import React, { useState, useEffect, useRef, useCallback } from 'react';
import { t } from 'src/i18n';
import { App, TFile } from 'obsidian';
import { StoryboardData, StoryboardFrame } from '../storyboard-types';
import CharacterEditModal from './components/CharacterEditModal';
import EditableTable, { ColumnDef } from './components/EditableTable';
import { TABLE_ICONS, FOLD_ICON_SVG } from 'src/icons';
import ImageInputCell from './components/ImageInputCell';
import SpeakerDialogueCell from './components/SpeakerDialogueCell';
import PreviewCell from './components/PreviewCell';
import useStoryboardData from '../hooks/useStoryboardData';

const calcImageRowSpan = (rows: StoryboardFrame[], rowIndex: number): number => {
  const row = rows[rowIndex];
  if (!row) return 1;
  if (row.imageUrl === undefined) {
    if (rowIndex > 0 && rows[rowIndex - 1].imageUrl === undefined) return 0;
    let span = 0;
    for (let i = rowIndex; i < rows.length && rows[i].imageUrl === undefined; i++) {
      span++;
    }
    return span;
  }
  let span = 1;
  for (let i = rowIndex + 1; i < rows.length && rows[i].imageUrl === undefined; i++) {
    span++;
  }
  return span;
};

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
  const {
    storyboard,
    handleCellChange,
    addRow,
    deleteRow,
    moveRowUp,
    moveRowDown,
    insertRowBelow,
    addChapter,
    deleteChapter,
    saveCharacters,
    uniqueSpeakers,
    allCharacters,
    setStoryboard,
  } = useStoryboardData(initialData, onDataChange);

  const [charModalOpen, setCharModalOpen] = useState(false);
  const [openChapters, setOpenChapters] = useState<boolean[]>(
    initialData.chapters.map(() => true)
  );
  const [newChapterBgm, setNewChapterBgm] = useState('');

  // BGM入力欄のref配列
  const bgmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevChapterCount = useRef(initialData.chapters.length);

  // セリフ欄（textarea）のref配列
  const dialogueRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  // 話者欄（input）のref配列
  // プロンプト欄（textarea）のref配列
  const promptRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    setOpenChapters(initialData.chapters.map(() => true));
  }, [initialData]);


  const columns: ColumnDef<StoryboardFrame>[] = [
    {
      key: 'imageUrl',
      header: t('HEADER_IMAGE'),
      getRowSpan: (row, rowIndex, data) => calcImageRowSpan(data as StoryboardFrame[], rowIndex),
      renderCell: (_value: StoryboardFrame['imageUrl'], row: StoryboardFrame, onCellChangeForRow: (columnKey: keyof StoryboardFrame, newValue: StoryboardFrame[keyof StoryboardFrame]) => void, rowIndex: number) => (
        <ImageInputCell
          imageUrl={row.imageUrl}
          imagePrompt={row.imagePrompt}
          onImageUrlChange={(newUrl: string | undefined | null) => onCellChangeForRow('imageUrl', newUrl === null ? '' : newUrl)}
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
    {
      key: 'preview' as keyof StoryboardFrame,
      header: t('HEADER_PREVIEW'),
      renderCell: (
        _value: StoryboardFrame['cameraPrompt'],
        row: StoryboardFrame,
        onCellChangeForRow: (
          columnKey: keyof StoryboardFrame,
          newValue: StoryboardFrame[keyof StoryboardFrame]
        ) => void
      ) => (
        <PreviewCell
          sePrompt={row.sePrompt || ''}
          cameraPrompt={row.cameraPrompt || ''}
          timecode={row.timecode || ''}
          onSePromptChange={val => onCellChangeForRow('sePrompt', val)}
          onCameraPromptChange={val => onCellChangeForRow('cameraPrompt', val)}
          onTimecodeChange={val => onCellChangeForRow('timecode', val)}
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
      let targetChapterIndex = 0;
      let idxInChapter = rowIndex;
      for (let i = 0; i < storyboard.chapters.length; i++) {
        if (idxInChapter < storyboard.chapters[i].frames.length) {
          targetChapterIndex = i;
          break;
        }
        idxInChapter -= storyboard.chapters[i].frames.length;
      }
      if (imageUrl !== undefined) {
        handleCellChange(targetChapterIndex, idxInChapter, 'imageUrl', imageUrl);
      }
      if (imagePrompt !== undefined) {
        handleCellChange(targetChapterIndex, idxInChapter, 'imagePrompt', imagePrompt);
      }
    };
    window.addEventListener('psd-sidebar-update-image', handler);
    return () => window.removeEventListener('psd-sidebar-update-image', handler);
  }, [handleCellChange, storyboard]);

  // 新しく章が追加された際にBGM入力へフォーカスする
  useEffect(() => {
    if (storyboard.chapters.length > prevChapterCount.current) {
      const idx = storyboard.chapters.length - 1;
      bgmRefs.current[idx]?.focus();
      prevChapterCount.current = storyboard.chapters.length;
    } else {
      prevChapterCount.current = storyboard.chapters.length;
    }
  }, [storyboard.chapters.length]);

  return (
    <>
      <CharacterEditModal
        open={charModalOpen}
        characters={allCharacters}
        frames={storyboard.chapters.flatMap(ch => ch.frames)}
        onClose={() => setCharModalOpen(false)}
        onSave={saveCharacters}
      />
      {storyboard.chapters.map((chapter, cIdx) => (
        <details
          key={cIdx}
          className="mb-4 last:mb-0"
          open={openChapters[cIdx]}
          onToggle={e => {
            const isOpen = (e.currentTarget as HTMLDetailsElement).open;
            setOpenChapters(prev => {
              const next = [...prev];
              next[cIdx] = isOpen;
              return next;
            });
          }}
        >
          <summary className="font-bold mb-2 flex items-center gap-2">
            <span
              className={`inline-block transition-transform ${openChapters[cIdx] ? 'rotate-90' : ''}`}
              dangerouslySetInnerHTML={{ __html: FOLD_ICON_SVG }}
            />
            <input
              className="w-full border-none bg-transparent focus:outline-none text-2xl font-bold"
              value={chapter.bgmPrompt ?? ''}
              ref={el => {
                bgmRefs.current[cIdx] = el;
              }}
              onClick={e => e.stopPropagation()}
              onChange={e => {
                const bgmPrompt = e.target.value;
                setStoryboard(prev => {
                  const chapters = prev.chapters.map((ch, idx) =>
                    idx === cIdx ? { ...ch, bgmPrompt } : ch
                  );
                  const updated = { ...prev, chapters };
                  onDataChange(updated);
                  return updated;
                });
              }}
            />
            <button
              className="text-text-faint hover:text-error text-base px-1 py-0.5 leading-none"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                deleteChapter(cIdx);
                setOpenChapters(prev => prev.filter((_, i) => i !== cIdx));
              }}
              title={t('DELETE')}
              dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
            />
          </summary>
          <EditableTable<StoryboardFrame>
            data={chapter.frames}
            columns={columns.map(col =>
              col.key === 'dialogues'
                ? {
                    ...col,
                      renderCell: (value, row, onCellChangeForRow, rowIndex) =>
                      col.renderCell?.(value, row, (k, v) => onCellChangeForRow(k, v), rowIndex),
                  }
                : col
            )}
            onCellChange={(rowIndex, columnKey, newValue) =>
              handleCellChange(cIdx, rowIndex, columnKey, newValue)
            }
            onAddRow={() => addRow(cIdx)}
            onDeleteRow={rowIndex => deleteRow(cIdx, rowIndex)}
            onMoveRowUp={rowIndex => moveRowUp(cIdx, rowIndex)}
            onMoveRowDown={rowIndex => moveRowDown(cIdx, rowIndex)}
            onInsertRowBelow={rowIndex => insertRowBelow(cIdx, rowIndex)}
            onRowClick={(row, rowIndex) => handleRowSelect(row, rowIndex)}
            showAddRow={false}
          />
        </details>
      ))}
      <table className="w-full border-collapse border border-modifier-border mb-4 table-fixed">
        <tbody>
          <tr className="bg-secondary hover:bg-modifier-hover">
            <td className="border border-modifier-border px-4 py-2" colSpan={columns.length + 1}>
              <input
                type="text"
                className="w-full border-none bg-transparent focus:outline-none text-center text-text-muted hover:text-text-normal"
                placeholder={t('NEW_CHAPTER_PLACEHOLDER')}
                value={newChapterBgm}
                onChange={e => {
                  const value = e.target.value;
                  if (value.length > 0) {
                    addChapter(value);
                    setOpenChapters(prev => [...prev, true]);
                    setNewChapterBgm('');
                  } else {
                    setNewChapterBgm(value);
                  }
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default StoryboardReactView;
