import type { UsdProject, UsdStage, UsdTrack, UsdClip } from '../../../types/usd';

/**
 * USD形式のファイル生成ユーティリティ
 * JSON形式のUSDプロジェクトデータから実際のUSDAファイル（テキスト形式）を生成
 */
export class UsdGenerator {
  
  /**
   * USDプロジェクトから実際のUSDAファイル内容を生成
   */
  static generateUsdaContent(project: UsdProject): string {
    const lines: string[] = [];
    
    // USDAファイルヘッダ
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
    
    lines.push(')');
    lines.push('');
    
    // ステージ定義
    lines.push(`def Xform "${project.stage.name}" {`);
    
    // トラック（子プリム）を生成
    project.stage.tracks.forEach(track => {
      lines.push(...this.generateTrackPrim(track, 1));
    });
    
    lines.push('}');
    
    return lines.join('\n');
  }
  
  /**
   * トラックをUSDプリムとして生成
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