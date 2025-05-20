import { Plugin, TFile } from 'obsidian';
import { addIcon } from 'obsidian';
import { PSD_VIEW_TYPE, PSD_EXTENSION, PSD_ICON } from '../constants';
import { PSD_ICON_SVG } from '../icons';
import { LAYER_SIDEBAR_VIEW_TYPE } from '../right-sidebar/right-sidebar-obsidian-view';
import {
    createPainterView,
    undoActive,
    redoActive,
    createLayerSidebar
} from './controller/painter-obsidian-controller';
import { createPsd } from './painter-files';

export function loadPlugin(plugin: Plugin) {
    addIcon(PSD_ICON, PSD_ICON_SVG);

    plugin.registerView(PSD_VIEW_TYPE, (leaf) => createPainterView(leaf));
    plugin.registerView(LAYER_SIDEBAR_VIEW_TYPE, (leaf) => createLayerSidebar(leaf));
    plugin.registerExtensions([PSD_EXTENSION], PSD_VIEW_TYPE);

    plugin.register(() => {
        plugin.app.workspace.detachLeavesOfType(PSD_VIEW_TYPE);
        plugin.app.workspace.detachLeavesOfType(LAYER_SIDEBAR_VIEW_TYPE);
    });

    plugin.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension.toLowerCase().match(/^(png|jpe?g|gif|webp)$/)) {
            menu.addItem((item) => {
                item
                    .setTitle('PSD Painterで開く')
                    .setIcon('image')
                    .onClick(() => createPsd(plugin.app, file));
            });
        }
    });

    plugin.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
        if (evt.ctrlKey && evt.key === 'z' && !evt.shiftKey) {
            evt.preventDefault();
            undoActive(plugin.app);
        }
        if ((evt.ctrlKey && evt.shiftKey && evt.key === 'z') || (evt.ctrlKey && evt.key === 'y')) {
            evt.preventDefault();
            redoActive(plugin.app);
        }
    });

    const ribbonIconEl = plugin.addRibbonIcon('palette', 'PSD Tool', () => {
        createPsd(plugin.app);
    });
    ribbonIconEl.addClass('my-plugin-ribbon-class');
} 