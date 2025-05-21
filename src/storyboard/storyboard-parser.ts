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
        prompt: undefined,
        endTime: undefined,
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
        const seMatch =
          line.match(/^<se(?:\s+[^>]*)?>(.*)<\/se>$/) ||
          line.match(/^<span[^>]*style=["'][^"']*color:\s*#5cc7f5[^"']*["'][^>]*>(.*)<\/span>$/);
        const cameraMatch =
          line.match(/^<camera(?:\s+[^>]*)?>(.*)<\/camera>$/) ||
          line.match(/^<span[^>]*style=["'][^"']*color:\s*#ff8eb2[^"']*["'][^>]*>(.*)<\/span>$/);
        const timeMatch =
          line.match(/^<time(?:\s+[^>]*)?>(.*)<\/time>$/) ||
          line.match(/^<span[^>]*style=["'][^"']*color:\s*#df9d5b[^"']*["'][^>]*>(.*)<\/span>$/);
        const calloutInfoMatch = line.match(/^>\s*\[!INFO\]\s*(.*)$/);
        const imageMatch = line.match(/^\[(.*)\]\((.*)\)$/);
        if (calloutInfoMatch) {
          const timecode = calloutInfoMatch[1].trim();
          const parts = timecode.split('-');
          currentFrame.endTime = parts[1] || '';
          const promptLines: string[] = [];
          let mode: 'camera' | 'se' | null = null;
          while (i + 1 < lines.length && lines[i + 1].trimStart().startsWith('>')) {
            const raw = lines[i + 1].replace(/^>\s*/, '').trim();
            if (/^CAMERA:\s*/i.test(raw)) {
              mode = 'camera';
              const rest = raw.replace(/^CAMERA:\s*/i, '').trim();
              if (rest) promptLines.push(rest);
            } else if (/^SE:\s*/i.test(raw)) {
              mode = 'se';
              const rest = raw.replace(/^SE:\s*/i, '').trim();
              if (rest) promptLines.push(rest);
            } else {
              promptLines.push(raw);
            }
            i++;
          }
          if (promptLines.length > 0) {
            currentFrame.prompt = promptLines.join('\n');
          }
        } else if (seMatch) {
          currentFrame.prompt = currentFrame.prompt ? `${currentFrame.prompt}\n${seMatch[1]}` : seMatch[1];
        } else if (cameraMatch) {
          currentFrame.prompt = currentFrame.prompt ? `${currentFrame.prompt}\n${cameraMatch[1]}` : cameraMatch[1];
        } else if (timeMatch) {
          const parts = timeMatch[1].split('-');
          currentFrame.endTime = parts[1] || parts[0];
        } else if (imageMatch) {
          currentFrame.imagePrompt = imageMatch[1];
          currentFrame.imageUrl = imageMatch[2];
        } else if (line.startsWith('**') && line.endsWith('**') && line.length >= 4) {
          // legacy SE format
          const content = line.substring(2, line.length - 2);
          currentFrame.prompt = currentFrame.prompt ? `${currentFrame.prompt}\n${content}` : content;
        } else if (line.startsWith('*') && line.endsWith('*') && line.length > 1) {
          // new SE markdown format or legacy image prompt
          const content = line.substring(1, line.length - 1);
          if (!currentFrame.imageUrl && !currentFrame.imagePrompt) {
            currentFrame.prompt = currentFrame.prompt ? `${currentFrame.prompt}\n${content}` : content;
          } else {
            // legacy image prompt format
            currentFrame.imagePrompt = content;
          }
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
    let prevEnd = '00:00:00';
    chapter.frames.forEach(frame => {
      content += `#### ${frame.speaker || ''}\n`;
      content += `${frame.dialogues || ''}\n`;
      if (frame.imageUrl !== undefined || frame.imagePrompt !== undefined) {
        content += `[${frame.imagePrompt ?? ''}](${frame.imageUrl ?? ''})\n`;
      }
      if (frame.endTime !== undefined || frame.prompt !== undefined) {
        const timecode = `${prevEnd}-${frame.endTime ?? ''}`;
        content += `> [!INFO] ${timecode}`.trimEnd() + '\n';
        if (frame.prompt !== undefined) {
          frame.prompt.split('\n').forEach(l => {
            content += `> ${l}\n`;
          });
        }
        prevEnd = frame.endTime ?? prevEnd;
      }
    });
  });
  return content.trimEnd() + (data.chapters.some(c => c.frames.length > 0) ? '\n' : '');
}
