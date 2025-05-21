import React, { useState, useEffect } from 'react';
import { TimelineView } from './timeline-obsidian-view';
import { OtioProject, OtioTrack, OtioClip } from '../timeline-types';
import { t } from '../../i18n';

interface Props {
  view: TimelineView;
}

const TimelineReactView: React.FC<Props> = ({ view }) => {
  const [project, setProject] = useState<OtioProject | null>(null);
  useEffect(() => {
    setProject(view.project);
  }, [view.project]);

  const addTrack = () => {
    if (!project) return;
    const newTrack: OtioTrack = {
      name: `Track ${project.timeline.tracks.length + 1}`,
      kind: 'Track',
      children: [],
      source_range: { start_time: 0, duration: 0 },
      effects: [],
      markers: [],
      metadata: {},
    };
    const newProj = {
      ...project,
      timeline: { ...project.timeline, tracks: [...project.timeline.tracks, newTrack] },
    };
    setProject(newProj);
    view.saveProject(newProj);
  };

  const addClip = (trackIndex: number) => {
    if (!project) return;
    const newClip: OtioClip = {
      name: 'New Clip',
      kind: 'Clip',
      media_reference: {
        name: 'media',
        target_url: '',
        available_range: { start_time: 0, duration: 5 },
        metadata: {},
      },
      source_range: { start_time: 0, duration: 5 },
      effects: [],
      markers: [],
      metadata: {},
    };
    const tracks = [...project.timeline.tracks];
    tracks[trackIndex] = {
      ...tracks[trackIndex],
      children: [...tracks[trackIndex].children, newClip],
    };
    const newProj = { ...project, timeline: { ...project.timeline, tracks } };
    setProject(newProj);
    view.saveProject(newProj);
  };

  if (!project) {
    return <div>{t('LOADING')}</div>;
  }

  return (
    <div className="p-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <button className="p-1 bg-accent text-on-accent rounded" onClick={addTrack}>
          Add Track
        </button>
      </div>
      {project.timeline.tracks.map((track, i) => (
        <div key={i} className="border p-1">
          <div className="font-bold">{track.name}</div>
          <button className="text-xs" onClick={() => addClip(i)}>
            + Clip
          </button>
          <ul className="ml-4 list-disc">
            {track.children.map((child, ci) => (
              <li key={ci}>{(child as OtioClip).name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TimelineReactView;
