import React, { useEffect, useState } from 'react';
import { MarkdownView, TFile } from 'obsidian';
import { RightSidebarView } from './right-sidebar-obsidian-view';
import { Layer } from '../painter/painter-types';
import { PainterView } from '../painter/view/painter-obsidian-view';
import { PsdService } from '../services/psd-service';
import { IChatService } from '../services/chat-service';
import { NavigationControls } from './components/NavigationControls';
import { LayerControls } from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { RightSidebarController } from './controller/right-sidebar-controller';
import { getCurrentViewMode } from '../storyboard/storyboard-factory';

interface RightSidebarReactViewProps {
    view: RightSidebarView;
    layers: Layer[];
    currentLayerIndex: number;
    currentRowIndex: number | null;
    currentImageUrl: string | null;
    currentImagePrompt: string | null;
    controller: RightSidebarController;
    psdService: PsdService;
    chatService: IChatService;
}

const RightSidebarReactView: React.FC<RightSidebarReactViewProps> = ({
    view,
    layers,
    currentLayerIndex,
    currentImageUrl,
    currentImagePrompt,
    controller,
    psdService,
    chatService,
}) => {
    const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
    const [showLayerControls, setShowLayerControls] = useState(false);

    useEffect(() => {
        const updatePsdPainterState = () => {
            setIsPsdPainterOpen(
                view.app.workspace.getLeavesOfType('psd-view').length > 0
            );
        };

        view.app.workspace.on('active-leaf-change', updatePsdPainterState);
        return () => {
            view.app.workspace.off('active-leaf-change', updatePsdPainterState);
        };
    }, [view.app.workspace]);

    useEffect(() => {
        const updateVisibility = () => {
            const leaf = view.app.workspace.activeLeaf;
            if (!leaf) {
                setShowLayerControls(false);
                return;
            }
            const isPsd = leaf.view instanceof PainterView;
            const isStoryboard =
                leaf.view instanceof MarkdownView &&
                getCurrentViewMode(leaf) === 'storyboard';
            const isLayerSidebar = leaf.view instanceof RightSidebarView;
            setShowLayerControls(isPsd || isStoryboard || isLayerSidebar);
        };

        updateVisibility();
        view.app.workspace.on('active-leaf-change', updateVisibility);
        return () => {
            view.app.workspace.off('active-leaf-change', updateVisibility);
        };
    }, [view.app.workspace]);

    const handleOpenPsdPainter = async () => {
        if (!currentImageUrl) return;
        const fileObj = view.app.vault.getAbstractFileByPath(currentImageUrl);
        if (fileObj instanceof TFile) {
            const leaf = view.app.workspace.getLeaf(true);
            await leaf.openFile(fileObj, { active: true });
        }
    };

    const handleBackToStoryboard = () => {
        view.app.workspace.getLeavesOfType('psd-view').forEach((l) => l.detach());
        const storyboardLeaf = view.app.workspace
            .getLeavesOfType('markdown')
            .find((l) => {
                const v = l.view as PainterView | null;
                return (
                    v &&
                    v.contentEl &&
                    v.contentEl.querySelector('.storyboard-view-container')
                );
            });
        if (storyboardLeaf) {
            view.app.workspace.setActiveLeaf(storyboardLeaf);
        }
    };

    return (
        <div className="flex flex-col h-full shrink-0">
            <NavigationControls
                view={view}
                isPsdPainterOpen={isPsdPainterOpen}
                currentImageUrl={currentImageUrl}
                onBackToStoryboard={handleBackToStoryboard}
                onOpenPsdPainter={handleOpenPsdPainter}
                onExportImage={() => {}}
                app={view.app}
                onImageUrlChange={(url) => controller.updateImage(url, currentImagePrompt)}
                psdService={psdService}
            />

            {showLayerControls && (currentImageUrl?.endsWith('.psd') || layers.length > 0) && (
                <LayerControls
                    view={view}
                    layers={layers}
                    currentLayerIndex={currentLayerIndex}
                />
            )}
            <ChatBox chatService={chatService} />
        </div>
    );
};

export default RightSidebarReactView;
