import { Plugin, addIcon } from 'obsidian';
import { TimelineFactory } from './timeline-factory';
import { TIMELINE_ICON_SVG } from '../common/icons';

/**
 * Timeline Plugin - Obsidian Plugin Integration
 */
export class TimelinePlugin {
  private plugin: Plugin;
  private factory: TimelineFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new TimelineFactory();
  }

  initialize(): void {
    addIcon('timeline', TIMELINE_ICON_SVG);
    this.plugin.registerView('timeline-view', (leaf) => this.factory.createTimelineView(leaf));
    this.plugin.registerExtensions(['otio', 'timeline'], 'timeline-view');
    
    this.plugin.addRibbonIcon('timeline', 'Open Timeline', () => {
      // サービスAPIが処理
    });
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType('timeline-view');
    });
  }

  // アイコンは共通定義から読み込み
} 