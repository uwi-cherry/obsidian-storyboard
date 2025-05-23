import { Plugin } from 'obsidian';

/**
 * Sidebar Service - Right Sidebar関連ユーティリティ
 */
export class SidebarService {
  
  /**
   * レイヤー追加
   */
  static addLayer(layerData: any): void {
    console.log('Adding layer:', layerData);
    // レイヤー追加ロジック
  }

  /**
   * レイヤー削除
   */
  static removeLayer(layerId: string): void {
    console.log('Removing layer:', layerId);
    // レイヤー削除ロジック
  }

  /**
   * レイヤー可視性切り替え
   */
  static toggleLayerVisibility(layerId: string): void {
    console.log('Toggling layer visibility:', layerId);
    // 可視性切り替えロジック
  }

  /**
   * レイヤー名変更
   */
  static renameLayer(layerId: string, newName: string): void {
    console.log('Renaming layer:', layerId, 'to', newName);
    // レイヤー名変更ロジック
  }

  /**
   * レイヤー順序変更
   */
  static reorderLayers(layerIds: string[]): void {
    console.log('Reordering layers:', layerIds);
    // レイヤー順序変更ロジック
  }
} 