import { SelectionRect } from '../painter-types';
import type { PainterViewInterface } from './painter-view-interface';
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
    private view: PainterViewInterface,
    private rect: SelectionRect,
    private onFinish: () => void
  ) {}

  start() {
    const rect = this.rect;
    const layer = this.view.layers.history[this.view.layers.currentIndex].layers[
      this.view.layers.currentLayerIndex
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
    const canvasEl = this.view.canvasElement;
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const scale = this.view.zoom / 100;
    this.overlay.style.left = `${canvasRect.left + rect.x * scale}px`;
    this.overlay.style.top = `${canvasRect.top + rect.y * scale}px`;
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.border = '1px dashed var(--color-accent)';
    this.overlay.appendChild(this.overlayCanvas);

    // control buttons
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.left = '0';
    menu.style.top = '-28px';
    menu.className = 'flex gap-1 bg-secondary border border-modifier-border p-1 rounded';

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'px-2 py-1 text-xs';
    btnConfirm.textContent = t('CONFIRM');
    btnConfirm.onclick = () => this.confirm();
    const btnCancel = document.createElement('button');
    btnCancel.className = 'px-2 py-1 text-xs';
    btnCancel.textContent = t('CANCEL');
    btnCancel.onclick = () => this.cancel();
    menu.appendChild(btnConfirm);
    menu.appendChild(btnCancel);

    this.overlay.appendChild(menu);
    const handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.right = '-8px';
    handle.style.bottom = '-8px';
    handle.style.width = '16px';
    handle.style.height = '16px';
    handle.style.background = 'var(--background-primary)';
    handle.style.border = '2px solid var(--color-accent)';
    handle.style.borderRadius = '50%';
    handle.style.cursor = 'grab';
    this.overlay.appendChild(handle);
    document.body.appendChild(this.overlay);

    let handleDragging = false;
    let startVx = 0;
    let startVy = 0;
    let startDist = 1;
    let startAngle = 0;
    let startScale = 1;
    let startRotation = 0;

    handle.onpointerdown = (e) => {
      e.stopPropagation();
      handleDragging = true;
      const r = this.overlayCanvas!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      startVx = e.clientX - cx;
      startVy = e.clientY - cy;
      startDist = Math.hypot(startVx, startVy);
      startAngle = Math.atan2(startVy, startVx);
      startScale = this.scale;
      startRotation = this.rotation;
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    };

    const handleMove = (e: PointerEvent) => {
      if (!handleDragging) return;
      const r = this.overlayCanvas!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const vx = e.clientX - cx;
      const vy = e.clientY - cy;
      const dist = Math.hypot(vx, vy);
      const angle = Math.atan2(vy, vx);
      this.scale = startScale * (dist / startDist);
      this.rotation = startRotation + (angle - startAngle);
      this.updateTransform();
    };

    const handleUp = () => {
      handleDragging = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

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

  confirm() {
    const layer = this.view.layers.history[this.view.layers.currentIndex].layers[
      this.view.layers.currentLayerIndex
    ];
    const ctx = layer.canvas.getContext('2d');
    if (!ctx || !this.overlayCanvas) return;

    ctx.save();
    ctx.translate(
      this.rect.x +
        this.rect.width / 2 +
        this.offsetX / (this.view.zoom / 100),
      this.rect.y +
        this.rect.height / 2 +
        this.offsetY / (this.view.zoom / 100)
    );
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.overlayCanvas, -this.rect.width / 2, -this.rect.height / 2);
    ctx.restore();
    this.view.renderCanvas();
    this.cleanup();
    this.onFinish();
  }

  cancel() {
    const layer = this.view.layers.history[this.view.layers.currentIndex].layers[
      this.view.layers.currentLayerIndex
    ];
    const ctx = layer.canvas.getContext('2d');
    if (!ctx || !this.backupCanvas) return;

    ctx.clearRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    ctx.drawImage(this.backupCanvas, this.rect.x, this.rect.y);
    this.view.renderCanvas();
    this.cleanup();
    this.onFinish();
  }
}
