import React, { useEffect, useState } from 'react';
import { App, TFile } from 'obsidian';
import { Layer } from '../painter/painter-types';
import { PainterView } from '../painter/view/painter-obsidian-view';
import { NavigationControls } from './components/NavigationControls';
import { LayerControls } from './components/LayerControls';
import ChatBox from './components/ChatBox';
import { LayerAndFileOps } from './right-sidebar-obsidian-view-interface';

interface RightSidebarReactViewProps {
    app: App;
    layers: Layer[];
    currentLayerIndex: number;
    currentRowIndex: number | null;
    currentImageUrl: string | null;
    currentImagePrompt: string | null;
    onLayerChange: (layers: Layer[], currentIndex: number) => void;
    onImageChange: (url: string | null, prompt: string | null) => void;
    createPsd: (
        app: App,
        imageFile?: TFile,
        layerName?: string,
        isOpen?: boolean,
        targetDir?: string
    ) => Promise<TFile>;
    layerOps: LayerAndFileOps;
    addImageLayer: (file: TFile) => void;
}

const RightSidebarReactView: React.FC<RightSidebarReactViewProps> = ({
    app,
    layers,
    currentLayerIndex,
    currentImageUrl,
    currentImagePrompt,
    onLayerChange,
    onImageChange,
    createPsd,
    layerOps,
    addImageLayer,
}) => {
    const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);

    useEffect(() => {
        const updatePsdPainterState = () => {
            setIsPsdPainterOpen(
                app.workspace.getLeavesOfType('psd-view').length > 0
            );
        };

        app.workspace.on('active-leaf-change', updatePsdPainterState);
        return () => {
            app.workspace.off('active-leaf-change', updatePsdPainterState);
        };
    }, [app.workspace]);

    const handleOpenPsdPainter = async () => {
        if (!currentImageUrl) return;
        const fileObj = app.vault.getAbstractFileByPath(currentImageUrl);
        if (fileObj instanceof TFile) {
            const leaf = app.workspace.getLeaf(true);
            await leaf.openFile(fileObj, { active: true });
        }
    };

    const handleBackToStoryboard = () => {
        app.workspace.getLeavesOfType('psd-view').forEach((l) => l.detach());
        const storyboardLeaf = app.workspace
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
            app.workspace.setActiveLeaf(storyboardLeaf);
        }
    };

    return (
        <div className="flex flex-col h-full shrink-0">
            <NavigationControls
                isPsdPainterOpen={isPsdPainterOpen}
                currentImageUrl={currentImageUrl}
                onBackToStoryboard={handleBackToStoryboard}
                onOpenPsdPainter={handleOpenPsdPainter}
                onExportImage={() => {}}
                app={app}
                onImageUrlChange={(url) => onImageChange(url, currentImagePrompt)}
                createPsd={createPsd}
            />

            {(currentImageUrl?.endsWith('.psd') || layers.length > 0) && (
                <LayerControls
                    app={app}
                    layerOps={layerOps}
                    addImageLayer={addImageLayer}
                    layers={layers}
                    currentLayerIndex={currentLayerIndex}
                />
            )}
            <ChatBox />
        </div>
    );
};

export default RightSidebarReactView;
