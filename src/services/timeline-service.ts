import { App, TFile } from 'obsidian';
import {
    createClip,
    createTrack,
    loadOtioFile,
    saveOtioFile,
} from '../timeline/timeline-files';
import { OtioProject } from '../timeline/timeline-types';

export interface ITimelineService {
    load(app: App, file: TFile): Promise<OtioProject>;
    save(app: App, file: TFile, project: OtioProject): Promise<void>;
    addTrack(project: OtioProject, name?: string): OtioProject;
    addClip(
        project: OtioProject,
        trackIndex: number,
        filePath?: string,
        start?: number,
        duration?: number
    ): OtioProject;
    updateClip(
        project: OtioProject,
        trackIndex: number,
        clipIndex: number,
        field: 'path' | 'start' | 'duration',
        value: string
    ): OtioProject;
}

export class TimelineService implements ITimelineService {
    async load(app: App, file: TFile): Promise<OtioProject> {
        return loadOtioFile(app, file);
    }

    async save(app: App, file: TFile, project: OtioProject): Promise<void> {
        return saveOtioFile(app, file, project);
    }

    addTrack(project: OtioProject, name?: string): OtioProject {
        const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
        const trackNumber = newProject.timeline.tracks.length + 1;
        const track = createTrack(name ?? `Track ${trackNumber}`);
        newProject.timeline.tracks.push(track);
        return newProject;
    }

    addClip(
        project: OtioProject,
        trackIndex: number,
        filePath = '',
        start = 0,
        duration = 5
    ): OtioProject {
        const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
        const clip = createClip(filePath, start, duration);
        newProject.timeline.tracks[trackIndex].children.push(clip);
        return newProject;
    }

    updateClip(
        project: OtioProject,
        trackIndex: number,
        clipIndex: number,
        field: 'path' | 'start' | 'duration',
        value: string
    ): OtioProject {
        const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
        const clip: any = newProject.timeline.tracks[trackIndex].children[clipIndex];
        if (field === 'path') {
            clip.media_reference.target_url = value;
        } else if (field === 'start') {
            clip.source_range.start_time = parseFloat(value) || 0;
        } else {
            clip.source_range.duration = parseFloat(value) || 0;
        }
        return newProject;
    }
}
