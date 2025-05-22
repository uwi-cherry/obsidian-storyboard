import { App, TFile } from 'obsidian';
import { createPsd, generateThumbnail, loadPsdFile, savePsdFile } from '../painter-files';
import { Layer } from '../painter-types';

export class PsdController {
    async load(app: App, file: TFile) {
        return loadPsdFile(app, file);
    }

    async save(app: App, file: TFile, layers: Layer[]) {
        return savePsdFile(app, file, layers);
    }

    async create(
        app: App,
        imageFile?: TFile,
        layerName?: string,
        isOpen = true,
        targetDir?: string
    ) {
        return createPsd(app, imageFile, layerName, isOpen, targetDir);
    }

    async thumbnail(app: App, file: TFile) {
        return generateThumbnail(app, file);
    }
}
