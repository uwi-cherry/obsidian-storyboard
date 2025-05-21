import type { App, TFile } from 'obsidian';
import type { StoryboardData } from '../storyboard-types';

export interface StoryboardViewProps {
  initialData: StoryboardData;
  onDataChange: (data: StoryboardData) => void;
  app: App;
  generateThumbnail: (app: App, file: TFile) => Promise<string | null>;
  createPsd: (
    app: App,
    imageFile?: TFile,
    layerName?: string,
    isOpen?: boolean,
    targetDir?: string
  ) => Promise<TFile>;
}
