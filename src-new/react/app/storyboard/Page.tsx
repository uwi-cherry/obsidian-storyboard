import { App, TFile, Notice } from 'obsidian';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FOLD_ICON_SVG } from 'src-new/constants/icons';
import EditableTable, { ColumnDef } from 'src-new/react/components/EditableTable';
import { t } from '../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import useStoryboardData from '../../hooks/useStoryboardData';
import { StoryboardData, StoryboardFrame } from '../../../types/storyboard';
import BGMCreationInput from './BGMCreationInput';
import CharacterEditModal from './CharacterEditModal';
import ImageInputCell from './ImageInputCell';
import NewChapterBGMInput from './NewChapterBGMInput';
import PreviewCell from './PreviewCell';
import SpeakerDialogueCell from './SpeakerDialogueCell';
import { useSelectedRowIndexStore } from '../../../obsidian-api/zustand/store/selected-row-index-store';
import { useSelectedFrameStore } from '../../../obsidian-api/zustand/store/selected-frame-store';
import { useCurrentPsdFileStore } from '../../../obsidian-api/zustand/store/current-psd-file-store';

interface StoryboardReactViewProps {
  app: App;
  file: TFile | null;
}

const StoryboardReactView: React.FC<StoryboardReactViewProps> = ({ app, file }) => {
  const [initialData, setInitialData] = useState<StoryboardData>({
    title: '',
    chapters: [{ bgmPrompt: '第1章', frames: [] }],
    characters: []
  });
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    const loadData = async () => {
      if (!file) return;
      
      try {
        setIsLoading(true);
        const result = await toolRegistry.executeTool('load_storyboard_data', {
          app,
          file
        });
        setInitialData(JSON.parse(result));
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [app, file]);

  
  const handleDataChange = async (updatedData: StoryboardData) => {
    if (!file) return;
    
    try {
      await toolRegistry.executeTool('save_storyboard_data', {
        app,
        file,
        data: JSON.stringify(updatedData)
      });
    } catch (error) {
    }
  };

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
  } = useStoryboardData(initialData, handleDataChange);

  const [charModalOpen, setCharModalOpen] = useState(false);
  const [openChapters, setOpenChapters] = useState<boolean[]>(
    initialData.chapters.map(() => true)
  );
  const [newChapterBgm, setNewChapterBgm] = useState('');
  
  
  const [selectedRowPositions, setSelectedRowPositions] = useState<{chapterIndex: number, rowIndex: number}[]>([]);

  
  const bgmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevChapterCount = useRef(initialData.chapters.length);

  
  const dialogueRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  
  const promptRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    setOpenChapters(initialData.chapters.map(() => true));
  }, [initialData]);

  
  const generateThumbnail = async (app: App, file: TFile): Promise<string | null> => {
    try {
      
      const result = await toolRegistry.executeTool('generate_thumbnail', { 
        app, 
        file 
      });
      const parsedResult = JSON.parse(result);
      return parsedResult.thumbnailData;
    } catch (error) {
      return null;
    }
  };

  const createPsd = async (
    app: App,
    imageFile?: TFile,
    layerName?: string,
    isOpen?: boolean,
    targetDir?: string
  ): Promise<TFile> => {
    try {
      
      const result = await toolRegistry.executeTool('create_painter_file', { 
        app, 
        imageFile 
      });
      const parsedResult = JSON.parse(result);
      
      
      const psdFile = app.vault.getAbstractFileByPath(parsedResult.filePath);
      if (!(psdFile instanceof TFile)) {
        throw new Error('作成されたPSDファイルが見つかりません');
      }
      
      
      if (isOpen) {
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(psdFile, { active: true });
        
        
        try {
          const loadResult = await toolRegistry.executeTool('load_painter_file', {
            app,
            file: psdFile,
          });
          const parsed = JSON.parse(loadResult);
          if (parsed.layers && parsed.layers.length > 0) {
          }
        } catch (err) {
        }
      }
      
      return psdFile;
    } catch (error) {
      new Notice('PSD作成に失敗しました: ' + (error as Error).message);
      throw error;
    }
  };

  const columns: ColumnDef<StoryboardFrame>[] = [
    {
      key: 'imageUrl',
      header: t('HEADER_IMAGE'),
      renderCell: (_value: StoryboardFrame['imageUrl'], row: StoryboardFrame, onCellChangeForRow: (columnKey: keyof StoryboardFrame, newValue: StoryboardFrame[keyof StoryboardFrame]) => void, rowIndex: number) => (
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
    {
      key: 'preview' as keyof StoryboardFrame,
      header: t('HEADER_PREVIEW'),
      renderCell: (
        _value: StoryboardFrame['prompt'],
        row: StoryboardFrame,
        onCellChangeForRow: (
          columnKey: keyof StoryboardFrame,
          newValue: StoryboardFrame[keyof StoryboardFrame]
        ) => void,
        _rowIndex: number
      ) => (
        <PreviewCell
          prompt={row.prompt || ''}
          onPromptChange={val => onCellChangeForRow('prompt', val)}
        />
      ),
    },
  ];

  const handleRowSelect = useCallback((row: StoryboardFrame, index: number, chapterIndex: number) => {
    
    let globalIndex = 0;
    for (let i = 0; i < chapterIndex; i++) {
      globalIndex += storyboard.chapters[i].frames.length;
    }
    globalIndex += index;
    
    useSelectedRowIndexStore.getState().setSelectedRowIndex(globalIndex);
    useSelectedFrameStore.getState().setSelectedFrame(row);
    
    // PSDファイルの場合はcurrent-psd-file-storeも更新
    if (row.imageUrl?.endsWith('.psd')) {
      const file = app.vault.getAbstractFileByPath(row.imageUrl);
      if (file instanceof TFile) {
        useCurrentPsdFileStore.getState().setCurrentPsdFile(file);
        console.log('🔍 Page: current-psd-file-storeを更新:', file.path);
      }
    } else {
      useCurrentPsdFileStore.getState().clearCurrentPsdFile();
    }
  }, [app, storyboard]);

  
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

  
  useEffect(() => {
    if (storyboard.chapters.length > prevChapterCount.current) {
      const idx = storyboard.chapters.length - 1;
      bgmRefs.current[idx]?.focus();
      prevChapterCount.current = storyboard.chapters.length;
    } else {
      prevChapterCount.current = storyboard.chapters.length;
    }
  }, [storyboard.chapters.length]);

  
  const handleMoveRowTo = useCallback((chapterIndex: number, fromRowIndex: number, toRowIndex: number) => {
    const newStoryboard = { ...storyboard };
    const chapter = newStoryboard.chapters[chapterIndex];
    
    if (chapter && chapter.frames) {
      
      const selectedInThisChapter = selectedRowPositions
        .filter(pos => pos.chapterIndex === chapterIndex)
        .map(pos => pos.rowIndex)
        .sort((a, b) => a - b); 
      
      if (selectedInThisChapter.length > 0) {
        
        const selectedFrames = selectedInThisChapter.map(index => chapter.frames[index]);
        
        
        selectedInThisChapter.reverse().forEach(index => {
          chapter.frames.splice(index, 1);
        });
        
        
        let adjustedToIndex = toRowIndex;
        selectedInThisChapter.forEach(deletedIndex => {
          if (deletedIndex < toRowIndex) {
            adjustedToIndex--;
          }
        });
        
        
        chapter.frames.splice(adjustedToIndex, 0, ...selectedFrames);
      } else {
        
        const [movedFrame] = chapter.frames.splice(fromRowIndex, 1);
        chapter.frames.splice(toRowIndex, 0, movedFrame);
      }
      
      setStoryboard(newStoryboard);
      handleDataChange(newStoryboard);
    }
  }, [storyboard, setStoryboard, handleDataChange, selectedRowPositions]);
  
  
  const handleSelectRow = useCallback((chapterIndex: number, rowIndex: number, isSelected: boolean) => {
    if (isSelected) {
      
      setSelectedRowPositions(prev => [...prev, { chapterIndex, rowIndex }]);
    } else {
      
      setSelectedRowPositions(prev => 
        prev.filter(pos => !(pos.chapterIndex === chapterIndex && pos.rowIndex === rowIndex))
      );
    }
  }, []);
  
  
  const handleClearSelection = useCallback((chapterIndex: number) => {
    setSelectedRowPositions(prev => prev.filter(pos => pos.chapterIndex !== chapterIndex));
  }, []);

  if (isLoading) {
    return <div className="storyboard-react-view p-4">{t('LOADING')}</div>;
  }

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
            <div className="flex-1">
              <BGMCreationInput
                value={chapter.bgmPrompt ?? ''}
                onChange={(bgmPrompt) => {
                  setStoryboard(prev => {
                    const chapters = prev.chapters.map((ch, idx) =>
                      idx === cIdx ? { ...ch, bgmPrompt } : ch
                    );
                    const updated = { ...prev, chapters };
                    handleDataChange(updated);
                    return updated;
                  });
                }}
                onDelete={() => {
                  deleteChapter(cIdx);
                  setOpenChapters(prev => prev.filter((_, i) => i !== cIdx));
                }}
                inputRef={(el) => {
                  bgmRefs.current[cIdx] = el;
                }}
              />
            </div>
          </summary>
          <EditableTable<StoryboardFrame>
            data={chapter.frames}
            columns={columns.map(col =>
              col.key === 'dialogues' || String(col.key) === 'preview'
                ? {
                    ...col,
                    renderCell: (value, row, onCellChangeForRow, rowIndex) =>
                      col.renderCell?.(
                        value,
                        row,
                        (k, v) => onCellChangeForRow(k, v),
                        rowIndex,
                        { frames: chapter.frames }
                      )
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
            onMoveRowTo={(fromIndex, toIndex) => handleMoveRowTo(cIdx, fromIndex, toIndex)}
            onRowClick={(row, rowIndex) => handleRowSelect(row, rowIndex, cIdx)}
            selectedRowIndexes={selectedRowPositions.filter(pos => pos.chapterIndex === cIdx).map(pos => pos.rowIndex)}
            onSelectRow={(rowIndex, isSelected) => handleSelectRow(cIdx, rowIndex, isSelected)}
            onClearSelection={() => handleClearSelection(cIdx)}
            showAddRow={false}
          />
        </details>
      ))}
      <NewChapterBGMInput
        value={newChapterBgm}
        onChange={setNewChapterBgm}
        onSubmit={(value) => {
          addChapter(value);
          setOpenChapters(prev => [...prev, true]);
          setNewChapterBgm('');
        }}
        columnsCount={columns.length}
      />
    </>
  );
};

export default StoryboardReactView; 