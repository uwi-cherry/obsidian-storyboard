import { Plugin, addIcon } from 'obsidian';
import { StoryboardFactory } from './storyboard-factory';

/**
 * Storyboard Plugin - Obsidian Plugin Integration
 */
export class StoryboardPlugin {
  private plugin: Plugin;
  private factory: StoryboardFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new StoryboardFactory();
  }

  initialize(): void {
    addIcon('storyboard', this.getStoryboardIcon());
    this.plugin.registerExtensions(['storyboard'], 'markdown');
    
    this.plugin.addRibbonIcon('storyboard', 'Add Storyboard', () => {
      // サービスAPIが処理
    });
    
    this.plugin.register(() => {
      this.factory.cleanupStoryboardViewRoots(this.plugin.app);
    });
  }

  // ファクトリメソッドへのアクセスを提供
  getFactory(): StoryboardFactory {
    return this.factory;
  }

  private getStoryboardIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M7 7h10M7 12h10M7 17h10"/>
      <circle cx="5" cy="7" r="1"/>
      <circle cx="5" cy="12" r="1"/>
      <circle cx="5" cy="17" r="1"/>
    </svg>`;
  }
} 