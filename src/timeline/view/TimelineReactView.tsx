import React, { useEffect, useState } from 'react';
import { OtioProject } from '../timeline-types';
import { TimelineController } from '../controller/timeline-controller';
import { t } from '../../i18n';

interface TimelineReactViewProps {
    project: OtioProject;
    onProjectChange: (project: OtioProject) => void;
    controller: TimelineController;
}

const PIXELS_PER_SECOND = 20;

const TimelineReactView: React.FC<TimelineReactViewProps> = ({ project, onProjectChange, controller }) => {
    const [data, setData] = useState<OtioProject>(project);

    useEffect(() => setData(project), [project]);

    const handleClipChange = (
        tIdx: number,
        cIdx: number,
        field: 'path' | 'start' | 'duration',
        value: string
    ) => {
        const newProject = controller.updateClip(data, tIdx, cIdx, field, value);
        setData(newProject);
        onProjectChange(newProject);
    };

    const handleAddClip = (tIdx: number) => {
        const newProject = controller.addClip(data, tIdx);
        setData(newProject);
        onProjectChange(newProject);
    };

    const handleAddTrack = () => {
        const newProject = controller.addTrack(data);
        setData(newProject);
        onProjectChange(newProject);
    };

    return (
        <div className="p-4 space-y-6 text-text-normal">
            <div className="flex justify-end mb-2">
                <button
                    className="px-2 py-1 text-xs bg-accent text-on-accent rounded"
                    onClick={handleAddTrack}
                >
                    {t('ADD_TRACK')}
                </button>
            </div>
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
