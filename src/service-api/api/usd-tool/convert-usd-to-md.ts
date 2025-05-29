import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';

namespace Internal {
  export interface ConvertUsdToMdInput {
    app: App;
    file: TFile;
  }

  export interface ConvertUsdToMdOutput {
    filePath: string;
    message: string;
  }

  // 台詞文字数から時間を計算する関数（1文字あたり0.2秒、最低2秒）
  function calculateDurationFromText(text: string): number {
    const charCount = text.replace(/\s/g, '').length; // 空白を除いた文字数
    return Math.max(charCount * 0.2, 2); // 最低2秒
  }

  // マークダウンからUSDAブロックを除去する関数
  function removeUsdaBlocks(markdown: string): string {
    const lines = markdown.split('\n');
    const result: string[] = [];
    let inUsdaBlock = false;

    for (const line of lines) {
      if (line.trim() === '```usda' || line.trim() === '```json') {
        inUsdaBlock = true;
        continue;
      }
      
      if (inUsdaBlock && line.trim() === '```') {
        inUsdaBlock = false;
        continue;
      }
      
      if (!inUsdaBlock) {
        result.push(line);
      }
    }
    
    return result.join('\n').trim();
  }

  // マークダウンの時間情報を更新する関数
  function updateTimingInMarkdown(markdown: string): string {
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

  /**
   * USDAファイルからマークダウンコンテンツを抽出し、USDからcustomLayerDataを削除
   */
  function extractAndRemoveMarkdownFromUsda(usdaContent: string): { markdown: string; cleanUsda: string } {
    const customLayerDataMatch = usdaContent.match(/customLayerData\s*=\s*\{([\s\S]*?)\}/);
    if (!customLayerDataMatch) return { markdown: '', cleanUsda: usdaContent };
    
    const customLayerData = customLayerDataMatch[1];
    const originalContentMatch = customLayerData.match(/string\s+originalContent\s*=\s*"((?:[^"\\]|\\.)*)"/);
    
    let markdown = '';
    if (originalContentMatch) {
      // エスケープを元に戻す
      markdown = originalContentMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
    
    // customLayerDataをUSDから削除
    const cleanUsda = usdaContent.replace(/\s*customLayerData\s*=\s*\{[\s\S]*?\}/, '');
    
    return { markdown, cleanUsda };
  }

  export async function executeConvertUsdToMd(args: ConvertUsdToMdInput): Promise<string> {
    const { app, file } = args;

    // USDAファイルを読み込み
    const usdContent = await app.vault.read(file);

    // USDからMarkdownを抽出し、クリーンなUSDを取得
    const { markdown: extractedMarkdown, cleanUsda } = extractAndRemoveMarkdownFromUsda(usdContent);
    
    let markdownContent = '';
    
    if (extractedMarkdown && extractedMarkdown.trim() !== '') {
      // USDメタデータからMarkdownが取得できた場合
      const cleanMarkdown = removeUsdaBlocks(extractedMarkdown);
      markdownContent = updateTimingInMarkdown(cleanMarkdown);
    } else {
      // 対応するマークダウンファイルを探す
      const parentPath = file.parent?.path || '';
      const baseName = file.basename;
      const possibleMdPath = parentPath ? normalizePath(`${parentPath}/${baseName}.md`) : `${baseName}.md`;
      const existingMdFile = app.vault.getAbstractFileByPath(possibleMdPath);
      
      if (existingMdFile instanceof TFile) {
        try {
          const existingContent = await app.vault.read(existingMdFile);
          // USDAブロックを除去してマークダウン部分のみを取得
          markdownContent = removeUsdaBlocks(existingContent);
          markdownContent = updateTimingInMarkdown(markdownContent);
        } catch (error) {
          console.error('Failed to read existing markdown file:', error);
          markdownContent = '# 新しいストーリーボード\n\n### キャラクター\n\n### チャプター1';
        }
      } else {
        // デフォルトテンプレートを使用
        markdownContent = '# 新しいストーリーボード\n\n### キャラクター\n\n### チャプター1';
      }
    }

    // クリーンなUSDAコンテンツをUSDAブロックとして追加
    markdownContent += '\n\n```usda\n';
    markdownContent += cleanUsda;
    markdownContent += '\n```';

    // 元のファイルをマークダウンに置き換え
    const parentPath = file.parent?.path || '';
    const baseName = file.basename;
    const mdPath = parentPath ? normalizePath(`${parentPath}/${baseName}.md`) : `${baseName}.md`;

    // 元のファイルを削除してからマークダウンファイルを作成
    await app.vault.delete(file);
    const mdFile = await app.vault.create(mdPath, markdownContent);

    const result: ConvertUsdToMdOutput = {
      filePath: mdFile.path,
      message: `USDをマークダウンに変換しました: ${mdFile.name}`
    };

    return JSON.stringify(result);
  }
}

export const convertUsdToMdTool: Tool<Internal.ConvertUsdToMdInput> = {
  name: 'convert_usd_to_md',
  description: 'Convert USD stage to Markdown storyboard',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Source USD file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeConvertUsdToMd
};
