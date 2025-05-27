import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import type { OtioProject } from '../../../types/otio';

namespace Internal {
  export interface ConvertOtioToMdInput {
    app: App;
    file: TFile;
  }

  export interface ConvertOtioToMdOutput {
    filePath: string;
    message: string;
  }

  // 台詞文字数から時間を計算する関数（1文字あたり0.2秒、最低2秒）
  function calculateDurationFromText(text: string): number {
    const charCount = text.replace(/\s/g, '').length; // 空白を除いた文字数
    return Math.max(charCount * 0.2, 2); // 最低2秒
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

  export async function executeConvertOtioToMd(args: ConvertOtioToMdInput): Promise<string> {
    const { app, file } = args;

    // OTIOファイルを読み込み
    const otioContent = await app.vault.read(file);
    const otioProject: OtioProject = JSON.parse(otioContent);

    // マークダウン部分を取得
    const sourceMarkdown = otioProject.timeline.metadata?.source_markdown || '';

    // OTIO部分を取得（source_markdownを除く）
    const otioForJson = JSON.parse(JSON.stringify(otioProject));
    if (otioForJson.timeline.metadata) {
      delete otioForJson.timeline.metadata.source_markdown;
    }

    // マークダウンファイルを構築
    let markdownContent = '';

    // マークダウン部分を追加（時間情報を更新）
    if (sourceMarkdown) {
      markdownContent = updateTimingInMarkdown(sourceMarkdown);
    }

    // JSONブロックを別途追加
    if (Object.keys(otioForJson.timeline.metadata || {}).length > 0 ||
        otioForJson.timeline.tracks.length > 0 ||
        Object.keys(otioForJson.metadata || {}).length > 0) {

      // マークダウンとJSONを完全に分離
      if (markdownContent) {
        markdownContent += '\n\n';
      }
      markdownContent += '```json\n';
      markdownContent += JSON.stringify(otioForJson, null, 2);
      markdownContent += '\n```';
    }

    // 元のファイルをマークダウンに置き換え
    const parentPath = file.parent?.path || '';
    const baseName = file.basename;
    const mdPath = parentPath ? normalizePath(`${parentPath}/${baseName}.md`) : `${baseName}.md`;

    // 元のファイルを削除してからマークダウンファイルを作成
    await app.vault.delete(file);
    const mdFile = await app.vault.create(mdPath, markdownContent);

    const result: ConvertOtioToMdOutput = {
      filePath: mdFile.path,
      message: `OTIOをマークダウンに変換しました: ${mdFile.name}`
    };

    return JSON.stringify(result);
  }
}

export const convertOtioToMdTool: Tool<Internal.ConvertOtioToMdInput> = {
  name: 'convert_otio_to_md',
  description: 'Convert OTIO timeline to Markdown storyboard',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Source OTIO file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeConvertOtioToMd
};
