import { Tool } from '../../core/tool';
import { Layer, PainterData } from '../../../types/painter-types';

namespace Internal {
  export interface InitializePainterDataInput {
    view: any;
    width?: number;
    height?: number;
  }

  export const INITIALIZE_PAINTER_DATA_METADATA = {
    name: 'initialize_painter_data',
    description: 'Initialize painter data with default layer',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' },
        width: { type: 'number', description: 'Canvas width', default: 800 },
        height: { type: 'number', description: 'Canvas height', default: 600 }
      },
      required: ['view']
    }
  } as const;

  export async function executeInitializePainterData(args: InitializePainterDataInput): Promise<string> {
    const { view, width = 800, height = 600 } = args;
    
    // 既存のデータがある場合はそれを使用
    if (view._painterData?.layers && view._painterData.layers.length > 0) {
      view.layers = view._painterData.layers;
      view.currentLayerIndex = view._painterData.currentLayerIndex || 0;
      view.setLayers?.(view._painterData.layers);
      view.setCurrentLayerIndex?.(view.currentLayerIndex);
      return 'existing_data_loaded';
    }
    
    // ファイル名がある場合はそれを使用、なければデフォルト名
    const layerName = view.file?.basename || '背景';
    
    // 新しいデフォルトレイヤーを作成
    const defaultLayer: Layer = {
      name: layerName,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      canvas: document.createElement('canvas')
    };
    
    // キャンバスを初期化
    defaultLayer.canvas.width = width;
    defaultLayer.canvas.height = height;
    const ctx = defaultLayer.canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
    }
    
    const initialLayers = [defaultLayer];
    const initialData: PainterData = {
      layers: initialLayers,
      currentLayerIndex: 0,
      canvasWidth: width,
      canvasHeight: height
    };
    
    // viewにデータを設定
    view.layers = initialLayers;
    view.currentLayerIndex = 0;
    view._painterData = initialData;
    view.setLayers?.(initialLayers);
    view.setCurrentLayerIndex?.(0);
    view.saveHistory?.();
    
    return 'painter_data_initialized';
  }
}

export const initializePainterDataTool: Tool<Internal.InitializePainterDataInput> = {
  name: 'initialize_painter_data',
  description: 'Initialize painter data with default layer',
  parameters: Internal.INITIALIZE_PAINTER_DATA_METADATA.parameters,
  execute: Internal.executeInitializePainterData
}; 