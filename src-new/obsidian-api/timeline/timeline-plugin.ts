import { Plugin, addIcon } from 'obsidian';
import { TIMELINE_VIEW_TYPE, createTimelineView } from './timeline-view';

/**
 * Timeline Factory - Timeline View Registration
 */
export class TimelinePlugin {
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  initialize(): void {
    addIcon('timeline', this.getTimelineIcon());
    this.plugin.registerView(TIMELINE_VIEW_TYPE, (leaf) => createTimelineView(leaf));
    this.plugin.registerExtensions(['otio'], TIMELINE_VIEW_TYPE);
    
    this.plugin.addRibbonIcon('timeline', 'Create Timeline', () => {
      // サービスAPIが処理
    });
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType(TIMELINE_VIEW_TYPE);
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