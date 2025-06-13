import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExportSettings {
  customFolderPath: string;
}

interface ExportSettingsStore {
  settings: ExportSettings;
  updateSettings: (settings: Partial<ExportSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ExportSettings = {
  customFolderPath: 'exports',
};

export const useExportSettingsStore = create<ExportSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'ai-painter-export-settings',
      version: 1,
    }
  )
);