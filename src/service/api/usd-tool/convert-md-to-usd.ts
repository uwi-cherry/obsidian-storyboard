import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import type { UsdProject } from '../../../types/usd';
import { toolRegistry } from '../../core/tool-registry';
import { UsdGenerator } from './usd-generator';

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
      schemaIdentifier: 'usd',
      schemaVersion: '1.0',
      name: 'Converted Project',
      stage: {
        rootPrim: {
          path: '/Root',
          typeName: 'Xform',
          specifier: 'def',
          attributes: {},
          relationships: {},
          children: [],
          metadata: {}
        },
        layerMetadata: {
          defaultPrim: 'Root',
          upAxis: 'Y',
          metersPerUnit: 1.0,
          timeCodesPerSecond: 30,
          startTimeCode: 0,
          endTimeCode: 0
        },
        timeCodesPerSecond: 30,
        startTimeCode: 0,
        endTimeCode: 0
      },
      applicationMetadata: {
        version: '1.0',
        creator: 'Obsidian Storyboard',
        resolution: {
          width: 1920,
          height: 1080
        },
        sourceMarkdown: sourceMarkdown
      }
    };
  }



  export async function executeConvertMdToUsd(args: ConvertMdToUsdInput): Promise<string> {
    const { app, file } = args;

    // まず時間情報を初期化
    await toolRegistry.executeTool('initialize_timing', { app, file });

    // マークダウンファイルを読み込み
    const markdownContent = await app.vault.read(file);

    // USDAブロックを抽出・分離
    const lines = markdownContent.split('\n');
    const markdownLines: string[] = [];
    const usdaLines: string[] = [];
    let inUsdaBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '```usda') {
        inUsdaBlock = true;
        continue;
      }

      if (inUsdaBlock && line.trim() === '```') {
        inUsdaBlock = false;
        continue;
      }

      if (inUsdaBlock) {
        usdaLines.push(line);
      } else {
        // USDAブロック外のMarkdown行はすべて含める
        markdownLines.push(line);
      }
    }

    const cleanMarkdown = markdownLines.join('\n').trim();
    const processedMarkdown = cleanMarkdown;
    const usdaContent = usdaLines.join('\n').trim();

    // 常に新しいUSDプロジェクトを作成（既存のUSDAは参考程度）
    const usdProject = createEmptyUsdProject(processedMarkdown);
    const finalUsdaContent = UsdGenerator.generateUsdaContent(usdProject);

    // 元のファイルをUSDに置き換え
    const parentPath = file.parent?.path || '';
    const baseName = file.basename;
    const usdPath = parentPath ? normalizePath(`${parentPath}/${baseName}.usda`) : `${baseName}.usda`;

    const usdContent = finalUsdaContent;

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
