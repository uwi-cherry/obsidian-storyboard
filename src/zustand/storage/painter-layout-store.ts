import { create } from 'zustand';
import { persist, StorageValue } from 'zustand/middleware';

export type LayoutDirection = 'horizontal' | 'vertical';

interface PainterLayoutState {
  layoutDirection: LayoutDirection;
  setLayoutDirection: (direction: LayoutDirection) => void;
}

export const usePainterLayoutStore = create<PainterLayoutState>()(
  persist(
    (set) => ({
      layoutDirection: 'horizontal',
      setLayoutDirection: (direction: LayoutDirection) => set({ layoutDirection: direction }),
    }),
    {
      name: 'painter-layout-store',
      storage: {
        getItem: async (name: string): Promise<StorageValue<PainterLayoutState> | null> => {
          try {
            if (typeof window !== 'undefined' && (window as any).storyboardPlugin) {
              const plugin = (window as any).storyboardPlugin;
              const data = await plugin.loadData() || {};
              const value = data.painterLayoutStore;
              return value || null;
            }
            return null;
          } catch (error) {
            return null;
          }
        },
        setItem: async (name: string, value: StorageValue<PainterLayoutState>) => {
          try {
            if (typeof window !== 'undefined' && (window as any).storyboardPlugin) {
              const plugin = (window as any).storyboardPlugin;
              const data = await plugin.loadData() || {};
              data.painterLayoutStore = value;
              await plugin.saveData(data);
            }
          } catch (error) {
            console.error(error);
          }
        },
        removeItem: async (name: string) => {
          try {
            if (typeof window !== 'undefined' && (window as any).storyboardPlugin) {
              const plugin = (window as any).storyboardPlugin;
              const data = await plugin.loadData() || {};
              delete data.painterLayoutStore;
              await plugin.saveData(data);
            }
          } catch (error) {
            console.error(error);
          }
        },
      },
    }
  )
); 
