export interface PluginSettings {
  provider: 'fal' | 'replicate';
  falApiKey: string;
  replicateApiKey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  provider: 'fal',
  falApiKey: '',
  replicateApiKey: '',
};

export async function loadSettings(plugin: import('obsidian').Plugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: import('obsidian').Plugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
