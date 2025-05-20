import React from 'react';
import { ImageEditSiderbarView } from '../right-sidebar-obsidian-view';
import { Notice, App } from 'obsidian';
import { createPsd } from '../../painter/controller/painter-obsidian-controller';

interface NavigationControlsProps {
    view: ImageEditSiderbarView;
    isPsdPainterOpen: boolean;
    currentImageUrl: string | null;
    onBackToStoryboard: () => void;
    onOpenPsdPainter: () => void;
    onExportImage: () => void;
    app: App;
    onImageUrlChange: (newUrl: string | null) => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
    isPsdPainterOpen,
    currentImageUrl,
    onBackToStoryboard,
    onOpenPsdPainter,
    onExportImage,
    app,
    onImageUrlChange
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
        const newFile = await createPsd(app, undefined, undefined, true, storyboardPath);
        onImageUrlChange(newFile.path);
        onOpenPsdPainter();
    };

    return (
        <div className="flex gap-2 flex-col mb-4">
            <div className="flex gap-2">
                <button
                    className="flex-1 p-1 bg-[var(--interactive-accent)] text-[var(--text-on-accent)] rounded cursor-pointer text-xs hover:bg-[var(--interactive-accent-hover)]"
                    style={{ display: !currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'none' }}
                    onClick={handleCreateNewPsd}
                >
                    PSDペインターを新規作成
                </button>
                <button
                    className="flex-1 p-1 bg-[var(--interactive-accent)] text-[var(--text-on-accent)] rounded cursor-pointer text-xs hover:bg-[var(--interactive-accent-hover)]"
                    style={{ display: currentImageUrl?.endsWith('.psd') && !isPsdPainterOpen ? '' : 'none' }}
                    onClick={onOpenPsdPainter}
                >
                    PSDペインターを開く
                </button>
                <button
                    className="flex-1 p-1 bg-[var(--interactive-accent)] text-[var(--text-on-accent)] rounded cursor-pointer text-xs hover:bg-[var(--interactive-accent-hover)]"
                    style={{ display: !isPsdPainterOpen ? '' : 'none' }}
                    onClick={handleExportVideo}
                >
                    動画出力
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    className="flex-1 p-1 bg-[var(--interactive-accent)] text-[var(--text-on-accent)] rounded cursor-pointer text-xs hover:bg-[var(--interactive-accent-hover)]"
                    style={{ display: isPsdPainterOpen ? '' : 'none' }}
                    onClick={onBackToStoryboard}
                >
                    ストーリーボードに戻る
                </button>
                <button
                    className="flex-1 p-1 bg-[var(--interactive-accent)] text-[var(--text-on-accent)] rounded cursor-pointer text-xs hover:bg-[var(--interactive-accent-hover)]"
                    style={{ display: isPsdPainterOpen ? '' : 'none' }}
                    onClick={onExportImage}
                >
                    画像出力
                </button>
            </div>
        </div>
    );
}; 