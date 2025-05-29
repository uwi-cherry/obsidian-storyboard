import type { UsdProject, UsdStage, UsdTrack, UsdClip } from '../../../types/usd';

/**
 * USD形式のファイル生成ユーティリティ
 * JSON形式のUSDプロジェクトデータから実際のUSDAファイル（テキスト形式）を生成
 */
export class UsdGenerator {
  
  /**
   * マークダウンからUSDAブロックを除去
   */
  private static removeUsdaBlocks(markdown: string): string {
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

  /**
   * USDプロジェクトから実際のUSDAファイル内容を生成
   */
  static generateUsdaContent(project: UsdProject | import('../../../types/usd').TimelineProject): string {
    if (this.isTimelineProject(project)) {
      return this.generateTimelineUsdaContent(project);
    } else {
      return this.generateModernUsdaContent(project as UsdProject);
    }
  }
  
  
  /**
   * タイムラインプロジェクトかどうかを判定
   */
  private static isTimelineProject(project: UsdProject | import('../../../types/usd').TimelineProject): project is import('../../../types/usd').TimelineProject {
    return 'stage' in project && 'tracks' in (project as any).stage;
  }
  
  
  /**
   * モダン形式のUSDAコンテンツを生成
   */
  private static generateModernUsdaContent(project: UsdProject): string {
    const lines: string[] = [];
    
    lines.push('#usda 1.0');
    lines.push('(');
    lines.push(`    defaultPrim = "Root"`);
    
    if (project.stage.layerMetadata.upAxis) {
      lines.push(`    upAxis = "${project.stage.layerMetadata.upAxis}"`);
    }
    if (project.stage.layerMetadata.metersPerUnit) {
      lines.push(`    metersPerUnit = ${project.stage.layerMetadata.metersPerUnit}`);
    }
    if (project.stage.layerMetadata.timeCodesPerSecond) {
      lines.push(`    timeCodesPerSecond = ${project.stage.layerMetadata.timeCodesPerSecond}`);
    }
    
    // 一時的にMarkdownを保存（復元用）
    if (project.applicationMetadata.sourceMarkdown) {
      lines.push('    customLayerData = {');
      const escapedMarkdown = project.applicationMetadata.sourceMarkdown
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      lines.push(`        string originalContent = "${escapedMarkdown}"`);
      lines.push('    }');
    }
    
    lines.push(')');
    lines.push('');
    
    // ルートプリム定義
    lines.push(...this.generatePrimContent(project.stage.rootPrim, 0));
    
    return lines.join('\n');
  }
  
  /**
   * タイムライン形式のUSDAコンテンツを生成
   */
  private static generateTimelineUsdaContent(project: import('../../../types/usd').TimelineProject): string {
    const lines: string[] = [];
    
    lines.push('#usda 1.0');
    lines.push('(');
    lines.push(`    defaultPrim = "Root"`);
    
    lines.push(`    timeCodesPerSecond = ${project.stage.timeCodesPerSecond}`);
    
    // 一時的にMarkdownを保存（復元用）
    if (project.applicationMetadata.sourceMarkdown) {
      lines.push('    customLayerData = {');
      const escapedMarkdown = project.applicationMetadata.sourceMarkdown
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      lines.push(`        string originalContent = "${escapedMarkdown}"`);
      lines.push('    }');
    }
    
    lines.push(')');
    lines.push('');
    
    // ルートステージ定義
    lines.push(`def Xform "Root" {`);
    
    // トラック（子プリム）を生成
    project.stage.tracks.forEach(track => {
      lines.push(...this.generateSimpleTrackPrim(track, 1));
    });
    
    lines.push('}');
    
    return lines.join('\n');
  }
  
  
  /**
   * シンプルトラックプリムを生成
   */
  private static generateSimpleTrackPrim(track: import('../../../types/usd').SimpleTrack, indentLevel: number): string[] {
    const indent = '    '.repeat(indentLevel);
    const lines: string[] = [];
    
    lines.push(`${indent}def Xform "${track.name}" {`);
    
    // トラックのメタデータを属性として追加
    if (track.trackType) {
      lines.push(`${indent}    string trackType = "${track.trackType}"`);
    }
    
    // クリップ（子プリム）を生成
    track.clips.forEach(clip => {
      lines.push(...this.generateSimpleClipPrim(clip, indentLevel + 1));
    });
    
    lines.push(`${indent}}`);
    
    return lines;
  }
  
  /**
   * シンプルクリッププリムを生成
   */
  private static generateSimpleClipPrim(clip: import('../../../types/usd').SimpleMediaClip, indentLevel: number): string[] {
    const indent = '    '.repeat(indentLevel);
    const lines: string[] = [];
    
    lines.push(`${indent}def Xform "${clip.name}" {`);
    
    // クリップの基本属性
    if (clip.clipType) {
      lines.push(`${indent}    string clipType = "${clip.clipType}"`);
    }
    
    // アセット参照
    if (clip.assetPath) {
      lines.push(`${indent}    asset assetPath = @${clip.assetPath}@`);
    }
    
    // タイムレンジ
    lines.push(`${indent}    double startTime = ${clip.startTime}`);
    lines.push(`${indent}    double duration = ${clip.duration}`);
    
    lines.push(`${indent}}`);
    
    return lines;
  }
  
  /**
   * USD プリムコンテンツを生成
   */
  private static generatePrimContent(prim: import('../../../types/usd').UsdPrim, indentLevel: number): string[] {
    const indent = '    '.repeat(indentLevel);
    const lines: string[] = [];
    
    const typeName = prim.typeName || 'Xform';
    const primName = prim.path.split('/').pop() || 'Unnamed';
    
    lines.push(`${indent}${prim.specifier} ${typeName} "${primName}" {`);
    
    // 属性を生成
    Object.entries(prim.attributes).forEach(([name, attr]) => {
      if (attr.value !== undefined) {
        const valueStr = this.formatAttributeValue(attr.value, attr.typeName);
        lines.push(`${indent}    ${attr.typeName} ${name} = ${valueStr}`);
      }
    });
    
    // 子プリムを生成
    prim.children.forEach(child => {
      lines.push(...this.generatePrimContent(child, indentLevel + 1));
    });
    
    lines.push(`${indent}}`);
    
    return lines;
  }
  
  /**
   * 属性値をフォーマット
   */
  private static formatAttributeValue(value: any, typeName: string): string {
    if (typeName === 'string' || typeName === 'token') {
      return `"${value}"`;
    } else if (typeName === 'asset') {
      return `@${value}@`;
    } else if (Array.isArray(value)) {
      return `[${value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
    } else {
      return String(value);
    }
  }
  
  /**
   * トラックをUSDプリムとして生成（レガシー）
   */
  private static generateTrackPrim(track: UsdTrack, indentLevel: number): string[] {
    const indent = '    '.repeat(indentLevel);
    const lines: string[] = [];
    
    lines.push(`${indent}def Xform "${track.name}" {`);
    
    // トラックのメタデータを属性として追加
    if (track.trackType) {
      lines.push(`${indent}    string trackType = "${track.trackType}"`);
    }
    
    // クリップ（子プリム）を生成
    track.clips.forEach(clip => {
      lines.push(...this.generateClipPrim(clip, indentLevel + 1));
    });
    
    lines.push(`${indent}}`);
    
    return lines;
  }
  
  /**
   * クリップをUSDプリムとして生成
   */
  private static generateClipPrim(clip: UsdClip, indentLevel: number): string[] {
    const indent = '    '.repeat(indentLevel);
    const lines: string[] = [];
    
    lines.push(`${indent}def Xform "${clip.name}" {`);
    
    // クリップの基本属性
    if (clip.clipType) {
      lines.push(`${indent}    string clipType = "${clip.clipType}"`);
    }
    
    // アセット参照
    if (clip.assetPath) {
      lines.push(`${indent}    asset assetPath = @${clip.assetPath}@`);
    }
    
    // タイムレンジ
    lines.push(`${indent}    double startTime = ${clip.startTime}`);
    lines.push(`${indent}    double duration = ${clip.duration}`);
    
    // 追加情報（バリアント、属性、メタデータなど）は現状未対応
    
    lines.push(`${indent}}`);
    
    return lines;
  }
  
  /**
   * USDAファイル形式からJSONプロジェクトへの簡易パース
   * （将来的な機能拡張用）
   */
  static parseUsdaContent(usdaContent: string): Partial<UsdProject> {
    // 基本的なパース実装（今後拡張予定）
    const project: Partial<UsdProject> = {
      USD_SCHEMA: 'Stage.1',
      schema_version: 1,
      name: 'Parsed Project',
      stage: {
        name: 'Main Stage',
        type: 'Stage',
        tracks: [],
        global_start_time: { value: 0, rate: 30 },
        global_end_time: { value: 0, rate: 30 },
        metadata: {}
      },
      metadata: {
        timeCodesPerSecond: 30,
        resolution: { width: 1920, height: 1080 },
        upAxis: 'Y',
        metersPerUnit: 1.0
      }
    } as unknown as Partial<UsdProject>;
    
    // TODO: 実際のUSDAファイル解析実装
    // 現時点では基本構造のみ返す
    
    return project;
  }
}