import { Plugin } from 'obsidian';

export interface ExportSettings {
  customFolderPath: string;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  customFolderPath: 'exports',
};

const EXPORT_SETTINGS_KEY = 'export-settings';

export async function loadExportSettings(plugin: Plugin): Promise<ExportSettings> {
  const data = await plugin.loadData() || {};
  return Object.assign({}, DEFAULT_EXPORT_SETTINGS, data[EXPORT_SETTINGS_KEY] || {});
}

export async function saveExportSettings(plugin: Plugin, settings: ExportSettings): Promise<void> {
  const data = await plugin.loadData() || {};
  data[EXPORT_SETTINGS_KEY] = settings;
  await plugin.saveData(data);
}

export async function updateExportSettings(plugin: Plugin, updates: Partial<ExportSettings>): Promise<void> {
  const currentSettings = await loadExportSettings(plugin);
  const newSettings = { ...currentSettings, ...updates };
  await saveExportSettings(plugin, newSettings);
}