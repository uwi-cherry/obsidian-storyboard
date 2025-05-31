declare module 'etro' {
  export interface MovieOptions {
    canvas: HTMLCanvasElement;
    actx?: AudioContext;
    background?: string;
    repeat?: boolean;
  }

  export interface LayerOptions {
    startTime: number;
    duration?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    destWidth?: number;
    destHeight?: number;
  }

  export interface VideoLayerOptions extends LayerOptions {
    source: HTMLVideoElement | string;
  }

  export interface ImageLayerOptions extends LayerOptions {
    source: HTMLImageElement | string;
  }

  export interface TextLayerOptions extends LayerOptions {
    text: string;
    font?: string;
  }

  export interface AudioLayerOptions extends LayerOptions {
    source: HTMLAudioElement | string;
  }

  export class Movie {
    constructor(options: MovieOptions);

    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    currentTime: number;
    duration: number;
    paused: boolean;
    ended: boolean;
    ready: boolean;
    layers: EtroLayer[];
    effects: Effect[];

    addLayer(layer: EtroLayer): void;
    play(options?: { duration?: number; onStart?: () => void }): Promise<void>;
    pause(): void;
    stop(): void;
    seek(time: number): void;
    refresh(): Promise<void>;
    record(options?: {
      frameRate?: number;
      duration?: number;
      type?: string;
      video?: boolean;
      audio?: boolean;
      onStart?: (recorder: MediaRecorder) => void;
    }): Promise<Blob>;
  }

  export class EtroLayer {
    startTime: number;
    duration: number;
    x: number;
    y: number;
    width: number;
    height: number;
    effects: Effect[];

    addEffect(effect: Effect): EtroLayer;
  }

  export class VideoLayer extends EtroLayer {
    constructor(options: VideoLayerOptions);
    source: HTMLVideoElement | string;
  }

  export class ImageLayer extends EtroLayer {
    constructor(options: ImageLayerOptions);
    source: HTMLImageElement | string;
  }

  export class TextLayer extends EtroLayer {
    constructor(options: TextLayerOptions);
    text: string;
    font: string;
  }

  export class AudioLayer extends EtroLayer {
    constructor(options: AudioLayerOptions);
    source: HTMLAudioElement | string;
  }

  export class Effect {
    // 基本エフェクトクラス
  }

  export namespace layer {
    export const Video: typeof VideoLayer;
    export const Image: typeof ImageLayer;
    export const Text: typeof TextLayer;
    export const Audio: typeof AudioLayer;
  }

  export namespace effect {
    // エフェクト関連の型定義は必要に応じて追加
  }

  const etro: {
    Movie: typeof Movie;
    layer: typeof layer;
    effect: any;
  };

  export default etro;
}
