import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings, saveSettings } from './settings-data';

export class StoryboardSettingTab extends PluginSettingTab {
  plugin: Plugin;
  settings: PluginSettings;

  constructor(app: App, plugin: Plugin, settings: PluginSettings) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'AI Settings' });

    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Select AI image generation provider')
      .addDropdown(dropdown =>
        dropdown
          .addOption('fal.ai', 'fal.ai')
          .addOption('comfy', 'ComfyUI')
          .setValue(this.settings.aiProvider)
          .onChange(async (value: 'fal.ai' | 'comfy') => {
            this.settings.aiProvider = value;
            await saveSettings(this.plugin, this.settings);
            this.display(); // Re-render to show/hide relevant settings
          })
      );

    if (this.settings.aiProvider === 'fal.ai') {
      new Setting(containerEl)
        .setName('fal.ai API Key')
        .setDesc('API key for fal.ai service')
        .addText(text =>
          text
            .setPlaceholder('fal-...')
            .setValue(this.settings.falApiKey || '')
            .onChange(async (value) => {
              this.settings.falApiKey = value;
              await saveSettings(this.plugin, this.settings);
            })
        );
    }

    if (this.settings.aiProvider === 'comfy') {
      new Setting(containerEl)
        .setName('ComfyUI API URL')
        .setDesc('URL for ComfyUI server (e.g., http://localhost:8188)')
        .addText(text =>
          text
            .setPlaceholder('http://localhost:8188')
            .setValue(this.settings.comfyApiUrl || '')
            .onChange(async (value) => {
              this.settings.comfyApiUrl = value;
              await saveSettings(this.plugin, this.settings);
            })
        );

      // ComfyUI setup instructions
      const setupDiv = containerEl.createDiv();
      setupDiv.createEl('h3', { text: 'ComfyUI Setup' });
      setupDiv.createEl('p', { text: 'To use ComfyUI, you need to install and run it locally:' });
      
      const setupList = setupDiv.createEl('ol');
      setupList.createEl('li', { text: 'Download ComfyUI from: ' }).createEl('a', {
        text: 'https://github.com/comfyanonymous/ComfyUI',
        href: 'https://github.com/comfyanonymous/ComfyUI'
      });
      setupList.createEl('li', { text: 'Install required models in ComfyUI/models/checkpoints/ (e.g., sd_xl_base_1.0.safetensors)' });
      setupList.createEl('li', { text: 'Start ComfyUI server: python main.py --listen' });
      setupList.createEl('li', { text: 'Verify server is running at http://localhost:8188' });
      
      setupDiv.createEl('p', { text: 'Supported workflows: Text-to-Image, Image-to-Image, Inpainting' });
    }
  }
}
