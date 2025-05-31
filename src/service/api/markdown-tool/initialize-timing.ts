import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';

namespace Internal {
  export interface InitializeTimingInput {
    app: App;
    file: TFile;
  }

  // 台詞文字数から時間を計算する関数（1文字あたり0.2秒、最低2秒）
  function calculateDurationFromText(text: string): number {
    const charCount = text.replace(/\s/g, '').length; // 空白を除いた文字数
    return Math.max(charCount * 0.2, 2); // 最低2秒
  }

  // マークダウンの時間情報を初期化する関数
  function initializeTimingInMarkdown(markdown: string): string {
    const lines = markdown.split('\n');
    let currentTime = 0;
    let inChapterSection = false;
    let currentFrame: any = null;

    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // チャプター開始の検出
      if (line.startsWith('### ') && !line.startsWith('### キャラクター')) {
        inChapterSection = true;
        currentTime = 0; // チャプターごとにリセット
        result.push(line);
        continue;
      }

      // キャラクターセクションの検出
      if (line.startsWith('### キャラクター')) {
        inChapterSection = false;
        result.push(line);
        continue;
      }

      if (inChapterSection) {
        // フレーム開始の検出
        if (line.startsWith('#### ')) {
          currentFrame = {
            dialogues: '',
            hasInfo: false
          };
          result.push(line);
          continue;
        }

        // INFO行の処理
        const calloutInfoMatch = line.match(/^>\s*\[!INFO\]\s*(.*)$/);
        if (calloutInfoMatch && currentFrame) {
          const existingContent = calloutInfoMatch[1].trim();

          // 台詞から時間を計算
          const duration = currentFrame.dialogues ?
            calculateDurationFromText(currentFrame.dialogues) : 2;

          const infoLine = `> [!INFO] start: ${currentTime}, duration: ${duration}`;
          result.push(infoLine);
          currentFrame.hasInfo = true;
          currentTime += duration;

          // 既存のプロンプト内容を保持
          if (existingContent && !existingContent.match(/start:\s*\d+.*duration:\s*\d+/)) {
            // プロンプト行として追加
            const promptLines = existingContent.split('\n');
            promptLines.forEach(promptLine => {
              if (promptLine.trim()) {
                result.push(`> ${promptLine.trim()}`);
              }
            });
          }

          // 続くプロンプト行を処理
          while (i + 1 < lines.length && lines[i + 1].trimStart().startsWith('>')) {
            i++;
            const promptLine = lines[i].replace(/^>\s*/, '').trim();
            if (promptLine) {
              result.push(`> ${promptLine}`);
            }
          }
          continue;
        }

        // 通常の行の処理
        if (currentFrame && !line.startsWith('>') && line.trim()) {
          // 画像リンクでない場合は台詞として扱う
          const imageMatch = line.match(/^\[(.*)\]\((.*)\)$/);
          if (!imageMatch) {
            currentFrame.dialogues += (currentFrame.dialogues ? '\n' : '') + line;
          }
        }
      }

      result.push(line);
    }

    return result.join('\n');
  }

  export async function executeInitializeTiming(args: InitializeTimingInput): Promise<string> {
    const { app, file } = args;

    const markdownContent = await app.vault.read(file);
    const updatedContent = initializeTimingInMarkdown(markdownContent);
    await app.vault.modify(file, updatedContent);

    return `マークダウンファイル "${file.name}" の時間情報を初期化しました`;
  }
}

export const initializeTimingTool: Tool<Internal.InitializeTimingInput> = {
  name: 'initialize_timing',
  description: 'Initialize timing information in markdown storyboard',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target markdown file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeInitializeTiming
};
