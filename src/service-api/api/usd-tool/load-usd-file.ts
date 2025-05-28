import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  export interface LoadUsdFileInput {
    app: App;
    file: TFile;
  }

  /**
   * USDAファイルからマークダウンコンテンツを抽出
   */
  function extractMarkdownFromUsda(usdaContent: string): string | null {
    const customLayerDataMatch = usdaContent.match(/customLayerData\s*=\s*\{([\s\S]*?)\}/);
    if (!customLayerDataMatch) return null;
    
    const customLayerData = customLayerDataMatch[1];
    const originalContentMatch = customLayerData.match(/string\s+originalContent\s*=\s*"((?:[^"\\]|\\.)*)"/);
    if (!originalContentMatch) return null;
    
    // エスケープを元に戻す
    return originalContentMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  function createEmptyUsda(): string {
    return `#usda 1.0
(
    defaultPrim = "Main Stage"
    upAxis = "Y"
    metersPerUnit = 1
    timeCodesPerSecond = 30
)

def Xform "Main Stage" {
}`;
  }

  export async function executeLoadUsdFile(args: LoadUsdFileInput): Promise<string> {
    const { app, file } = args;
    let content = await app.vault.read(file);

    if (!content.trim()) {
      content = createEmptyUsda();
      await app.vault.modify(file, content);
    }

    return content;
  }
}

export const loadUsdFileTool: Tool<Internal.LoadUsdFileInput> = {
  name: TOOL_NAMES.LOAD_USD_FILE,
  description: 'Load USD file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeLoadUsdFile
};
