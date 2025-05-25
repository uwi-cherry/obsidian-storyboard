import { Layer } from 'src-new/types/painter-types';
import { Tool } from '../../core/tool';
import { TFile } from 'obsidian';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';

namespace Internal {
  export interface AddLayerInput {
    name?: string;
    imageFile?: TFile;
    fileData?: ArrayBuffer | Blob;
    width?: number;
    height?: number;
    app?: any;
  }

  export const ADD_LAYER_METADATA = {
    name: 'add_layer',
    description: 'Create and add new layer',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Layer name', nullable: true },
        imageFile: { type: 'object', description: 'Image file', nullable: true },
        fileData: { type: 'object', description: 'Image data', nullable: true },
        width: { type: 'number', description: 'Canvas width', default: 800 },
        height: { type: 'number', description: 'Canvas height', default: 600 },
        app: { type: 'object', description: 'Obsidian app instance', nullable: true }
      },
      required: []
    }
  } as const;

  const DEFAULT_CANVAS_WIDTH = 800;
  const DEFAULT_CANVAS_HEIGHT = 600;

  export async function executeAddLayer(args: AddLayerInput): Promise<string> {
    const { 
      name = 'New Layer', 
      imageFile,
      fileData,
      width = DEFAULT_CANVAS_WIDTH,
      height = DEFAULT_CANVAS_HEIGHT,
      app
    } = args;

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();
    
    historyStore.saveHistory(layersStore.layers, currentLayerIndexStore.currentLayerIndex);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');

    let imageArrayBuffer: ArrayBuffer | undefined;

    if (imageFile && app) {
      imageArrayBuffer = await app.vault.readBinary(imageFile);
    } else if (fileData) {
      if (fileData instanceof Blob) {
        imageArrayBuffer = await fileData.arrayBuffer();
      } else {
        imageArrayBuffer = fileData;
      }
    }

    if (imageArrayBuffer) {
      const blob = new Blob([imageArrayBuffer]);
      const url = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = url;
      });

      const x = (canvas.width - img.width) / 2;
      const y = (canvas.height - img.height) / 2;
      ctx.drawImage(img, x, y);
      URL.revokeObjectURL(url);
    } else {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const layer: Layer = {
      name,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas
    };

    layersStore.addLayer(layer);


    return 'layer_added';
  }
}

export const addLayerTool: Tool<Internal.AddLayerInput> = {
  name: 'add_layer',
  description: 'Create and add new layer',
  parameters: Internal.ADD_LAYER_METADATA.parameters,
  execute: Internal.executeAddLayer
}; 
