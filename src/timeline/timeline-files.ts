import { App, normalizePath, TFile, Notice } from 'obsidian';
import {
    OtioProject,
    OtioTimeline,
    OtioTrack,
    OtioClip,
    OtioMediaReference,
    OtioExternalReference,
    OtioGeneratorReference,
    OtioMissingReference,
    OtioTimeRange,
    OtioRationalTime,
    OtioGap // Import OtioGap
} from './timeline-types';
export const OTIO_EXTENSION = 'otio';
export type {
    OtioProject,
    OtioTimeline,
    OtioTrack,
    OtioClip,
    OtioMediaReference,
    OtioExternalReference,
    OtioGeneratorReference,
    OtioMissingReference,
    OtioTimeRange,
    OtioRationalTime
};
export async function createEmptyProject(): Promise<OtioProject> {
    return {
        OTIO_SCHEMA: "Timeline.1",
        schema_version: 1,
        name: "New Project",
        timeline: {
            name: "Main Timeline",
            kind: "Timeline",
            tracks: [
                {
                    name: "Track 1",
                    kind: "Track",
                    children: [],
                    source_range: {
                        start_time: 0,
                        duration: 0
                    },
                    effects: [],
                    markers: [],
                    metadata: {}
                }
            ],
            global_start_time: { value: 0, rate: 30 },
            global_end_time: { value: 0, rate: 30 },
            metadata: {}
        },
        metadata: {
            fps: 30,
            resolution: {
                width: 1920,
                height: 1080
            },
            psd_references: []
        }
    };
}
export async function createOtioFile(app: App, filename: string): Promise<TFile> {
    if (!filename.endsWith('.otio')) {
        filename += '.otio';
    }
    const baseFileName = filename.replace('.otio', '');
    let fileNumber = 1;
    let fullPath = normalizePath(`${baseFileName}.otio`);
    while (app.vault.getAbstractFileByPath(fullPath)) {
        fullPath = normalizePath(`${baseFileName} ${fileNumber}.otio`);
        fileNumber++;
    }
    const emptyProject = await createEmptyProject();
    const content = JSON.stringify(emptyProject, null, 2);
    try {
        const newFile = await app.vault.create(fullPath, content);
        return newFile;
    } catch (error) {
        throw error;
    }
}
export async function loadOtioFile(app: App, file: TFile): Promise<OtioProject> {
    try {
        const content = await app.vault.read(file);
        if (!content.trim()) {
            const emptyProject = await createEmptyProject();
            await saveOtioFile(app, file, emptyProject);
            return emptyProject;
        }
        const project = JSON.parse(content);
        if (!project.metadata) {
            const emptyProject = await createEmptyProject();
            project.metadata = emptyProject.metadata;
        }
        if (project.metadata.psd_references === undefined) {
            project.metadata.psd_references = [];
        }
        return project;
    } catch (error) {
        throw error;
    }
}
export async function updateOtioPsdReference(app: App, otioFile: TFile, project: OtioProject, oldPath: string, newFile: TFile): Promise<void> {
    if (!project.metadata?.psd_references) {
        return;
    }
    const originalReferences = JSON.parse(JSON.stringify(project.metadata.psd_references));
    let referenceFound = false;
    project.metadata.psd_references = project.metadata.psd_references.map(ref => {
        if (ref.file_path === oldPath) {
            referenceFound = true;
            return { ...ref, file_path: newFile.path, name: newFile.name };
        }
        return ref;
    });
    if (!referenceFound) {
        return;
    }
    try {
        await saveOtioFile(app, otioFile, project);
    } catch (error) {
        project.metadata.psd_references = originalReferences;
        new Notice(`OTIO参照の更新後の保存に失敗しました: ${error.message}`);
        throw error;
    }
}
export async function saveOtioFile(app: App, file: TFile, project: OtioProject): Promise<void> {
    try {
        const projectToSave = JSON.parse(JSON.stringify(project));
        if (!projectToSave.metadata) {
            const emptyProject = await createEmptyProject();
            projectToSave.metadata = emptyProject.metadata;
        }
        if (projectToSave.metadata.psd_references === undefined) {
            projectToSave.metadata.psd_references = [];
        }
        const savedContent = JSON.stringify(projectToSave, null, 2);
        await app.vault.modify(file, savedContent);
        const verifyContent = await app.vault.read(file);
        const verifyProject = JSON.parse(verifyContent);
        if (JSON.stringify(verifyProject) !== JSON.stringify(projectToSave)) {
            throw new Error('保存内容の検証に失敗しました');
        }
    } catch (error) {
        throw error;
    }
}
export function createClip(filePath: string, startTime: number = 0, duration: number = 5): OtioClip {
    return {
        name: filePath.split('/').pop() || 'Untitled',
        kind: "Clip",
        media_reference: {
            name: filePath.split('/').pop() || 'Untitled',
            target_url: filePath,
            available_range: {
                start_time: 0,
                duration: duration
            },
            metadata: {}
        },
        source_range: {
            start_time: startTime,
            duration: duration
        },
        effects: [],
        markers: [],
        metadata: {}
    };
}
export function formatTimecode(seconds: number, fps: number = 30): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}
export function parseTimecode(timecode: string, fps: number = 30): number {
    const [h, m, s, f] = timecode.split(':').map(Number);
    return h * 3600 + m * 60 + s + f / fps;
}
export function framesToSeconds(frames: number, fps: number = 30): number {
    return frames / fps;
}
export function secondsToFrames(seconds: number, fps: number = 30): number {
    return Math.round(seconds * fps);
}

// Helper function to convert OtioRationalTime or number to seconds
export function rationalTimeToSeconds(time: OtioRationalTime | number | undefined): number {
    if (typeof time === 'number') {
        return time;
    }
    if (time && typeof time === 'object' && typeof time.value === 'number' && typeof time.rate === 'number' && time.rate !== 0) {
        return time.value / time.rate;
    }
    return 0;
}

// Helper function to get the end time of the last item in a track
export function getTrackEndTime(track: OtioTrack): number {
    let endTime = 0;
    track.children.forEach((item: OtioClip | OtioGap | any) => { // Use OtioGap type
        if (item.source_range) {
            // Use rationalTimeToSeconds for both start_time and duration
            const itemStartTime = rationalTimeToSeconds(item.source_range.start_time);
            const itemDuration = rationalTimeToSeconds(item.source_range.duration);
            endTime = Math.max(endTime, itemStartTime + itemDuration);
        }
    });
    return endTime;
}