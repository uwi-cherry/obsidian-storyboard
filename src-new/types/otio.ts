export interface OtioTimeRange {
  start_time: number;
  duration: number;
}

export interface OtioRationalTime {
  value: number;
  rate: number;
}

export interface OtioMediaReference {
  name: string;
  target_url: string;
  available_range: OtioTimeRange;
  metadata: Record<string, any>;
}

export interface OtioClip {
  name: string;
  kind: string;
  media_reference: OtioMediaReference;
  source_range: OtioTimeRange;
  effects: any[];
  markers: any[];
  metadata: Record<string, any>;
}

export interface OtioTrack {
  name: string;
  kind: string;
  children: OtioClip[];
  source_range: OtioTimeRange;
  effects: any[];
  markers: any[];
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

export interface OtioProjectMetadata {
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  psd_references?: { name: string; file_path: string; type: string }[];
  currentPsdFilePath?: string;
}

export interface OtioProject {
  OTIO_SCHEMA: string;
  schema_version: number;
  name: string;
  timeline: OtioTimeline;
  metadata: OtioProjectMetadata;
}
