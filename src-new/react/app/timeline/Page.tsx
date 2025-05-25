import React, { useEffect, useState } from 'react';
import type { App, TFile } from 'obsidian';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import type { TimelineProject } from 'src-new/types/timeline';

interface TimelineReactViewProps {
  app: App;
  file: TFile | null;
}

export default function TimelineReactView({ app, file }: TimelineReactViewProps) {
  const [project, setProject] = useState<TimelineProject | null>(null);

  useEffect(() => {
    if (!file) return;

    const loadProject = async () => {
      try {
        const result = await toolRegistry.executeTool('load_otio_file', {
          app,
          file
        });
        setProject(JSON.parse(result));
      } catch (error) {
        console.error(error);
      }
    };

    loadProject();
  }, [app, file]);

  const handleProjectChange = async (updated: TimelineProject) => {
    if (!file) return;
    try {
      await toolRegistry.executeTool('save_otio_file', {
        app,
        file,
        project: updated
      });
      setProject(updated);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="timeline-view">
      <h2>Timeline View (OTIO)</h2>
      <p>Project: {project?.name || 'Untitled'}</p>
      <button onClick={() => project && handleProjectChange({ ...project, modified: true })}>
        Modify Project
      </button>
    </div>
  );
}
