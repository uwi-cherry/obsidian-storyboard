import { StoryboardData, StoryboardFrame, CharacterInfo } from './storyboard-types';

export function parseMarkdownToStoryboard(markdown: string): StoryboardData {
  const lines = markdown.split('\n');
  const data: StoryboardData = { title: '', frames: [], characters: [] };
  let currentFrame: StoryboardFrame | null = null;
  let inCharacterSection = false;
  let inScenarioSection = false;
  let currentCharacter: CharacterInfo | null = null;
  let currentLabel: string | null = null;

  function initializeNewFrame(): StoryboardFrame {
    return {
      dialogues: '',
      speaker: '',
      imageUrl: undefined,
      imagePrompt: undefined,
    };
  }

  function saveCurrentFrameIfValid() {
    if (currentFrame) {
      data.frames.push(currentFrame);
    }
    currentFrame = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (line.startsWith('### キャラクター')) {
      inCharacterSection = true;
      inScenarioSection = false;
      continue;
    }
    if (line.startsWith('### シナリオ')) {
      inCharacterSection = false;
      inScenarioSection = true;
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
    } else if (inScenarioSection) {
      if (line.startsWith('####')) {
        saveCurrentFrameIfValid();
        currentFrame = initializeNewFrame();
        currentFrame.speaker = line.replace(/^####\s*/, '');
      } else if (currentFrame) {
        if (line.startsWith('*') && line.endsWith('*') && line.length > 1) {
          currentFrame.imagePrompt = line.substring(1, line.length - 1);
        } else if (line.startsWith('[[') && line.endsWith(']]')) {
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
  content += '\n### シナリオ\n\n';
  // シナリオセクション
  data.frames.forEach((frame) => {
    content += `#### ${frame.speaker || ''}\n`;
    content += `${frame.dialogues || ''}\n`;
    if (frame.imageUrl) {
      content += `[[${frame.imageUrl}]]\n`;
    }
    if (frame.imagePrompt) {
      content += `*${frame.imagePrompt}*\n`;
    }
  });
  return content.trimEnd() + (data.frames.length > 0 ? '\n' : '');
}
