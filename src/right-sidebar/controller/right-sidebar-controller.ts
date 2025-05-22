import { Layer } from '../../painter/painter-types';
import { RightSidebarView } from '../right-sidebar-obsidian-view';

export class RightSidebarController {
  constructor(private view: RightSidebarView) {}

  /**
   * ビューへレイヤー情報を反映
   */
  updateLayers(layers: Layer[], index: number) {
    this.view.updateLayers(layers, index);
  }

  /**
   * ビューへ表示中画像の情報を反映
   */
  updateImage(url: string | null, prompt: string | null) {
    this.view.updateImage(url, prompt);
  }
}
