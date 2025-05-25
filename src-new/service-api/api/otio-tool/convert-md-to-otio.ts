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

  // 台詞文字数から時間を計算する関数（1文字あたり0.2秒、最低2秒）
  function calculateDurationFromText(text: string): number {
    const charCount = text.replace(/\s/g, '').length; // 空白を除いた文字数
    return Math.max(charCount * 0.2, 2); // 最低2秒
  }

  // マークダウンを解析してストーリーボードデータにstartTimeとdurationを設定
  function processMarkdownWithTiming(markdown: string): string {
    const lines = markdown.split('\n');
    const processedLines: string[] = [];
    let currentTime = 0;
    let inFrame = false;
    let currentDialogues = '';
    let currentSpeaker = '';
    let frameStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('####')) {
        // 前のフレームを処理
        if (inFrame && currentDialogues.trim()) {
          const duration = calculateDurationFromText(currentDialogues);
          // [!INFO]行を探して確認
          let infoLineFound = false;
          let existingStart: number | null = null;
          let existingDuration: number | null = null;
          
          for (let j = frameStartIndex; j < i; j++) {
            const infoMatch = processedLines[j].match(/^>\s*\[!INFO\]\s*start:\s*(\d+(?:\.\d+)?),\s*duration:\s*(\d+(?:\.\d+)?)/);
            if (infoMatch) {
              existingStart = parseFloat(infoMatch[1]);
              existingDuration = parseFloat(infoMatch[2]);
              infoLineFound = true;
              break;
            }
          }
          
          if (infoLineFound && existingStart !== null && existingDuration !== null) {
            // 既に設定されている場合はその値を使用
            currentTime = existingStart + existingDuration;
          } else {
            // 設定されていない場合は新規追加
            processedLines.push(`> [!INFO] start: ${currentTime}, duration: ${duration}`);
            currentTime += duration;
          }
        }
        
        // 新しいフレーム開始
        currentSpeaker = line.replace(/^####\s*/, '');
        currentDialogues = '';
        inFrame = true;
        frameStartIndex = processedLines.length;
        processedLines.push(line);
      } else if (inFrame) {
        if (line.match(/^>\s*\[!INFO\]/)) {
          // [!INFO]行はそのまま保持
          processedLines.push(line);
        } else if (line.match(/^\[(.*)\]\((.*)\)$/)) {
          // 画像行
          processedLines.push(line);
        } else if (line.startsWith('>')) {
          // プロンプト行
          processedLines.push(line);
        } else if (line.trim()) {
          // 台詞行
          currentDialogues += (currentDialogues ? '\n' : '') + line;
          processedLines.push(line);
        } else {
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    // 最後のフレームを処理
    if (inFrame && currentDialogues.trim()) {
      const duration = calculateDurationFromText(currentDialogues);
      processedLines.push(`> [!INFO] start: ${currentTime}, duration: ${duration}`);
    }
    
    return processedLines.join('\n');
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
    // タイミング情報を追加したマークダウンを生成
    const processedMarkdown = processMarkdownWithTiming(cleanMarkdown);
    const jsonContent = jsonLines.join('\n').trim();
    
    let otioProject: OtioProject;
    
    if (jsonContent) {
      // 既存のJSONを使用してマークダウンを埋め込み
      try {
        otioProject = JSON.parse(jsonContent);
        otioProject.timeline.metadata = otioProject.timeline.metadata || {};
        otioProject.timeline.metadata.source_markdown = processedMarkdown;
      } catch (error) {
        // JSONパースエラーの場合は空プロジェクトを作成
        otioProject = createEmptyOtioProject(processedMarkdown);
      }
    } else {
      // JSONがない場合は空プロジェクトを作成
      otioProject = createEmptyOtioProject(processedMarkdown);
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