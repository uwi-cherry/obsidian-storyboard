import { StoryboardData, StoryboardFrame, CharacterInfo } from '../storyboard/storyboard-types';

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

export class StoryboardService {
  constructor(private updateData: (updater: (prev: StoryboardData) => StoryboardData) => void) {}

  handleCellChange(
    chapterIndex: number,
    rowIndex: number,
    key: keyof StoryboardFrame,
    value: StoryboardFrame[keyof StoryboardFrame],
  ) {
    this.updateData(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        const frames = ch.frames.map((f, fIdx) => (fIdx === rowIndex ? { ...f, [key]: value } : f));
        return { ...ch, frames };
      });
      return { ...prev, chapters };
    });
  }

  addRow(chapterIndex: number) {
    const newFrame = createEmptyFrame();
    this.updateData(prev => {
      const chapters = prev.chapters.map((ch, cIdx) =>
        cIdx === chapterIndex ? { ...ch, frames: [...ch.frames, newFrame] } : ch,
      );
      return { ...prev, chapters };
    });
  }

  deleteRow(chapterIndex: number, rowIndex: number) {
    this.updateData(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        return { ...ch, frames: ch.frames.filter((_, idx) => idx !== rowIndex) };
      });
      return { ...prev, chapters };
    });
  }

  moveRowUp(chapterIndex: number, rowIndex: number) {
    if (rowIndex <= 0) return;
    this.updateData(prev => {
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
  }

  moveRowDown(chapterIndex: number, rowIndex: number) {
    this.updateData(prev => {
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
  }

  insertRowBelow(chapterIndex: number, rowIndex: number) {
    const newFrame = createEmptyFrame();
    this.updateData(prev => {
      const chapters = prev.chapters.map((ch, cIdx) => {
        if (cIdx !== chapterIndex) return ch;
        const frames = [...ch.frames];
        frames.splice(rowIndex + 1, 0, newFrame);
        return { ...ch, frames };
      });
      return { ...prev, chapters };
    });
  }

  addChapter(bgmPrompt?: string) {
    const emptyFrame = createEmptyFrame();
    const newChapter = {
      bgmPrompt: bgmPrompt ?? '',
      frames: [emptyFrame],
    };
    this.updateData(prev => ({ ...prev, chapters: [...prev.chapters, newChapter] }));
  }

  deleteChapter(index: number) {
    this.updateData(prev => {
      const chapters = prev.chapters.filter((_, i) => i !== index);
      return { ...prev, chapters };
    });
  }

  saveCharacters(chars: CharacterInfo[]) {
    this.updateData(prev => {
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
  }

  getUniqueSpeakers(data: StoryboardData | null): string[] {
    if (!data) return [];
    const charNames = (data.characters ?? []).map(c => c.name);
    const frameSpeakers = data.chapters.flatMap(ch => ch.frames.map(f => f.speaker));
    return Array.from(new Set([...charNames, ...frameSpeakers])).filter(
      s => typeof s === 'string' && s.trim() !== '',
    );
  }
}
