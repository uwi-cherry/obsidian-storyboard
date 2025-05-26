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
    
    // マークダウン部分を追加（[!INFO]行を除外してプロンプト欄への混入を防ぐ）
    if (sourceMarkdown) {
      const lines = sourceMarkdown.split('\n');
      const filteredLines = lines.filter((line: string) => 
        !line.match(/^>\s*\[!INFO\]\s*start:\s*\d+(?:\.\d+)?,\s*duration:\s*\d+(?:\.\d+)?/)
      );
      markdownContent = filteredLines.join('\n').trim();
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