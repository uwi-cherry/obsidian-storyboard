import { Plugin, addIcon } from 'obsidian';
import { StoryboardFactory } from './storyboard-factory';
import { STORYBOARD_ICON_SVG } from '../common/icons';

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
    addIcon('storyboard', STORYBOARD_ICON_SVG);
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

  // アイコンは共通定義から読み込み
} 