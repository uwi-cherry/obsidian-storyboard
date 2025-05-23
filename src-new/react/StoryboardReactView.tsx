import React from 'react';

interface StoryboardReactViewProps {
  initialData: any;
  onDataChange: (data: any) => void;
}

export default function StoryboardReactView({ initialData, onDataChange }: StoryboardReactViewProps) {
  return (
    <div className="storyboard-view">
      <h2>Storyboard View</h2>
      <p>Scenes: {initialData?.scenes?.length || 0}</p>
      <button onClick={() => onDataChange({ ...initialData, modified: true })}>
        Modify Storyboard
      </button>
    </div>
  );
} 