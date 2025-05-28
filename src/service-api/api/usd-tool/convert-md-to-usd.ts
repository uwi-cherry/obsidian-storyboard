import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import type { UsdProject } from '../../../types/usd';
import { toolRegistry } from '../../core/tool-registry';

namespace Internal {
  export interface ConvertMdToUsdInput {
    app: App;
    file: TFile;
  }

  export interface ConvertMdToUsdOutput {
    filePath: string;
    message: string;
  }



  function createEmptyUsdProject(sourceMarkdown: string): UsdProject {
    return {
      USD_SCHEMA: 'Stage.1',
      schema_version: 1,
      name: 'Converted Project',
      stage: {
        name: 'Main Stage',
        type: 'Stage',
        tracks: [],
        global_start_time: { value: 0, rate: 30 },
        global_end_time: { value: 0, rate: 30 },
        metadata: {
          source_markdown: sourceMarkdown
        }
      },
      metadata: {
        timeCodesPerSecond: 30,
        resolution: { width: 1920, height: 1080 },
        upAxis: 'Y',
        metersPerUnit: 1.0
      }
    };
  }



  export async function executeConvertMdToUsd(args: ConvertMdToUsdInput): Promise<string> {
    const { app, file } = args;

    // まず時間情報を初期化
    await toolRegistry.executeTool('initialize_timing', { app, file });

    // マークダウンファイルを読み込み
    const markdownContent = await app.vault.read(file);

    // JSONブロックを抽出・分離
    const lines = markdownContent.split('\n');
    const markdownLines: string[] = [];
    const jsonLines: string[] = [];
    let inJsonBlock = false;
    let foundJsonBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '```json') {
        inJsonBlock = true;
        foundJsonBlock = true;
        continue;
      }

      if (inJsonBlock && line.trim() === '```') {
        inJsonBlock = false;
        continue;
      }

      if (inJsonBlock) {
        jsonLines.push(line);
      } else {
        // JSONブロックが見つかった後の行は無視（JSONブロック以降は含めない）
        if (!foundJsonBlock) {
          markdownLines.push(line);
        }
      }
    }

    const cleanMarkdown = markdownLines.join('\n').trim();
    // 時間情報は既に初期化済みなのでそのまま使用
    const processedMarkdown = cleanMarkdown;
    const jsonContent = jsonLines.join('\n').trim();

    let usdProject: UsdProject;

    if (jsonContent) {
      // 既存のJSONを使用してマークダウンを埋め込み
      try {
        usdProject = JSON.parse(jsonContent);
        usdProject.stage.metadata = usdProject.stage.metadata || {};
        usdProject.stage.metadata.source_markdown = processedMarkdown;
      } catch (error) {
        // JSONパースエラーの場合は空プロジェクトを作成
        usdProject = createEmptyUsdProject(processedMarkdown);
      }
    } else {
      // JSONがない場合は空プロジェクトを作成
      usdProject = createEmptyUsdProject(processedMarkdown);
    }

    // 元のファイルをUSDに置き換え
    const parentPath = file.parent?.path || '';
    const baseName = file.basename;
    const usdPath = parentPath ? normalizePath(`${parentPath}/${baseName}.usda`) : `${baseName}.usda`;

    const usdContent = JSON.stringify(usdProject, null, 2);

    // 元のファイルを削除してからUSDファイルを作成
    await app.vault.delete(file);
    const usdFile = await app.vault.create(usdPath, usdContent);

    const result: ConvertMdToUsdOutput = {
      filePath: usdFile.path,
      message: `マークダウンをUSDに変換しました: ${usdFile.name}`
    };

    return JSON.stringify(result);
  }
}

export const convertMdToUsdTool: Tool<Internal.ConvertMdToUsdInput> = {
  name: 'convert_md_to_usd',
  description: 'Convert Markdown storyboard to USD stage',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Source markdown file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeConvertMdToUsd
};
