export interface OtioTimeRange {
    start_time: number;
    duration: number;
}

export interface OtioRationalTime {
    value: number;
    rate: number;
}

export interface OtioTimeTransform {
    offset: OtioRationalTime;
    scale: number;
}

export interface OtioMediaReference {
    name: string;
    target_url: string;
    available_range: OtioTimeRange;
    metadata: Record<string, any>;
}

export interface OtioExternalReference {
    name: string;
    target_url: string;
    available_range: OtioTimeRange;
    metadata: Record<string, any>;
}

export interface OtioGeneratorReference {
    name: string;
    generator_kind: string;
    available_range: OtioTimeRange;
    metadata: Record<string, any>;
}

export interface OtioMissingReference {
    name: string;
    available_range: OtioTimeRange;
    metadata: Record<string, any>;
}

export interface OtioEffect {
    name: string;
    effect_name: string;
    metadata: Record<string, any>;
}

export interface OtioMarker {
    name: string;
    marked_range: OtioTimeRange;
    color: string;
    metadata: Record<string, any>;
}

export interface OtioClip {
    name: string;
    kind: string;
    media_reference: OtioMediaReference | OtioExternalReference | OtioGeneratorReference | OtioMissingReference;
    source_range: OtioTimeRange;
    effects: OtioEffect[];
    markers: OtioMarker[];
    metadata: Record<string, any>;
}

export interface OtioTransition {
    name: string;
    kind: string;
    in_offset: OtioRationalTime;
    out_offset: OtioRationalTime;
    metadata: Record<string, any>;
}

export interface OtioGap {
    name: string;
    kind: string;
    source_range: OtioTimeRange;
    effects: OtioEffect[];
    markers: OtioMarker[];
    metadata: Record<string, any>;
}

export interface OtioTrack {
    name: string;
    kind: string;
    children: (OtioClip | OtioTransition | OtioGap)[];
    source_range: OtioTimeRange;
    effects: OtioEffect[];
    markers: OtioMarker[];
    metadata: Record<string, any>;
}

export interface OtioStack {
    name: string;
    kind: string;
    children: (OtioTrack | OtioStack)[];
    source_range: OtioTimeRange;
    effects: OtioEffect[];
    markers: OtioMarker[];
    metadata: Record<string, any>;
}

export interface OtioTimeline {
    name: string;
    kind: string;
    tracks: OtioTrack[];
    global_start_time: OtioRationalTime;
    global_end_time: OtioRationalTime;
    metadata: Record<string, any>;
}

export interface OtioPsdReference {
    name: string;
    file_path: string;
    type: string;
}

export interface OtioProjectMetadata {
    fps: number;
    resolution: {
        width: number;
        height: number;
    };
    psd_references?: OtioPsdReference[];
    currentPsdFilePath?: string;
}

export interface OtioProject {
    OTIO_SCHEMA: string;
    schema_version: number;
    name: string;
    timeline: OtioTimeline;
    metadata: OtioProjectMetadata;
}