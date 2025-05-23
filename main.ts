import { Plugin } from 'obsidian';
import { ObsidianFactoryManager } from './src-new/obsidian-api/obsidian-factory-manager';

export type MyPluginInstance = MyPlugin;

export default class MyPlugin extends Plugin {
  private factoryManager: ObsidianFactoryManager;

  async onload() {
    console.log('Loading plugin...');
    
    // ファクトリマネージャーを初期化
    this.factoryManager = new ObsidianFactoryManager(this);
    
    // 全ファクトリを初期化
    this.factoryManager.initializeAll();
    
    console.log('Plugin loaded successfully!');
  }

  async onunload() {
    console.log('Unloading plugin...');
  }
}
