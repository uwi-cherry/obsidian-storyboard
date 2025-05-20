import React, { useEffect, useState } from 'react';
import { TFile } from 'obsidian';
import type { ImageEditSiderbarView } from './right-sidebar-obsidian-view';
import { Layer } from '../painter/painter-types';
import { PsdView } from '../painter/view/painter-obsidian-view';
import { NavigationControls } from './components/NavigationControls';
import { LayerControls } from './components/LayerControls';
import ChatBox from './components/ChatBox';

interface RightSiderbarLayoutProps {
    view: ImageEditSiderbarView;
    layers: Layer[];
    currentLayerIndex: number;
    currentRowIndex: number | null;
    currentImageUrl: string | null;
    currentImagePrompt: string | null;
    onLayerChange: (layers: Layer[], currentIndex: number) => void;
    onImageChange: (url: string | null, prompt: string | null) => void;
}

const RightSiderbarLayout: React.FC<RightSiderbarLayoutProps> = ({
    view,
    layers,
    currentLayerIndex,
    currentImageUrl,
    currentImagePrompt,
    onLayerChange,
    onImageChange,
}) => {
    const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);

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
                const v = l.view as PsdView | null;
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
                onImageUrlChange={(url) => onImageChange(url, currentImagePrompt)}
            />

            {(currentImageUrl?.endsWith('.psd') || layers.length > 0) && (
                <LayerControls
                    view={view}
                    layers={layers}
                    currentLayerIndex={currentLayerIndex}
                />
            )}
            <ChatBox />
        </div>
    );
};

export default RightSiderbarLayout; 