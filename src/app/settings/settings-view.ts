import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings, saveSettings } from '../../storage/plugin-settings';
import { WorkflowInjector } from '../../service/comfy/workflow-injector';
import { getModelNameFromWorkflow } from '../../service/comfy/workflow-utils';
import { t } from '../../constants/obsidian-i18n';

export class AIPainterSettingTab extends PluginSettingTab {
  plugin: Plugin;
  settings: PluginSettings;

  constructor(app: App, plugin: Plugin, settings: PluginSettings) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: t('AI_SETTINGS') });

    new Setting(containerEl)
        .setName(t('COMFYUI_API_URL'))
        .setDesc(t('COMFYUI_API_DESC'))
        .addText(text =>
          text
            .setPlaceholder('http://localhost:8188')
            .setValue(this.settings.comfyApiUrl || '')
            .onChange(async (value) => {
              this.settings.comfyApiUrl = value;
              await saveSettings(this.plugin, this.settings);
            })
        )
        .addButton(button =>
          button
            .setIcon('network')
            .setTooltip(t('CONNECTION_TEST'))
            .onClick(async () => {
              button.setIcon('loader');
              button.setTooltip(t('TESTING'));
              button.setDisabled(true);
              
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(`${this.settings.comfyApiUrl}/`, {
                  method: 'GET',
                  signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  button.setIcon('check');
                  button.setTooltip(t('CONNECTION_SUCCESS'));
                  setTimeout(() => {
                    button.setIcon('network');
                    button.setTooltip(t('CONNECTION_TEST'));
                    button.setDisabled(false);
                  }, 2000);
                } else {
                  throw new Error(`HTTP ${response.status}`);
                }
              } catch (error) {
                button.setIcon('x');
                button.setTooltip(t('CONNECTION_FAILED'));
                console.error('ComfyUI connection test failed:', error);
                setTimeout(() => {
                  button.setIcon('network');
                  button.setTooltip(t('CONNECTION_TEST'));
                  button.setDisabled(false);
                }, 2000);
              }
            })
        );

    // Workflow JSON file uploads
    containerEl.createEl('h3', { text: t('WORKFLOW_SETTINGS') });


    // Get default i2i model name
    let defaultI2IModelName = 'v1-5-pruned-emaonly-fp16';
    try {
      const i2iWorkflow = await import('../../service/comfy/i2i.json');
      defaultI2IModelName = getModelNameFromWorkflow(i2iWorkflow);
    } catch (e) {
      console.error('Failed to load default i2i workflow:', e);
    }

    // T2I/I2I Unified Workflow
    new Setting(containerEl)
      .setName('画像生成ワークフロー (T2I/I2I統合)')
      .setDesc('画像生成に使用するワークフロー（画像の有無で自動的にT2I/I2Iを切り替え）')
      .addDropdown(dropdown => {
        // Build options
        const options: Record<string, string> = {};
        options['default'] = defaultI2IModelName;
        options['custom'] = 'カスタム（JSONアップロード）';
        
        dropdown
          .addOptions(options)
          .setValue(this.settings.imageToImageWorkflowType || 'default')
          .onChange(async (value) => {
            this.settings.imageToImageWorkflowType = value;
            
            if (value === 'custom') {
              // Show file picker immediately
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  try {
                    const text = await file.text();
                    const json = JSON.parse(text);
                    
                    // Validate workflow
                    const validation = WorkflowInjector.validate(json);
                    if (!validation.isValid) {
                      alert(`${t('INVALID_WORKFLOW')}: ${validation.errors.join(', ')}`);
                      // Reset to default
                      this.settings.imageToImageWorkflowType = 'default';
                      dropdown.setValue('default');
                      return;
                    }
                    
                    if (validation.warnings.length > 0) {
                      const proceed = confirm(`${t('WARNINGS')}: ${validation.warnings.join(', ')}\n\n${t('PROCEED_ANYWAY')}?`);
                      if (!proceed) {
                        // Reset to default
                        this.settings.imageToImageWorkflowType = 'default';
                        dropdown.setValue('default');
                        return;
                      }
                    }
                    
                    this.settings.imageToImageWorkflow = json;
                    this.settings.imageToImageWorkflowName = file.name;
                    await saveSettings(this.plugin, this.settings);
                    
                    // Update dropdown option text with model name
                    const modelName = getModelNameFromWorkflow(json);
                    dropdown.selectEl.options[dropdown.selectEl.selectedIndex].text = `カスタム: ${modelName}`;
                  } catch (error) {
                    alert(t('INVALID_JSON_FILE'));
                    console.error('Invalid JSON file:', error);
                    // Reset to default
                    this.settings.imageToImageWorkflowType = 'default';
                    dropdown.setValue('default');
                  }
                } else {
                  // User cancelled, reset to default
                  this.settings.imageToImageWorkflowType = 'default';
                  dropdown.setValue('default');
                }
              };
              input.click();
            } else {
              // Using default workflow
              delete this.settings.imageToImageWorkflow;
              delete this.settings.imageToImageWorkflowName;
              await saveSettings(this.plugin, this.settings);
            }
          });
        
        // If custom workflow is loaded, show its model name
        if (this.settings.imageToImageWorkflowType === 'custom' && this.settings.imageToImageWorkflow) {
          const modelName = getModelNameFromWorkflow(this.settings.imageToImageWorkflow);
          dropdown.selectEl.options[dropdown.selectEl.selectedIndex].text = `カスタム: ${modelName}`;
        }
      });

    // Get default inpaint model name
    let defaultInpaintModelName = '512-inpainting-ema';
    try {
      const inpaintWorkflow = await import('../../service/comfy/inpaint.json');
      defaultInpaintModelName = getModelNameFromWorkflow(inpaintWorkflow);
    } catch (e) {
      console.error('Failed to load default inpaint workflow:', e);
    }

    // Inpainting Workflow
    new Setting(containerEl)
      .setName(t('INPAINTING_WORKFLOW'))
      .setDesc(t('INPAINTING_WORKFLOW_DESC'))
      .addDropdown(dropdown => {
        // Build options
        const options: Record<string, string> = {};
        options['default'] = defaultInpaintModelName;
        options['custom'] = 'カスタム（JSONアップロード）';
        
        dropdown
          .addOptions(options)
          .setValue(this.settings.inpaintingWorkflowType || 'default')
          .onChange(async (value) => {
            this.settings.inpaintingWorkflowType = value;
            
            if (value === 'custom') {
              // Show file picker immediately
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  try {
                    const text = await file.text();
                    const json = JSON.parse(text);
                    
                    // Validate workflow
                    const validation = WorkflowInjector.validate(json);
                    if (!validation.isValid) {
                      alert(`${t('INVALID_WORKFLOW')}: ${validation.errors.join(', ')}`);
                      // Reset to default
                      this.settings.inpaintingWorkflowType = 'default';
                      dropdown.setValue('default');
                      return;
                    }
                    
                    if (validation.warnings.length > 0) {
                      const proceed = confirm(`${t('WARNINGS')}: ${validation.warnings.join(', ')}\n\n${t('PROCEED_ANYWAY')}?`);
                      if (!proceed) {
                        // Reset to default
                        this.settings.inpaintingWorkflowType = 'default';
                        dropdown.setValue('default');
                        return;
                      }
                    }
                    
                    this.settings.inpaintingWorkflow = json;
                    this.settings.inpaintingWorkflowName = file.name;
                    await saveSettings(this.plugin, this.settings);
                    
                    // Update dropdown option text with model name
                    const modelName = getModelNameFromWorkflow(json);
                    dropdown.selectEl.options[dropdown.selectEl.selectedIndex].text = `カスタム: ${modelName}`;
                  } catch (error) {
                    alert(t('INVALID_JSON_FILE'));
                    console.error('Invalid JSON file:', error);
                    // Reset to default
                    this.settings.inpaintingWorkflowType = 'default';
                    dropdown.setValue('default');
                  }
                } else {
                  // User cancelled, reset to default
                  this.settings.inpaintingWorkflowType = 'default';
                  dropdown.setValue('default');
                }
              };
              input.click();
            } else {
              // Using default workflow
              delete this.settings.inpaintingWorkflow;
              delete this.settings.inpaintingWorkflowName;
              await saveSettings(this.plugin, this.settings);
            }
          });
        
        // If custom workflow is loaded, show its model name
        if (this.settings.inpaintingWorkflowType === 'custom' && this.settings.inpaintingWorkflow) {
          const modelName = getModelNameFromWorkflow(this.settings.inpaintingWorkflow);
          dropdown.selectEl.options[dropdown.selectEl.selectedIndex].text = `カスタム: ${modelName}`;
        }
      });

    // Get default streaming model name
    let defaultStreamingModelName = 'sd_xl_turbo_1.0_fp16';
    try {
      const streamingWorkflow = await import('../../service/comfy/streaming.json');
      defaultStreamingModelName = getModelNameFromWorkflow(streamingWorkflow);
    } catch (e) {
      console.error('Failed to load default streaming workflow:', e);
    }

    // Streaming Workflow
    new Setting(containerEl)
      .setName(t('STREAMING_WORKFLOW'))
      .setDesc(t('STREAMING_WORKFLOW_DESC'))
      .addDropdown(dropdown => {
        // Build options
        const options: Record<string, string> = {};
        options['default'] = defaultStreamingModelName;
        options['custom'] = 'カスタム（JSONアップロード）';
        
        dropdown
          .addOptions(options)
          .setValue(this.settings.streamingWorkflowType || 'default')
          .onChange(async (value) => {
            this.settings.streamingWorkflowType = value;
            
            if (value === 'custom') {
              // Show file picker immediately
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  try {
                    const text = await file.text();
                    const json = JSON.parse(text);
                    
                    // Validate workflow
                    const validation = WorkflowInjector.validate(json);
                    if (!validation.isValid) {
                      alert(`${t('INVALID_WORKFLOW')}: ${validation.errors.join(', ')}`);
                      // Reset to default
                      this.settings.streamingWorkflowType = 'default';
                      dropdown.setValue('default');
                      return;
                    }
                    
                    if (validation.warnings.length > 0) {
                      const proceed = confirm(`${t('WARNINGS')}: ${validation.warnings.join(', ')}\n\n${t('PROCEED_ANYWAY')}?`);
                      if (!proceed) {
                        // Reset to default
                        this.settings.streamingWorkflowType = 'default';
                        dropdown.setValue('default');
                        return;
                      }
                    }
                    
                    this.settings.streamingWorkflow = json;
                    this.settings.streamingWorkflowName = file.name;
                    await saveSettings(this.plugin, this.settings);
                    
                    // Update dropdown option text with model name
                    const modelName = getModelNameFromWorkflow(json);
                    dropdown.selectEl.options[dropdown.selectEl.selectedIndex].text = `カスタム: ${modelName}`;
                  } catch (error) {
                    alert(t('INVALID_JSON_FILE'));
                    console.error('Invalid JSON file:', error);
                    // Reset to default
                    this.settings.streamingWorkflowType = 'default';
                    dropdown.setValue('default');
                  }
                } else {
                  // User cancelled, reset to default
                  this.settings.streamingWorkflowType = 'default';
                  dropdown.setValue('default');
                }
              };
              input.click();
            } else {
              // Using default workflow
              delete this.settings.streamingWorkflow;
              delete this.settings.streamingWorkflowName;
              await saveSettings(this.plugin, this.settings);
            }
          });
        
        // If custom workflow is loaded, show its model name
        if (this.settings.streamingWorkflowType === 'custom' && this.settings.streamingWorkflow) {
          const modelName = getModelNameFromWorkflow(this.settings.streamingWorkflow);
          dropdown.selectEl.options[dropdown.selectEl.selectedIndex].text = `カスタム: ${modelName}`;
        }
      });
  }

  async testWorkflow(workflowType: 'textToImage' | 'imageToImage' | 'inpainting', button: any): Promise<void> {
    button.setButtonText(t('TESTING'));
    button.setDisabled(true);
    
    try {
      // For text-to-image, perform actual generation test
      if (workflowType === 'textToImage') {
        const { ComfyUIWebSocketClient } = await import('../../service/comfy/comfyui-websocket');
        const { WorkflowInjector } = await import('../../service/comfy/workflow-injector');
        const wsClient = new ComfyUIWebSocketClient(this.settings.comfyApiUrl);
        
        // Connect WebSocket
        await wsClient.connect();
        
        try {
          // Prepare test workflow
          const workflow = JSON.parse(JSON.stringify(this.settings.textToImageWorkflow));
          
          // Inject test prompt
          WorkflowInjector.inject({
            workflow,
            positivePrompt: "Test image generation",
            negativePrompt: "bad quality"
          });
          
          // Queue workflow
          const promptId = await wsClient.queueWorkflow(workflow);
          console.log(`Test workflow queued with ID: ${promptId}`);
          
          // Wait for completion with timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Workflow execution timeout')), 30000)
          );
          
          await Promise.race([
            wsClient.waitForCompletion(promptId),
            timeoutPromise
          ]);
          
          button.setButtonText(t('CONNECTION_SUCCESS'));
        } finally {
          wsClient.disconnect();
        }
      } else {
        // For i2i and inpainting, just test connection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${this.settings.comfyApiUrl}/`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        button.setButtonText(t('CONNECTION_SUCCESS'));
      }
      
      setTimeout(() => {
        button.setButtonText(t('CONNECTION_TEST'));
        button.setDisabled(false);
      }, 2000);
      
    } catch (error) {
      button.setButtonText(t('CONNECTION_FAILED'));
      console.error(`${workflowType} workflow test failed:`, error);
      setTimeout(() => {
        button.setButtonText(t('CONNECTION_TEST'));
        button.setDisabled(false);
      }, 2000);
    }
  }
}
