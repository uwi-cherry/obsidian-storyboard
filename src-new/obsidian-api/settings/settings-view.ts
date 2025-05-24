import { Plugin, PluginSettingTab, Setting } from 'obsidian';

export class StoryboardSettingTab extends PluginSettingTab {
  plugin: Plugin;

  constructor(app: any, plugin: Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'Storyboard Settings' });
    
    new Setting(containerEl)
      .setName('Auto-save')
      .setDesc('Automatically save changes')
      .addToggle(toggle => toggle
        .setValue(true)
        .onChange(async (value) => {

        }));
        
    new Setting(containerEl)
      .setName('Default View Mode')
      .setDesc('Default view mode for storyboard files')
      .addDropdown(dropdown => dropdown
        .addOption('markdown', 'Markdown')
        .addOption('storyboard', 'Storyboard')
        .setValue('markdown')
        .onChange(async (value) => {

        }));
  }
} 