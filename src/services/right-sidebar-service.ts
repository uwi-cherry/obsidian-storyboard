import { Layer } from '../painter/painter-types';
import { RightSidebarView } from '../right-sidebar/right-sidebar-obsidian-view';

export interface IRightSidebarService {
  updateLayers(layers: Layer[], currentIndex: number): void;
  updateImage(url: string | null, prompt: string | null): void;
}

export class RightSidebarService implements IRightSidebarService {
  constructor(private view: RightSidebarView) {}

  updateLayers(layers: Layer[], currentIndex: number): void {
    this.view.updateLayers(layers, currentIndex);
  }

  updateImage(url: string | null, prompt: string | null): void {
    this.view.updateImage(url, prompt);
  }
}
