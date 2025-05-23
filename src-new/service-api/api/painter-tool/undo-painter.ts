import { Tool } from '../../core/tool';

namespace Internal {
  export interface UndoPainterInput {
    view: any;
  }

  export const UNDO_PAINTER_METADATA = {
    name: 'undo_painter',
    description: 'Undo current painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' }
      },
      required: ['view']
    }
  } as const;

  export async function executeUndoPainter(args: UndoPainterInput): Promise<string> {
    const { view } = args;
    if (view && typeof view.undo === 'function') {
      view.undo();
      return 'undo';
    }
    return 'no-op';
  }
}

export const undoPainterTool: Tool<Internal.UndoPainterInput> = {
  name: 'undo_painter',
  description: 'Undo current painter view',
  parameters: Internal.UNDO_PAINTER_METADATA.parameters,
  execute: Internal.executeUndoPainter
};
