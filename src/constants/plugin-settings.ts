import type { PluginSettings } from '../app/settings/settings-data';

let settings: PluginSettings | null = null;

export function setPluginSettings(s: PluginSettings): void {
  settings = s;
}

export function getPluginSettings(): PluginSettings | null {
  return settings;
}

