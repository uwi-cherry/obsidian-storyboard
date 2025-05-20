import React, { useEffect, useState } from 'react';
import { App, TFile } from 'obsidian';
import type { RightSidebarView } from './right-sidebar-obsidian-view';
import { Layer } from '../painter/painter-types';
import { PainterView } from '../painter/view/painter-obsidian-view';
import { NavigationControls } from './components/NavigationControls';
import { LayerControls } from './components/LayerControls';
import ChatBox from './components/ChatBox';

interface RightSidebarReactViewProps {
    view: RightSidebarView;
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
}

const RightSidebarReactView: React.FC<RightSidebarReactViewProps> = ({
    view,
    layers,
    currentLayerIndex,
    currentImageUrl,
    currentImagePrompt,
    onLayerChange,
    onImageChange,
    createPsd,
}) => {
    const [isPsdPainterOpen, setIsPsdPainterOpen] = useState(false);
    const [canReturn, setCanReturn] = useState(false);

    useEffect(() => {
        const updatePsdPainterState = () => {
            setIsPsdPainterOpen(
                view.app.workspace.getLeavesOfType('psd-view').length > 0
            );
            setCanReturn(view.hasStoryboardForActivePsd());
        };

        view.app.workspace.on('active-leaf-change', updatePsdPainterState);
        window.addEventListener('psd-opened-from-storyboard', updatePsdPainterState);
        updatePsdPainterState();
        return () => {
            view.app.workspace.off('active-leaf-change', updatePsdPainterState);
            window.removeEventListener('psd-opened-from-storyboard', updatePsdPainterState);
        };
    }, [view]);

    const handleOpenPsdPainter = async () => {
        if (!currentImageUrl) return;
        const fileObj = view.app.vault.getAbstractFileByPath(currentImageUrl);
        if (fileObj instanceof TFile) {
            const storyboardPath = view.app.workspace.getActiveFile()?.path || '';
            const leaf = view.app.workspace.getLeaf(true);
            await leaf.openFile(fileObj, { active: true });
            window.dispatchEvent(
                new CustomEvent('psd-opened-from-storyboard', {
                    detail: { psdPath: fileObj.path, storyboardPath },
                })
            );
        }
    };

    const handleBackToStoryboard = () => {
        view.backToStoryboard();
    };

    return (
        <div className="flex flex-col h-full shrink-0">
            <NavigationControls
                view={view}
                isPsdPainterOpen={isPsdPainterOpen}
                currentImageUrl={currentImageUrl}
                canReturnToStoryboard={canReturn}
                onBackToStoryboard={handleBackToStoryboard}
                onOpenPsdPainter={handleOpenPsdPainter}
                onExportImage={() => {}}
                app={view.app}
                onImageUrlChange={(url) => onImageChange(url, currentImagePrompt)}
                createPsd={createPsd}
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

export default RightSidebarReactView;
