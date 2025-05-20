import type MyPlugin from '../../main';

/**
 * Chat機能の初期化（ChatBox用グローバル登録のみ）
 */
import { SettingTab } from '../settings/settings';

export function initializeChatIntegration(plugin: MyPlugin) {
    // @ts-ignore
    (window as any).__psdPainterPlugin = plugin;
    // AI設定タブ追加
    plugin.addSettingTab(new SettingTab(plugin.app, plugin, (plugin as any).settings));
}
