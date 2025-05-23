import { Plugin, addIcon } from 'obsidian';
import { OTIO_VIEW_TYPE, OTIO_ICON } from '../constants';
import { TIMELINE_ICON_SVG } from '../icons';
import { createOtioFile } from './timeline-files';
import { createTimelineView } from './view/timeline-obsidian-view';
import { t } from '../i18n';

export function initializeTimelineIntegration(plugin: Plugin): void {
    addIcon(OTIO_ICON, TIMELINE_ICON_SVG);

    plugin.registerView(OTIO_VIEW_TYPE, (leaf) => createTimelineView(leaf));
    plugin.registerExtensions(['otio'], OTIO_VIEW_TYPE);

    plugin.register(() => {
        plugin.app.workspace.detachLeavesOfType(OTIO_VIEW_TYPE);
    });

    plugin.addRibbonIcon(OTIO_ICON, t('ADD_TIMELINE'), async () => {
        const file = await createOtioFile(plugin.app, 'Untitled');
        const leaf = plugin.app.workspace.getLeaf(true);
        await leaf.openFile(file);
    });
}
