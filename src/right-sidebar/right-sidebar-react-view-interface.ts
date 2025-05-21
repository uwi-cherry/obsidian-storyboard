import type { App, TFile } from 'obsidian';
import type { RightSidebarView } from './right-sidebar-obsidian-view';
import type { Layer } from '../painter/painter-types';

export interface RightSidebarReactViewProps {
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
