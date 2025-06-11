declare module 'spectral.js' {
  export class Color {
    constructor(color: string | number[] | { r: number; g: number; b: number });
    toString(): string;
    tintingStrength: number;
  }

  export function mix(...colors: [Color, number][]): Color;
  export function palette(color1: Color, color2: Color, size: number): Color[];
  export function gradient(t: number, ...colorStops: [Color, number][]): Color;
  export function glsl(): string;
}
