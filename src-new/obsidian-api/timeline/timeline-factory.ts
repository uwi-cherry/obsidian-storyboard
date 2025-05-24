import { createRoot } from 'react-dom/client';
import React from 'react';
import TimelineReactView from '../../react/app/timeline/Page';
import { TimelineView } from './timeline-view';

/**
 * Timeline Factory - React Injection and View Creation
 */
export class TimelineFactory {
  
  createTimelineView(leaf: any): TimelineView {
    const view = new TimelineView(leaf, () => this.renderReactComponent(view));
    return view;
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