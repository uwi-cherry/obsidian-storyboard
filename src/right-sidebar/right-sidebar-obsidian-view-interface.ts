import { Layer } from '../painter/painter-types';
import { BLEND_MODE_TO_COMPOSITE_OPERATION } from '../constants';

/**
 * レイヤー操作とファイル操作のためのインターフェース
 */
export interface LayerAndFileOps {
    // レイヤー操作
    /** 新しいレイヤーを追加する */
    addLayer: (name?: string) => void;
    
    /** 指定したインデックスのレイヤーを削除する */
    deleteLayer: (index: number) => void;
    
    /** 指定したインデックスのレイヤーの表示/非表示を切り替える */
    toggleLayerVisibility: (index: number) => void;
    
    /** 指定したインデックスのレイヤー名を変更する */
    renameLayer: (index: number, newName: string) => void;
    
    /** 現在のレイヤーを設定する */
    setCurrentLayer: (index: number) => void;
    
    /** レイヤーの不透明度を設定する */
    setOpacity: (index: number, opacity: number) => void;
    
    /** レイヤーのブレンドモードを設定する */
    setBlendMode: (index: number, mode: keyof typeof BLEND_MODE_TO_COMPOSITE_OPERATION) => void;
    
    // ファイル操作
    /** PSD ファイルのレイヤー情報を読み込む */
    loadPsdLayers: (path: string) => Promise<Layer[]>;
}
