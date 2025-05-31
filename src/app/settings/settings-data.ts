export interface PluginSettings {
  falApiKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  falApiKey: '',
};

export async function loadSettings(plugin: import('obsidian').Plugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: import('obsidian').Plugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
