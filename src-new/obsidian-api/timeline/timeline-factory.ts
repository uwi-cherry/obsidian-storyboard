import { createRoot } from 'react-dom/client';
import React from 'react';
import TimelineReactView from '../../react/app/TimelineReactView';
import { TimelineView } from './timeline-view';

/**
 * Timeline Factory - React Injection and View Creation
 */
export class TimelineFactory {
  
  createTimelineView(leaf: any): TimelineView {
    const view = new TimelineView(leaf);
    this.injectReact(view);
    return view;
  }

  private injectReact(view: TimelineView): void {
    const originalOnOpen = view.onOpen.bind(view);
    const originalOnClose = view.onClose.bind(view);
    
    view.onOpen = async () => {
      await originalOnOpen();
      this.renderReactComponent(view);
    };
    
    view.onClose = async () => {
      if (view.reactRoot) {
        view.reactRoot.unmount();
        view.reactRoot = null;
      }
      await originalOnClose();
    };
  }

  private renderReactComponent(view: TimelineView): void {
    view.containerEl.empty();
    view.reactRoot = createRoot(view.containerEl);
    view.reactRoot.render(React.createElement(TimelineReactView, {
      project: null,
      onProjectChange: () => {}
    }));
  }
} 