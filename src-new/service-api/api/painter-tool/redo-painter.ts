import { Tool } from '../../core/tool';

namespace Internal {
  export interface RedoPainterInput {
    view: any;
  }

  export const REDO_PAINTER_METADATA = {
    name: 'redo_painter',
    description: 'Redo painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' }
      },
      required: ['view']
    }
  } as const;

  export async function executeRedoPainter(args: RedoPainterInput): Promise<string> {
    const { view } = args;
    if (view && typeof view.redo === 'function') {
      view.redo();
      return 'redo';
    }
    return 'no-op';
  }
}

export const redoPainterTool: Tool<Internal.RedoPainterInput> = {
  name: 'redo_painter',
  description: 'Redo painter view',
  parameters: Internal.REDO_PAINTER_METADATA.parameters,
  execute: Internal.executeRedoPainter
};
