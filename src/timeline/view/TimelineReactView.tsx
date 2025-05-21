import React, { useEffect, useState } from 'react';
import { OtioProject } from '../timeline-types';
import { createClip } from '../timeline-files';
import { t } from '../../i18n';

interface TimelineReactViewProps {
    project: OtioProject;
    onProjectChange: (project: OtioProject) => void;
}

const PIXELS_PER_SECOND = 20;

const TimelineReactView: React.FC<TimelineReactViewProps> = ({ project, onProjectChange }) => {
    const [data, setData] = useState<OtioProject>(project);

    useEffect(() => setData(project), [project]);

    const handleClipChange = (tIdx: number, cIdx: number, field: 'path' | 'start' | 'duration', value: string) => {
        const newProject = JSON.parse(JSON.stringify(data)) as OtioProject;
        const clip = newProject.timeline.tracks[tIdx].children[cIdx];
        if (field === 'path') {
            clip.media_reference.target_url = value;
        } else if (field === 'start') {
            clip.source_range.start_time = parseFloat(value) || 0;
        } else {
            clip.source_range.duration = parseFloat(value) || 0;
        }
        setData(newProject);
        onProjectChange(newProject);
    };

    const handleAddClip = (tIdx: number) => {
        const newClip = createClip('', 0, 5);
        const newProject = JSON.parse(JSON.stringify(data)) as OtioProject;
        newProject.timeline.tracks[tIdx].children.push(newClip);
        setData(newProject);
        onProjectChange(newProject);
    };

    return (
        <div className="p-4 space-y-6 text-text-normal">
            {data.timeline.tracks.map((track, tIdx) => (
                <div
                    key={tIdx}
                    className="bg-secondary border border-modifier-border rounded p-3 space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{track.name}</div>
                        <button
                            className="px-2 py-1 text-xs bg-accent text-on-accent rounded"
                            onClick={() => handleAddClip(tIdx)}
                        >
                            {t('ADD_CLIP')}
                        </button>
                    </div>
                    <div className="relative h-10 bg-primary border border-modifier-border rounded overflow-hidden">
                        {track.children.map((clip: any, cIdx: number) => (
                            <div
                                key={cIdx}
                                className="absolute top-0 h-full bg-accent text-on-accent text-center text-xs truncate"
                                style={{
                                    left: `${clip.source_range.start_time * PIXELS_PER_SECOND}px`,
                                    width: `${clip.source_range.duration * PIXELS_PER_SECOND}px`
                                }}
                            >
                                {clip.media_reference.target_url.split('/').pop()}
                            </div>
                        ))}
                    </div>
                    <table className="w-full text-xs mt-2">
                        <thead>
                            <tr>
                                <th className="text-left">{t('FILE_SELECT')}</th>
                                <th className="text-left">Start</th>
                                <th className="text-left">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {track.children.map((clip: any, cIdx: number) => (
                                <tr key={cIdx}>
                                    <td>
                                        <input
                                            className="border p-1 w-full"
                                            value={clip.media_reference.target_url}
                                            onChange={e => handleClipChange(tIdx, cIdx, 'path', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="border p-1 w-full"
                                            value={clip.source_range.start_time}
                                            onChange={e => handleClipChange(tIdx, cIdx, 'start', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="border p-1 w-full"
                                            value={clip.source_range.duration}
                                            onChange={e => handleClipChange(tIdx, cIdx, 'duration', e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default TimelineReactView;
