import { Plugin } from 'obsidian';

/**
 * 永続化ストレージ管理クラス
 */
export class PersistentStorageManager {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  /**
   * 永続的なストレージに保存
   */
  async setPersistentVariable(key: string, value: any): Promise<void> {
    const data = await this.plugin.loadData() || {};
    if (!data.globalVariables) {
      data.globalVariables = {};
    }
    data.globalVariables[key] = value;
    await this.plugin.saveData(data);
  }

  async getPersistentVariable(key: string): Promise<any> {
    const data = await this.plugin.loadData() || {};
    return data.globalVariables?.[key];
  }

  async hasPersistentVariable(key: string): Promise<boolean> {
    const data = await this.plugin.loadData() || {};
    return data.globalVariables && key in data.globalVariables;
  }

  async removePersistentVariable(key: string): Promise<void> {
    const data = await this.plugin.loadData() || {};
    if (data.globalVariables) {
      delete data.globalVariables[key];
      await this.plugin.saveData(data);
    }
  }

  async getAllPersistentVariables(): Promise<Record<string, any>> {
    const data = await this.plugin.loadData() || {};
    return { ...data.globalVariables };
  }

  /**
   * 初期化時に永続化データを読み込み
   */
  async initialize(): Promise<Record<string, any>> {
    const data = await this.plugin.loadData() || {};
    return data.globalVariables || {};
  }
} 