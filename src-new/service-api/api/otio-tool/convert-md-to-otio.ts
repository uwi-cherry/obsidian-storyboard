import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import type { OtioProject } from '../../../types/otio';

namespace Internal {
  export interface ConvertMdToOtioInput {
    app: App;
    file: TFile;
  }

  export interface ConvertMdToOtioOutput {
    filePath: string;
    message: string;
  }



  function createEmptyOtioProject(sourceMarkdown: string): OtioProject {
    return {
      OTIO_SCHEMA: 'Timeline.1',
      schema_version: 1,
      name: 'Converted Project',
      timeline: {
        name: 'Main Timeline',
        kind: 'Timeline',
        tracks: [],
        global_start_time: { value: 0, rate: 30 },
        global_end_time: { value: 0, rate: 30 },
        metadata: {
          source_markdown: sourceMarkdown
        }
      },
      metadata: {
        fps: 30,
        resolution: { width: 1920, height: 1080 },

      }
    };
  }

  export async function executeConvertMdToOtio(args: ConvertMdToOtioInput): Promise<string> {
    const { app, file } = args;

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
    const jsonContent = jsonLines.join('\n').trim();
    
    let otioProject: OtioProject;
    
    if (jsonContent) {
      // 既存のJSONを使用してマークダウンを埋め込み
      try {
        otioProject = JSON.parse(jsonContent);
        otioProject.timeline.metadata = otioProject.timeline.metadata || {};
        otioProject.timeline.metadata.source_markdown = cleanMarkdown;
      } catch (error) {
        // JSONパースエラーの場合は空プロジェクトを作成
        otioProject = createEmptyOtioProject(cleanMarkdown);
      }
    } else {
      // JSONがない場合は空プロジェクトを作成
      otioProject = createEmptyOtioProject(cleanMarkdown);
    }
    
    // 元のファイルをOTIOに置き換え
    const parentPath = file.parent?.path || '';
    const baseName = file.basename;
    const otioPath = parentPath ? normalizePath(`${parentPath}/${baseName}.otio`) : `${baseName}.otio`;
    
    const otioContent = JSON.stringify(otioProject, null, 2);
    
    // 元のファイルを削除してからOTIOファイルを作成
    await app.vault.delete(file);
    const otioFile = await app.vault.create(otioPath, otioContent);
    
    const result: ConvertMdToOtioOutput = {
      filePath: otioFile.path,
      message: `マークダウンをOTIOに変換しました: ${otioFile.name}`
    };

    return JSON.stringify(result);
  }
}

export const convertMdToOtioTool: Tool<Internal.ConvertMdToOtioInput> = {
  name: 'convert_md_to_otio',
  description: 'Convert Markdown storyboard to OTIO timeline',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Source markdown file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeConvertMdToOtio
}; 