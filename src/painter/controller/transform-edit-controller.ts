import { SelectionRect } from '../painter-types';
import type { PainterView } from '../view/painter-obsidian-view';
import type { SelectionState } from '../hooks/useSelectionState';
import { t } from '../../i18n';

export class TransformEditController {
  private overlay: HTMLDivElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private backupCanvas: HTMLCanvasElement | null = null;
  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private rotation = 0; // radians

  constructor(
    private view: PainterView,
    private state: SelectionState,
    private onFinish: () => void
  ) {}

  start() {
    const rect = this.state.getBoundingRect();
    if (!rect) return;
    const layer = this.view.psdDataHistory[this.view.currentIndex].layers[
      this.view.currentLayerIndex
    ];
    const layerCtx = layer.canvas.getContext('2d');
    if (!layerCtx) return;

    // backup original
    this.backupCanvas = document.createElement('canvas');
    this.backupCanvas.width = rect.width;
    this.backupCanvas.height = rect.height;
    const bctx = this.backupCanvas.getContext('2d');
    if (!bctx) return;
    bctx.drawImage(
      layer.canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );

    // copy selection
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = rect.width;
    this.overlayCanvas.height = rect.height;
    const octx = this.overlayCanvas.getContext('2d');
    if (!octx) return;
    octx.drawImage(
      layer.canvas,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );

    // clear original selection area
    layerCtx.clearRect(rect.x, rect.y, rect.width, rect.height);
    this.view.renderCanvas();

    // create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.zIndex = '1001';
    const canvasRect = this.view._canvas.getBoundingClientRect();
    const scale = this.view.zoom / 100;
    this.overlay.style.left = `${canvasRect.left + rect.x * scale}px`;
    this.overlay.style.top = `${canvasRect.top + rect.y * scale}px`;
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlay.appendChild(this.overlayCanvas);

    // control buttons
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.left = '0';
    menu.style.top = '-28px';
    menu.className = 'flex gap-1 bg-secondary border border-modifier-border p-1 rounded';

    const btnScaleUp = document.createElement('button');
    btnScaleUp.className = 'px-2 py-1 text-xs';
    btnScaleUp.textContent = t('SCALE');
    btnScaleUp.onclick = () => {
      this.scale *= 1.2;
      this.updateTransform();
    };
    const btnRotate = document.createElement('button');
    btnRotate.className = 'px-2 py-1 text-xs';
    btnRotate.textContent = t('ROTATE');
    btnRotate.onclick = () => {
      this.rotation += Math.PI / 2;
      this.updateTransform();
    };
    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'px-2 py-1 text-xs';
    btnConfirm.textContent = t('CONFIRM');
    btnConfirm.onclick = () => this.confirm(rect);
    const btnCancel = document.createElement('button');
    btnCancel.className = 'px-2 py-1 text-xs';
    btnCancel.textContent = t('CANCEL');
    btnCancel.onclick = () => this.cancel(rect);
    menu.appendChild(btnScaleUp);
    menu.appendChild(btnRotate);
    menu.appendChild(btnConfirm);
    menu.appendChild(btnCancel);

    this.overlay.appendChild(menu);
    document.body.appendChild(this.overlay);

    this.overlay.onpointerdown = (e) => {
      this.dragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    };
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.updateTransform();
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.offsetX += e.clientX - this.dragStartX;
    this.offsetY += e.clientY - this.dragStartY;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.updateTransform();
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private updateTransform() {
    if (!this.overlayCanvas) return;
    this.overlayCanvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale}) rotate(${this.rotation}rad)`;
  }

  private cleanup() {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.overlay?.remove();
    this.overlay = null;
  }

  confirm(rect: SelectionRect) {
    const layer = this.view.psdDataHistory[this.view.currentIndex].layers[
      this.view.currentLayerIndex
    ];
    const ctx = layer.canvas.getContext('2d');
    if (!ctx || !this.overlayCanvas) return;

    ctx.save();
    ctx.translate(
      rect.x + rect.width / 2 + this.offsetX / (this.view.zoom / 100),
      rect.y + rect.height / 2 + this.offsetY / (this.view.zoom / 100)
    );
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.overlayCanvas, -rect.width / 2, -rect.height / 2);
    ctx.restore();
    this.view.renderCanvas();
    this.cleanup();
    this.onFinish();
  }

  cancel(rect: SelectionRect) {
    const layer = this.view.psdDataHistory[this.view.currentIndex].layers[
      this.view.currentLayerIndex
    ];
    const ctx = layer.canvas.getContext('2d');
    if (!ctx || !this.backupCanvas) return;

    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    ctx.drawImage(this.backupCanvas, rect.x, rect.y);
    this.view.renderCanvas();
    this.cleanup();
    this.onFinish();
  }
}
