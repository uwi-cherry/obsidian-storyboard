import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { StoryboardData, StoryboardFrame, CharacterInfo, StoryboardChapter } from '../../../types/storyboard';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  
  export interface LoadStoryboardDataInput {
    
    app: App;
    
    file: TFile;
  }

  function parseMarkdownToStoryboard(markdown: string): StoryboardData {
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
          const calloutInfoMatch = line.match(/^>\s*\[!INFO\]\s*(.*)$/);
          const imageMatch = line.match(/^\[(.*)\]\((.*)\)$/);
          if (calloutInfoMatch) {
            const timecode = calloutInfoMatch[1].trim();
            const parts = timecode.split('-');
            currentFrame.endTime = parts[1] || '';
            const promptLines: string[] = [];
            while (i + 1 < lines.length && lines[i + 1].trimStart().startsWith('>')) {
              const raw = lines[i + 1].replace(/^>\s*/, '').trim();
              if (raw) promptLines.push(raw);
              i++;
            }
            if (promptLines.length > 0) {
              currentFrame.prompt = promptLines.join('\n');
            }
          } else if (imageMatch) {
            currentFrame.imagePrompt = imageMatch[1];
            currentFrame.imageUrl = imageMatch[2];
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

  export async function executeLoadStoryboardData(args: LoadStoryboardDataInput): Promise<string> {
    const { app, file } = args;
    const markdownContent = await app.vault.read(file);
    
    const isNewFile = markdownContent.trim() === '' || 
                     markdownContent.includes('無題のファイル') || 
                     markdownContent.includes('山田太郎') || 
                     markdownContent.includes('田中花子');
    
    if (isNewFile) {
      const emptyData: StoryboardData = {
        title: '',
        chapters: [{ 
          bgmPrompt: '第1章', 
          frames: [{ 
            dialogues: '', 
            speaker: '', 
            imageUrl: '', 
            imagePrompt: '', 
            prompt: '', 
            endTime: '' 
          }] 
        }],
        characters: []
      };
      return JSON.stringify(emptyData);
    }
    
    const storyboardData = parseMarkdownToStoryboard(markdownContent);
    return JSON.stringify(storyboardData);
  }
}

export const loadStoryboardDataTool: Tool<Internal.LoadStoryboardDataInput> = {
  name: TOOL_NAMES.LOAD_STORYBOARD_DATA,
  description: 'Load storyboard data from file',
  parameters: {
    type: 'object',
    properties: {
      app: {
        type: 'object',
        description: 'Obsidian app instance'
      },
      file: {
        type: 'object',
        description: 'Target file'
      }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeLoadStoryboardData
}; 
