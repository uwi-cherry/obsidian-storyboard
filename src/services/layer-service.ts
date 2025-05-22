import { TFile } from 'obsidian';
import { addLayer, deleteLayer } from '../painter/painter-files';
import { PainterView } from '../painter/view/painter-obsidian-view';

export interface ILayerService {
    add(view: PainterView, name?: string, imageFile?: TFile): void;
    delete(view: PainterView, index: number): void;
}

export class LayerService implements ILayerService {
    add(view: PainterView, name?: string, imageFile?: TFile) {
        addLayer(view, name, imageFile);
    }
    delete(view: PainterView, index: number) {
        deleteLayer(view, index);
    }
}
