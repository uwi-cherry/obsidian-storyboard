export interface PluginSettings {
  comfyApiUrl: string;
  textToImageWorkflow?: any;
  imageToImageWorkflow?: any;
  inpaintingWorkflow?: any;
  streamingWorkflow?: any;
  textToImageWorkflowName?: string;
  imageToImageWorkflowName?: string;
  inpaintingWorkflowName?: string;
  streamingWorkflowName?: string;
  textToImageWorkflowType?: string;
  imageToImageWorkflowType?: string;
  inpaintingWorkflowType?: string;
  streamingWorkflowType?: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  comfyApiUrl: 'http://localhost:8188',
};

export async function loadSettings(plugin: import('obsidian').Plugin): Promise<PluginSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
}

export async function saveSettings(plugin: import('obsidian').Plugin, settings: PluginSettings): Promise<void> {
  await plugin.saveData(settings);
}
