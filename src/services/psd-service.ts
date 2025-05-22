import { App, TFile } from 'obsidian';
import { createPsd, generateThumbnail, loadPsdFile, savePsdFile } from '../painter/painter-files';
import { Layer } from '../painter/painter-types';

export interface IPsdService {
    load(app: App, file: TFile): Promise<{ width: number; height: number; layers: Layer[] }>;
    save(app: App, file: TFile, layers: Layer[]): Promise<void>;
    create(
        app: App,
        imageFile?: TFile,
        layerName?: string,
        isOpen?: boolean,
        targetDir?: string
    ): Promise<TFile>;
    thumbnail(app: App, file: TFile): Promise<string | null>;
}

export class PsdService implements IPsdService {
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
        isOpen?: boolean,
        targetDir?: string
    ) {
        return createPsd(app, imageFile, layerName, isOpen, targetDir);
    }
    async thumbnail(app: App, file: TFile) {
        return generateThumbnail(app, file);
    }
}
