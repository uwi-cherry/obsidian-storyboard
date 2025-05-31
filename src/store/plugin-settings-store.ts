import { create } from 'zustand';
import type { PluginSettings } from '../app/settings/settings-data';

interface SettingsState extends PluginSettings {
  setSettings: (settings: PluginSettings) => void;
}

export const usePluginSettingsStore = create<SettingsState>((set) => ({
  falApiKey: '',
  setSettings: (settings) => set(settings),
}));
