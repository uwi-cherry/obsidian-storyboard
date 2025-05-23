import { Tool } from '../../core/tool';
import { TFile } from 'obsidian';
import { Layer } from '../../../obsidian-api/painter/painter-types';

namespace Internal {
  export interface AddLayerInput {
    view: any;
    name?: string;
    imageFile?: TFile;
  }

  export const ADD_LAYER_METADATA = {
    name: 'add_layer',
    description: 'Add new layer to painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' },
        name: { type: 'string', description: 'Layer name', nullable: true },
        imageFile: { type: 'object', description: 'Image file', nullable: true }
      },
      required: ['view']
    }
  } as const;

  const DEFAULT_CANVAS_WIDTH = 800;
  const DEFAULT_CANVAS_HEIGHT = 600;

  export async function executeAddLayer(args: AddLayerInput): Promise<string> {
    const { view, name = 'New Layer', imageFile } = args;
    const baseWidth = view.layers[0]?.canvas?.width ?? DEFAULT_CANVAS_WIDTH;
    const baseHeight = view.layers[0]?.canvas?.height ?? DEFAULT_CANVAS_HEIGHT;

    const canvas = document.createElement('canvas');
    let ctx: CanvasRenderingContext2D | null = null;

    if (imageFile) {
      const data = await view.app.vault.readBinary(imageFile);
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = url;
      });
      canvas.width = baseWidth;
      canvas.height = baseHeight;
      ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
      const x = (canvas.width - img.width) / 2;
      const y = (canvas.height - img.height) / 2;
      ctx.drawImage(img, x, y);
      URL.revokeObjectURL(url);
    } else {
      canvas.width = baseWidth;
      canvas.height = baseHeight;
      ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
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

    const newLayers = [layer, ...(view.layers ?? [])];
    view.layers = newLayers;
    view.currentLayerIndex = 0;
    view.setLayers?.(newLayers);
    view.setCurrentLayerIndex?.(0);

    return 'layer_added';
  }
}

export const addLayerTool: Tool<Internal.AddLayerInput> = {
  name: 'add_layer',
  description: 'Add new layer to painter view',
  parameters: Internal.ADD_LAYER_METADATA.parameters,
  execute: Internal.executeAddLayer
};
