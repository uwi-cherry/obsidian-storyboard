
import type { PainterView } from '../view/painter-obsidian-view';
import { ActionMenu } from '../view/components/ActionMenu';
import type { SelectionState } from '../hooks/useSelectionState';
import type { IActionMenuService } from '../../services/action-menu-service';

export class ActionMenuController {
  private menu: ActionMenu;

  constructor(
    private view: PainterView,
    private state: SelectionState,
    private service: IActionMenuService
  ) {
    this.menu = new ActionMenu(view as any);
  }

  dispose() {
    this.menu.dispose();
  }

  showGlobal() {
    this.menu.showGlobal({
      fill: () => this.service.fill(this.view, this.state),
      clear: () => this.service.clear(this.view, this.state),
      edit: () => this.service.edit(this.view, this.state),
    });
  }

  showSelection(onCancel: () => void) {
    const rect = this.state.getBoundingRect();
    if (!rect) return;
    this.menu.showSelection(rect, {
      fill: () => this.service.fill(this.view, this.state),
      clear: () => this.service.clear(this.view, this.state),
      edit: () => this.service.edit(this.view, this.state),
      cancel: () => {
        onCancel();
        this.showGlobal();
      },
    });
  }

  hide() {
    this.menu.hide();
  }
}

