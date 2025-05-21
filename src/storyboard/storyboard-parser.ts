import { StoryboardData, StoryboardFrame, CharacterInfo, StoryboardChapter } from './storyboard-types';

export function parseMarkdownToStoryboard(markdown: string): StoryboardData {
  const lines = markdown.split('\n');
  const data: StoryboardData = { title: '', chapters: [], characters: [] };
  let currentFrame: StoryboardFrame | null = null;
  let currentChapter: StoryboardChapter | null = null;
  let inCharacterSection = false;
  let inChapterSection = false;
  let currentCharacter: CharacterInfo | null = null;
  let currentLabel: string | null = null;

  function initializeNewFrame(): StoryboardFrame {
      return {
        dialogues: '',
        speaker: '',
        imageUrl: undefined,
        imagePrompt: undefined,
        sePrompt: undefined,
        cameraPrompt: undefined,
        timecode: undefined,
      };
  }

  function saveCurrentFrameIfValid() {
    if (currentFrame && currentChapter) {
      currentChapter.frames.push(currentFrame);
    }
    currentFrame = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (line.startsWith('### キャラクター')) {
      inCharacterSection = true;
      inChapterSection = false;
      if (currentChapter) {
        saveCurrentFrameIfValid();
        data.chapters.push(currentChapter);
        currentChapter = null;
      }
      continue;
    }
    if (line.startsWith('### ')) {
      const bgmPrompt = line.replace(/^###\s*/, '');
      if (inCharacterSection) {
        // ignore; shouldn't occur
      }
      if (currentChapter) {
        saveCurrentFrameIfValid();
        data.chapters.push(currentChapter);
      }
      currentChapter = { bgmPrompt, frames: [] };
      inCharacterSection = false;
      inChapterSection = true;
      continue;
    }
    if (inCharacterSection) {
      if (line.startsWith('####')) {
        if (currentCharacter) {
          if (data.characters) {
            data.characters.push(currentCharacter);
          }
        }
        currentCharacter = { name: line.replace(/^####\s*/, '').trim(), attributes: { 説明: '' } };
        currentLabel = null;
      } else if (line.startsWith('- ')) {
        const label = line.slice(2).trim();
        if (label === '説明') {
          currentLabel = label;
        } else {
          currentLabel = null;
        }
      } else if (line.startsWith('  - ') && currentCharacter && currentLabel === '説明') {
        currentCharacter.attributes['説明'] = line.slice(4).trim();
      }
    } else if (inChapterSection) {
      if (line.startsWith('####')) {
        saveCurrentFrameIfValid();
        currentFrame = initializeNewFrame();
        currentFrame.speaker = line.replace(/^####\s*/, '');
      } else if (currentFrame) {
        const seMatch = line.match(/^<se>(.*)<\/se>$/);
        const cameraMatch = line.match(/^<camera>(.*)<\/camera>$/);
        const timeMatch = line.match(/^<time>(.*)<\/time>$/);
        const imageMatch = line.match(/^\[(.*)\]\((.*)\)$/);
        if (seMatch) {
          currentFrame.sePrompt = seMatch[1];
        } else if (cameraMatch) {
          currentFrame.cameraPrompt = cameraMatch[1];
        } else if (timeMatch) {
          currentFrame.timecode = timeMatch[1];
        } else if (imageMatch) {
          currentFrame.imagePrompt = imageMatch[1];
          currentFrame.imageUrl = imageMatch[2];
        } else if (line.startsWith('**') && line.endsWith('**') && line.length >= 4) {
          // legacy SE format
          currentFrame.sePrompt = line.substring(2, line.length - 2);
        } else if (line.startsWith('*') && line.endsWith('*') && line.length > 1) {
          // legacy image prompt format
          currentFrame.imagePrompt = line.substring(1, line.length - 1);
        } else if (line.startsWith('[[') && line.endsWith(']]')) {
          // legacy image url format
          if (!currentFrame.imageUrl) {
            currentFrame.imageUrl = line.substring(2, line.length - 2);
          }
        } else {
          if (!currentFrame.imageUrl) {
            currentFrame.dialogues += (currentFrame.dialogues ? '\n' : '') + line;
          }
        }
      }
    }
  }
  if (inCharacterSection && currentCharacter) {
    if (data.characters) {
      data.characters.push(currentCharacter);
    }
  }
  saveCurrentFrameIfValid();
  if (currentChapter) {
    data.chapters.push(currentChapter);
  }
  return data;
}

export function formatStoryboardToMarkdown(data: StoryboardData): string {
  let content = '';
  // キャラクターセクション
  content += '### キャラクター\n\n';
  if (data.characters && data.characters.length > 0) {
    data.characters.forEach((char) => {
      content += `#### ${char.name}\n`;
      content += `- 説明\n  - ${char.attributes['説明'] || ''}\n`;
    });
  }
  data.chapters.forEach(chapter => {
    content += `\n### ${chapter.bgmPrompt ?? ''}\n\n`;
    chapter.frames.forEach(frame => {
      content += `#### ${frame.speaker || ''}\n`;
      content += `${frame.dialogues || ''}\n`;
      if (frame.imageUrl !== undefined || frame.imagePrompt !== undefined) {
        content += `[${frame.imagePrompt ?? ''}](${frame.imageUrl ?? ''})\n`;
      }
      if (frame.sePrompt !== undefined) {
        content += `<se>${frame.sePrompt ?? ''}</se>\n`;
      }
      if (frame.cameraPrompt !== undefined) {
        content += `<camera>${frame.cameraPrompt ?? ''}</camera>\n`;
      }
      if (frame.timecode !== undefined) {
        content += `<time>${frame.timecode ?? ''}</time>\n`;
      }
    });
  });
  return content.trimEnd() + (data.chapters.some(c => c.frames.length > 0) ? '\n' : '');
}
