import { App } from 'obsidian';

/**
 * コアプラグイン「アウトライン」を強制的に更新する
 */
export function refreshOutline(app: App): void {
  const outlinePlugin = (app as any).internalPlugins?.plugins?.["outline"];
  if (outlinePlugin?.enabled) {
    const instance = outlinePlugin.instance as any;
    const view = instance?.outlineView;
    if (view && typeof view.onFileChanged === "function") {
      view.onFileChanged();
    }
  }
} 