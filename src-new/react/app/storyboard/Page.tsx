import { App, TFile, Notice } from 'obsidian';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FOLD_ICON_SVG, TABLE_ICONS } from 'src-new/constants/icons';
import EditableTable, { ColumnDef } from 'src-new/react/components/EditableTable';
import { t } from '../../../constants/obsidian-i18n';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';
import { useSelectedRowIndexStore } from '../../../obsidian-api/zustand/store/selected-row-index-store';
import { useSelectedFrameStore } from '../../../obsidian-api/zustand/store/selected-frame-store';
import useStoryboardData from '../../hooks/useStoryboardData';
import { StoryboardData, StoryboardFrame } from '../../../types/storyboard';
import BGMCreationInput from './BGMCreationInput';
import CharacterEditModal from './CharacterEditModal';
import ImageInputCell from './ImageInputCell';
import NewChapterBGMInput from './NewChapterBGMInput';
import PreviewCell from './PreviewCell';
import SpeakerDialogueCell from './SpeakerDialogueCell';

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

  // データ読み込み
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
        console.error('ストーリーボードデータの読み込みに失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [app, file]);

  // データ保存
  const handleDataChange = async (updatedData: StoryboardData) => {
    if (!file) return;
    
    try {
      await toolRegistry.executeTool('save_storyboard_data', {
        app,
        file,
        data: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error('ストーリーボードデータの保存に失敗しました:', error);
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
  
  // 選択された行の管理（章インデックス + 行インデックス）
  const [selectedRowPositions, setSelectedRowPositions] = useState<{chapterIndex: number, rowIndex: number}[]>([]);

  // BGM入力欄のref配列
  const bgmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevChapterCount = useRef(initialData.chapters.length);

  // セリフ欄（textarea）のref配列
  const dialogueRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  // プロンプト欄（textarea）のref配列
  const promptRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    setOpenChapters(initialData.chapters.map(() => true));
  }, [initialData]);

  // ダミーの関数（将来的に実装）
  const generateThumbnail = async (app: App, file: TFile): Promise<string | null> => {
    try {
      // toolRegistryを使用してサムネイルを生成
      const result = await toolRegistry.executeTool('generate_thumbnail', { 
        app, 
        file 
      });
      const parsedResult = JSON.parse(result);
      return parsedResult.thumbnailData;
    } catch (error) {
      console.error('サムネイル生成に失敗しました:', error);
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
      // toolRegistryを使用してPSDファイルを作成
      const result = await toolRegistry.executeTool('create_painter_file', { 
        app, 
        imageFile 
      });
      const parsedResult = JSON.parse(result);
      
      // 作成されたPSDファイルを取得
      const psdFile = app.vault.getAbstractFileByPath(parsedResult.filePath);
      if (!(psdFile instanceof TFile)) {
        throw new Error('作成されたPSDファイルが見つかりません');
      }
      
      // ファイルを開く場合
      if (isOpen) {
        console.log('🔍 Page: PSDファイルを開いています...');
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(psdFile, { active: true });
        
        // global-variable-managerに現在のファイルを通知してレイヤー表示をリフレッシュ
        const globalVariableManager = (app as any).plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
        if (globalVariableManager) {
          console.log('🔍 Page: CURRENT_FILEをglobalVariableManagerに設定中...');
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_FILE, psdFile);
          console.log('🔍 Page: CURRENT_FILE設定完了');
        } else {
          console.log('🔍 Page: createPsd - GlobalVariableManagerが見つかりません');
        }
      }
      
      return psdFile;
    } catch (error) {
      console.error('PSD作成に失敗しました:', error);
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
    // 章を考慮した全体のインデックスを計算
    let globalIndex = 0;
    for (let i = 0; i < chapterIndex; i++) {
      globalIndex += storyboard.chapters[i].frames.length;
    }
    globalIndex += index;
    
    console.log('🔍 Page: 行選択イベント:', { chapterIndex, localIndex: index, globalIndex, row });
    
    // zustandストアに選択行を通知
    useSelectedRowIndexStore.getState().setSelectedRowIndex(globalIndex);
    useSelectedFrameStore.getState().setSelectedFrame(row);
  }, [app, storyboard]);

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

  // 行の移動処理（複数選択対応）
  const handleMoveRowTo = useCallback((chapterIndex: number, fromRowIndex: number, toRowIndex: number) => {
    const newStoryboard = { ...storyboard };
    const chapter = newStoryboard.chapters[chapterIndex];
    
    if (chapter && chapter.frames) {
      // 現在の章で選択された行のインデックスを取得
      const selectedInThisChapter = selectedRowPositions
        .filter(pos => pos.chapterIndex === chapterIndex)
        .map(pos => pos.rowIndex)
        .sort((a, b) => a - b); // 昇順でソート
      
      if (selectedInThisChapter.length > 0) {
        // 選択された行のデータを抽出
        const selectedFrames = selectedInThisChapter.map(index => chapter.frames[index]);
        
        // 降順で削除（インデックスがずれないように）
        selectedInThisChapter.reverse().forEach(index => {
          chapter.frames.splice(index, 1);
        });
        
        // 移動先のインデックスを調整（削除された行の分だけ調整）
        let adjustedToIndex = toRowIndex;
        selectedInThisChapter.forEach(deletedIndex => {
          if (deletedIndex < toRowIndex) {
            adjustedToIndex--;
          }
        });
        
        // 選択された行を移動先に挿入
        chapter.frames.splice(adjustedToIndex, 0, ...selectedFrames);
      } else {
        // 選択されていない場合は従来の1行移動
        const [movedFrame] = chapter.frames.splice(fromRowIndex, 1);
        chapter.frames.splice(toRowIndex, 0, movedFrame);
      }
      
      setStoryboard(newStoryboard);
      handleDataChange(newStoryboard);
    }
  }, [storyboard, setStoryboard, handleDataChange, selectedRowPositions]);
  
  // 選択状態の管理
  const handleSelectRow = useCallback((chapterIndex: number, rowIndex: number, isSelected: boolean) => {
    if (isSelected) {
      // 選択に追加
      setSelectedRowPositions(prev => [...prev, { chapterIndex, rowIndex }]);
    } else {
      // 選択から除去
      setSelectedRowPositions(prev => 
        prev.filter(pos => !(pos.chapterIndex === chapterIndex && pos.rowIndex === rowIndex))
      );
    }
  }, []);
  
  // 選択解除
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