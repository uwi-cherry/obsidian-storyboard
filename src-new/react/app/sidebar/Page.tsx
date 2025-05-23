import React from 'react';
import LayerControls from './components/LayerControls';

export default function SidebarReactView() {
  return (
    <div className="sidebar-view p-2 flex flex-col gap-2">
      <LayerControls />
    </div>
  );
}
