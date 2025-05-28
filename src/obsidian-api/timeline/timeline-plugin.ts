import { Plugin, addIcon } from 'obsidian';
import { TimelineFactory } from './timeline-factory';
import { OBSIDIAN_ICONS } from '../../constants/icons';

export class TimelinePlugin {
  private plugin: Plugin;
  private factory: TimelineFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new TimelineFactory();
  }

  initialize(): void {
    addIcon('timeline', OBSIDIAN_ICONS.TIMELINE_ICON_SVG);
    this.plugin.registerView('timeline-view', (leaf) => this.factory.createTimelineView(leaf));
    this.plugin.registerExtensions(['usda', 'timeline'], 'timeline-view');
    
    this.plugin.register(() => {
      this.plugin.app.workspace.detachLeavesOfType('timeline-view');
    });
  }

} 
