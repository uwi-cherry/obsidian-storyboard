import React from 'react';
import type { TimelineProject } from 'src-new/types/timeline';

interface TimelineReactViewProps {
  project: TimelineProject;
  onProjectChange: (project: TimelineProject) => void;
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
