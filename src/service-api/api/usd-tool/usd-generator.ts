import type { UsdProject, LegacyUsdProject, AnyUsdProject, UsdStage, UsdTrack, UsdClip } from '../../../types/usd';

/**
 * USD形式のファイル生成ユーティリティ
 * JSON形式のUSDプロジェクトデータから実際のUSDAファイル（テキスト形式）を生成
 */
export class UsdGenerator {
  
  /**
   * USDプロジェクトから実際のUSDAファイル内容を生成
   */
  static generateUsdaContent(project: AnyUsdProject): string {
    const lines: string[] = [];
    
    // USDAファイルヘッダ
    lines.push('#usda 1.0');
    lines.push('(');
    
    // プロジェクトタイプを判定
    if (this.isLegacyProject(project)) {
      return this.generateLegacyUsdaContent(project);
    } else if (this.isTimelineProject(project)) {
      return this.generateTimelineUsdaContent(project);
    } else {
      return this.generateModernUsdaContent(project);
    }
  }
  
  /**
   * レガシープロジェクトかどうかを判定
   */
  private static isLegacyProject(project: AnyUsdProject): project is LegacyUsdProject {
    return 'USD_SCHEMA' in project;
  }
  
  /**
   * タイムラインプロジェクトかどうかを判定
   */
  private static isTimelineProject(project: AnyUsdProject): project is import('../../../types/usd').TimelineProject {
    return 'stage' in project && 'tracks' in (project as any).stage;
  }
  
  /**
   * レガシー形式のUSDAコンテンツを生成
   */
  private static generateLegacyUsdaContent(project: LegacyUsdProject): string {
    const lines: string[] = [];
    
    lines.push('#usda 1.0');
    lines.push('(');
    lines.push(`    defaultPrim = "${project.stage.name}"`);
    
    if (project.metadata.upAxis) {
      lines.push(`    upAxis = "${project.metadata.upAxis}"`);
    }
    if (project.metadata.metersPerUnit) {
      lines.push(`    metersPerUnit = ${project.metadata.metersPerUnit}`);
    }
    if (project.metadata.timeCodesPerSecond) {
      lines.push(`    timeCodesPerSecond = ${project.metadata.timeCodesPerSecond}`);
    }
    
    // マークダウンメタデータをcustomLayerDataに追加
    if (project.stage.metadata?.source_markdown) {
      lines.push('    customLayerData = {');
      lines.push('        string sourceFormat = "markdown"');
      lines.push('        string creator = "Obsidian Storyboard"');
      const escapedMarkdown = project.stage.metadata.source_markdown
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      lines.push(`        string originalContent = "${escapedMarkdown}"`);
      lines.push('    }');
    }
    
    lines.push(')');
    lines.push('');
    
    // ステージ定義
    lines.push(`def Xform "${project.stage.name}" {`);
    
    // トラック（子プリム）を生成
    project.stage.tracks.forEach(track => {
      lines.push(...this.generateLegacyTrackPrim(track, 1));
    });
    
    lines.push('}');
    
    return lines.join('\n');
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
    
    // アプリケーションメタデータをcustomLayerDataに追加
    if (project.applicationMetadata.sourceMarkdown) {
      lines.push('    customLayerData = {');
      lines.push('        string sourceFormat = "markdown"');
      lines.push(`        string creator = "${project.applicationMetadata.creator}"`);
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
    
    // アプリケーションメタデータをcustomLayerDataに追加
    if (project.applicationMetadata.sourceMarkdown) {
      lines.push('    customLayerData = {');
      lines.push('        string sourceFormat = "markdown"');
      lines.push(`        string creator = "${project.applicationMetadata.creator}"`);
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
   * レガシー形式のトラックプリムを生成
   */
  private static generateLegacyTrackPrim(track: any, indentLevel: number): string[] {
    const indent = '    '.repeat(indentLevel);
    const lines: string[] = [];
    
    lines.push(`${indent}def Xform "${track.name || 'Track'}" {`);
    
    // トラックのメタデータを属性として追加
    if (track.type) {
      lines.push(`${indent}    string trackType = "${track.type}"`);
    }
    
    // 空のトラック（子プリムはなし）
    lines.push(`${indent}}`);
    
    return lines;
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
    if (track.type) {
      lines.push(`${indent}    string trackType = "${track.type}"`);
    }
    
    // クリップ（子プリム）を生成
    track.children.forEach(clip => {
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
    if (clip.type) {
      lines.push(`${indent}    string clipType = "${clip.type}"`);
    }
    
    // アセット参照
    if (clip.asset_reference) {
      lines.push(`${indent}    asset assetPath = @${clip.asset_reference.asset_path}@`);
      if (clip.asset_reference.name) {
        lines.push(`${indent}    string assetName = "${clip.asset_reference.name}"`);
      }
    }
    
    // タイムレンジ
    if (clip.source_range) {
      lines.push(`${indent}    double startTime = ${clip.source_range.start_time}`);
      lines.push(`${indent}    double duration = ${clip.source_range.duration}`);
    }
    
    // バリアント（旧effects）
    if (clip.variants && clip.variants.length > 0) {
      lines.push(`${indent}    string[] variants = [${clip.variants.map(v => `"${v}"`).join(', ')}]`);
    }
    
    // カスタム属性（旧markers）
    if (clip.attributes && clip.attributes.length > 0) {
      clip.attributes.forEach((attr: any) => {
        if (attr.name && attr.value !== undefined) {
          const valueStr = typeof attr.value === 'string' ? `"${attr.value}"` : String(attr.value);
          lines.push(`${indent}    ${attr.type || 'string'} ${attr.name} = ${valueStr}`);
        }
      });
    }
    
    // メタデータ
    if (clip.metadata && Object.keys(clip.metadata).length > 0) {
      lines.push(`${indent}    # Metadata`);
      Object.entries(clip.metadata).forEach(([key, value]) => {
        const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
        lines.push(`${indent}    string metadata_${key} = ${valueStr}`);
      });
    }
    
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
    };
    
    // TODO: 実際のUSDAファイル解析実装
    // 現時点では基本構造のみ返す
    
    return project;
  }
}