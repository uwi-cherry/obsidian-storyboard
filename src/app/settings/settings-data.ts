export interface PluginSettings {
  falApiKey: string;
  styleInstructions: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  falApiKey: '',
  styleInstructions: 'コミカルで分かりやすい作風で執筆してください。',
};

export async function loadSettings(plugin: import('obsidian').Plugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: import('obsidian').Plugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
