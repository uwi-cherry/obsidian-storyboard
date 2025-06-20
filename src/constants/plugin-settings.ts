import type { PluginSettings } from '../storage/plugin-settings';

let settings: PluginSettings | null = null;

export function setPluginSettings(s: PluginSettings): void {
  settings = s;
}

export function getPluginSettings(): PluginSettings | null {
  return settings;
}

