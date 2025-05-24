import { Plugin } from 'obsidian';
import { StateStorage } from 'zustand/middleware';

export class ObsidianStorage implements StateStorage {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async getItem(name: string): Promise<string | null> {
    try {
      const data = await this.plugin.loadData() || {};
      const value = data.zustandStores?.[name];
      return value ? JSON.stringify(value) : null;
    } catch (error) {
      return null;
    }
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      const data = await this.plugin.loadData() || {};
      if (!data.zustandStores) {
        data.zustandStores = {};
      }
      data.zustandStores[name] = JSON.parse(value);
      await this.plugin.saveData(data);
    } catch (error) {
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      const data = await this.plugin.loadData() || {};
      if (data.zustandStores) {
        delete data.zustandStores[name];
        await this.plugin.saveData(data);
      }
    } catch (error) {
    }
  }
}

export const createObsidianStorage = (plugin: Plugin): StateStorage => {
  return new ObsidianStorage(plugin);
}; 