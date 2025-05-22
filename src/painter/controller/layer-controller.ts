import { TFile } from 'obsidian';
import { addLayer, deleteLayer } from '../painter-files';
import type { PainterView } from '../view/painter-obsidian-view';

export class LayerController {
  add(view: PainterView, name?: string, imageFile?: TFile) {
    addLayer(view, name, imageFile);
  }

  delete(view: PainterView, index: number) {
    deleteLayer(view, index);
  }
}
