export interface PluginSettings {
  falApiKey: string;
  comfyApiUrl: string;
  aiProvider: 'fal.ai' | 'comfy';
}

export const DEFAULT_SETTINGS: PluginSettings = {
  falApiKey: '',
  comfyApiUrl: 'http://localhost:8188',
  aiProvider: 'fal.ai',
};

export async function loadSettings(plugin: import('obsidian').Plugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: import('obsidian').Plugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
