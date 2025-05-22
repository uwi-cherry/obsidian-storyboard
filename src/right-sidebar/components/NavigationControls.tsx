import React from 'react';
import { RightSidebarView } from '../right-sidebar-obsidian-view';
import { Notice, App } from 'obsidian';
import { t } from '../../i18n';
import { PsdController } from '../../painter/controller/psd-controller';

interface NavigationControlsProps {
    view: RightSidebarView;
    isPsdPainterOpen: boolean;
    currentImageUrl: string | null;
    onBackToStoryboard: () => void;
    onOpenPsdPainter: () => void;
    onExportImage: () => void;
    app: App;
    onImageUrlChange: (newUrl: string | null) => void;
    psdService: PsdController;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
    isPsdPainterOpen,
    currentImageUrl,
    onBackToStoryboard,
    onOpenPsdPainter,
    onExportImage,
    app,
    onImageUrlChange,
    psdService
}) => {
    const handleExportVideo = async () => {
        try {
            // ffmpegのバージョン情報を取得
            const ffmpeg = await import('@ffmpeg/core');
            console.log('FFmpeg version:', ffmpeg.version);
            new Notice('FFmpeg is available!');
        } catch (error) {
            console.error('FFmpeg test failed:', error);
            new Notice('FFmpeg test failed. Check console for details.');
        }
    };

    const handleCreateNewPsd = async () => {
        // ストーリーボードのディレクトリを取得
        const storyboardPath = app.workspace.getActiveFile()?.parent?.path || '';
        const newFile = await psdService.create(app, undefined, undefined, true, storyboardPath);
        onImageUrlChange(newFile.path);
        onOpenPsdPainter();
    };

    return (
        <div className="flex gap-2 flex-col mb-4">
            <div className="flex gap-2">
                <button
                    className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
                    onClick={handleCreateNewPsd}
                >
                    {t('CREATE_PSD')}
                </button>
                <button
                    className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'hidden'}`}
                    onClick={onOpenPsdPainter}
                >
                    {t('OPEN_PSD')}
                </button>
                <button
                    className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${!isPsdPainterOpen ? '' : 'hidden'}`}
                    onClick={handleExportVideo}
                >
                    {t('EXPORT_VIDEO')}
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
                    onClick={onBackToStoryboard}
                >
                    {t('BACK_TO_STORYBOARD')}
                </button>
                <button
                    className={`flex-1 p-1 bg-accent text-on-accent rounded cursor-pointer text-xs hover:bg-accent-hover ${isPsdPainterOpen ? '' : 'hidden'}`}
                    onClick={onExportImage}
                >
                    {t('EXPORT_IMAGE')}
                </button>
            </div>
        </div>
    );
}; 