import React from 'react';

interface TimelineReactViewProps {
  project: any;
  onProjectChange: (project: any) => void;
}

export default function TimelineReactView({ project, onProjectChange }: TimelineReactViewProps) {
  return (
    <div className="timeline-view">
      <h2>Timeline View (OTIO)</h2>
      <p>Project: {project?.name || 'Untitled'}</p>
      <button onClick={() => onProjectChange({ ...project, modified: true })}>
        Modify Project
      </button>
    </div>
  );
} 
