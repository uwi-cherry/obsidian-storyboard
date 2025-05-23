import { BLEND_MODE_TO_COMPOSITE_OPERATION } from '../constants';

export interface Layer {
	name: string;
	visible: boolean;
	opacity: number;
	blendMode: keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION;
	canvas: HTMLCanvasElement;
}

export interface PsdData {
	width: number;
	height: number;
	layers: Layer[];
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}