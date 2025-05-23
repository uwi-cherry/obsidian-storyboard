import { Plugin, addIcon } from 'obsidian';
import { TimelineFactory } from './timeline-factory';

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
    addIcon('timeline', this.getTimelineIcon());
    this.plugin.registerView('timeline-view', (leaf) => this.factory.createTimelineView(leaf));
    this.plugin.registerExtensions(['otio', 'timeline'], 'timeline-view');
    
    this.plugin.addRibbonIcon('timeline', 'Open Timeline', () => {
      // サービスAPIが処理
    });
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType('timeline-view');
    });
  }

  private getTimelineIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 9h1v1H9zM9 12h1v1H9zM9 15h1v1H9z"/>
      <path d="M13 9h7M13 12h7M13 15h7"/>
    </svg>`;
  }
} 