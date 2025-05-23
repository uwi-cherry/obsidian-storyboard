import { useState, useCallback, useEffect } from 'react';
import { StoryboardData, StoryboardFrame, CharacterInfo } from '../types/storyboard';

export function createEmptyFrame(): StoryboardFrame {
  return {
    imageUrl: '',
    speaker: '',
    dialogues: '',
    imagePrompt: '',
    prompt: '',
    endTime: '',
  };
}

export default function useStoryboardData(
  initialData: StoryboardData,
  onDataChange: (data: StoryboardData) => void,
) {
  const [storyboard, setStoryboard] = useState<StoryboardData>(initialData);

  useEffect(() => {
    setStoryboard(initialData);
  }, [initialData]);

  const updateData = useCallback(
    (updater: (prev: StoryboardData) => StoryboardData) => {
      setStoryboard(prev => {
        const next = updater(prev);
        onDataChange(next);
        return next;
      });
    },
    [onDataChange]
  );

  const handleCellChange = useCallback(
    (
      chapterIndex: number,
      rowIndex: number,
      key: keyof StoryboardFrame,
      value: StoryboardFrame[keyof StoryboardFrame],
    ) => {
      updateData(prev => {
        const chapters = prev.chapters.map((ch, cIdx) => {
          if (cIdx !== chapterIndex) return ch;
          const frames = ch.frames.map((f, fIdx) =>
            fIdx === rowIndex ? { ...f, [key]: value } : f,
          );
          return { ...ch, frames };
        });
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const addRow = useCallback(
    (chapterIndex: number) => {
      const newFrame = createEmptyFrame();
      updateData(prev => {
        const chapters = prev.chapters.map((ch, cIdx) =>
          cIdx === chapterIndex ? { ...ch, frames: [...ch.frames, newFrame] } : ch,
        );
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const deleteRow = useCallback(
    (chapterIndex: number, rowIndex: number) => {
      updateData(prev => {
        const chapters = prev.chapters.map((ch, cIdx) => {
          if (cIdx !== chapterIndex) return ch;
          return { ...ch, frames: ch.frames.filter((_, idx) => idx !== rowIndex) };
        });
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const moveRowUp = useCallback(
    (chapterIndex: number, rowIndex: number) => {
      if (rowIndex <= 0) return;
      updateData(prev => {
        const chapters = prev.chapters.map((ch, cIdx) => {
          if (cIdx !== chapterIndex) return ch;
          const frames = [...ch.frames];
          const temp = frames[rowIndex];
          frames[rowIndex] = frames[rowIndex - 1];
          frames[rowIndex - 1] = temp;
          return { ...ch, frames };
        });
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const moveRowDown = useCallback(
    (chapterIndex: number, rowIndex: number) => {
      updateData(prev => {
        const chapters = prev.chapters.map((ch, cIdx) => {
          if (cIdx !== chapterIndex) return ch;
          if (rowIndex >= ch.frames.length - 1) return ch;
          const frames = [...ch.frames];
          const temp = frames[rowIndex];
          frames[rowIndex] = frames[rowIndex + 1];
          frames[rowIndex + 1] = temp;
          return { ...ch, frames };
        });
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const insertRowBelow = useCallback(
    (chapterIndex: number, rowIndex: number) => {
      const newFrame = createEmptyFrame();
      updateData(prev => {
        const chapters = prev.chapters.map((ch, cIdx) => {
          if (cIdx !== chapterIndex) return ch;
          const frames = [...ch.frames];
          frames.splice(rowIndex + 1, 0, newFrame);
          return { ...ch, frames };
        });
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const addChapter = useCallback(
    (bgmPrompt?: string) => {
      const emptyFrame = createEmptyFrame();
      const newChapter = {
        bgmPrompt: bgmPrompt ?? '',
        frames: [emptyFrame],
      };
      updateData(prev => ({ ...prev, chapters: [...prev.chapters, newChapter] }));
    },
    [updateData]
  );

  const deleteChapter = useCallback(
    (index: number) => {
      updateData(prev => {
        const chapters = prev.chapters.filter((_, i) => i !== index);
        return { ...prev, chapters };
      });
    },
    [updateData]
  );

  const saveCharacters = useCallback(
    (chars: CharacterInfo[]) => {
      updateData(prev => {
        const oldNames = (prev.characters ?? []).map(c => c.name);
        const newNames = chars.map(c => c.name);
        const nameMap: Record<string, string> = {};
        oldNames.forEach((oldName, idx) => {
          if (oldName && oldName !== newNames[idx]) {
            nameMap[oldName] = newNames[idx];
          }
        });
        const chapters = prev.chapters.map(ch => ({
          ...ch,
          frames: ch.frames.map(frame => {
            const newSpeaker = nameMap[frame.speaker];
            return newSpeaker ? { ...frame, speaker: newSpeaker } : frame;
          }),
        }));
        return { ...prev, characters: chars, chapters };
      });
    },
    [updateData]
  );

  const getUniqueSpeakers = useCallback((data: StoryboardData | null): string[] => {
    if (!data) return [];
    const charNames = (data.characters ?? []).map(c => c.name);
    const frameSpeakers = data.chapters.flatMap(ch => ch.frames.map(f => f.speaker));
    return Array.from(new Set([...charNames, ...frameSpeakers])).filter(
      s => typeof s === 'string' && s.trim() !== '',
    );
  }, []);

  const uniqueSpeakers = getUniqueSpeakers(storyboard);
  const allSpeakers = uniqueSpeakers;
  const allCharacters: CharacterInfo[] = allSpeakers.map(name => {
    const found = (storyboard.characters ?? []).find(c => c.name === name);
    return found ? found : { name, attributes: { 説明: '' } };
  });

  return {
    storyboard,
    setStoryboard,
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
  };
} 