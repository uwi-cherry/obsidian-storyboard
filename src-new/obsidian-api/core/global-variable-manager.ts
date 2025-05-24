import { Plugin, App } from 'obsidian';

type Listener<T = any> = (value: T) => void;

export class GlobalVariableManager {
  private app: App;
  private globalData: Record<string, any> = {};
  private listeners: Map<string, Set<Listener>> = new Map();

  constructor(plugin: Plugin) {
    this.app = plugin.app;
  }

  /** グローバル変数をセットし、通知 */
  setVariable<T = any>(key: string, value: T): void {
    this.globalData[key] = value;
    this.emit(key, value);
  }

  /** グローバル変数を取得（他プラグイン含む） */
  getVariable<T = any>(key: string, pluginId?: string): T | undefined {
    if (pluginId) {
      const targetPlugin = (this.app as any).plugins?.plugins?.[pluginId];
      return (targetPlugin as any)?.globalVariableManager?.globalData?.[key];
    } else {
      return this.globalData[key];
    }
  }

  /** 存在確認 */
  hasVariable(key: string, pluginId?: string): boolean {
    if (pluginId) {
      const targetPlugin = (this.app as any).plugins?.plugins?.[pluginId];
      return (
        (targetPlugin as any)?.globalVariableManager?.globalData &&
        key in (targetPlugin as any).globalVariableManager.globalData
      );
    } else {
      return key in this.globalData;
    }
  }

  /** 削除し通知 */
  removeVariable(key: string): void {
    delete this.globalData[key];
    this.emit(key, undefined);
  }

  /** 全取得 */
  getAllVariables(pluginId?: string): Record<string, any> {
    if (pluginId) {
      const targetPlugin = (this.app as any).plugins?.plugins?.[pluginId];
      return { ...(targetPlugin as any)?.globalVariableManager?.globalData };
    } else {
      return { ...this.globalData };
    }
  }

  /** リアクティブ購読 */
  subscribe<T = any>(key: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    // 初期通知
    if (key in this.globalData) {
      listener(this.globalData[key]);
    }

    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  /** イベント発火 */
  private emit<T = any>(key: string, value: T): void {
    this.listeners.get(key)?.forEach((listener) => listener(value));
  }

  /** コアプラグイン「アウトライン」を強制的に更新する */
  refreshOutline(): void {
    const outlinePlugin = (this.app as any).internalPlugins?.plugins?.["outline"];
    if (outlinePlugin?.enabled) {
      const instance = outlinePlugin.instance as any;
      const view = instance?.outlineView;
      if (view && typeof view.onFileChanged === "function") {
        view.onFileChanged();  // ← ここでアウトラインを再読み込み
      }
    }
  }
}
