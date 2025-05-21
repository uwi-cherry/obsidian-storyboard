import { Plugin, addIcon } from 'obsidian';
import { OTIO_ICON_SVG } from '../icons';
import { OTIO_VIEW_TYPE, OTIO_EXTENSION, OTIO_ICON } from '../constants';
import { createTimelineView } from './timeline-factory';

export function loadTimelinePlugin(plugin: Plugin) {
  addIcon(OTIO_ICON, OTIO_ICON_SVG);

  plugin.registerView(OTIO_VIEW_TYPE, leaf => createTimelineView(leaf));
  plugin.registerExtensions([OTIO_EXTENSION], OTIO_VIEW_TYPE);

  plugin.register(() => {
    plugin.app.workspace.detachLeavesOfType(OTIO_VIEW_TYPE);
  });
}
