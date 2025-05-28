/**
 * USD (Universal Scene Description) Type Definitions
 * Based on Pixar's USD specification
 */

export interface UsdTimeCode {
  value: number;
  rate: number; // timeCodesPerSecond
}

export interface UsdTimeRange {
  startTimeCode: UsdTimeCode;
  endTimeCode: UsdTimeCode;
}

// USD Asset Path Reference
export interface UsdAssetPath {
  path: string; // @asset_path@
  resolvedPath?: string;
}

// USD Prim (基本ノード)
export interface UsdPrim {
  path: string; // USD path like "/Root/Child"
  typeName?: string; // Schema type (Xform, Mesh, etc.)
  specifier: 'def' | 'over' | 'class'; // USD specifier
  attributes: Record<string, UsdAttribute>;
  relationships: Record<string, UsdRelationship>;
  children: UsdPrim[];
  metadata: Record<string, any>;
  variants?: UsdVariantSet[];
}

// USD Attribute
export interface UsdAttribute {
  typeName: string; // float, double, string, asset, etc.
  value?: any;
  timeSamples?: Record<number, any>; // time -> value mapping
  interpolation?: string;
  connections?: string[]; // connection targets
}

// USD Relationship  
export interface UsdRelationship {
  targets: string[]; // USD paths
}

// USD Variant
export interface UsdVariantSet {
  name: string;
  variants: Record<string, UsdPrim[]>; // variant name -> prims
  selection?: string; // currently selected variant
}

// USD Layer Metadata
export interface UsdLayerMetadata {
  defaultPrim?: string;
  upAxis?: 'Y' | 'Z';
  metersPerUnit?: number;
  timeCodesPerSecond?: number;
  startTimeCode?: number;
  endTimeCode?: number;
  subLayers?: string[];
  comment?: string;
}

// USD Stage (root container)
export interface UsdStage {
  rootPrim: UsdPrim;
  layerMetadata: UsdLayerMetadata;
  timeCodesPerSecond: number;
  startTimeCode: number;
  endTimeCode: number;
}

// Our application-specific wrapper
export interface UsdProject {
  schemaIdentifier: string; // "usd" 
  schemaVersion: string; // "1.0"
  name: string;
  stage: UsdStage;
  
  // Application-specific metadata (not part of USD spec)
  applicationMetadata: {
    version: string;
    creator: string;
    resolution?: {
      width: number;
      height: number;
    };
    currentPsdFilePath?: string;
    sourceMarkdown?: string; // for storyboard conversion
  };
}

// Simplified project structure for timeline UI compatibility
export interface TimelineProject {
  schemaIdentifier: string; // "usd" 
  schemaVersion: string; // "1.0"
  name: string;
  stage: {
    tracks: SimpleTrack[];
    timeCodesPerSecond: number;
    startTimeCode: number;
    endTimeCode: number;
  };
  
  applicationMetadata: {
    version: string;
    creator: string;
    resolution?: {
      width: number;
      height: number;
    };
    currentPsdFilePath?: string;
    sourceMarkdown?: string;
  };
}

// Convenience interfaces for timeline/media usage
export interface MediaClipPrim extends UsdPrim {
  typeName: 'MediaClip'; // Custom schema type
  attributes: {
    assetPath: UsdAttribute; // asset type
    startTime: UsdAttribute; // double type  
    duration: UsdAttribute; // double type
    clipName: UsdAttribute; // string type
    [key: string]: UsdAttribute;
  };
}

export interface TrackPrim extends UsdPrim {
  typeName: 'Track'; // Custom schema type
  children: MediaClipPrim[];
  attributes: {
    trackName: UsdAttribute; // string type
    trackType: UsdAttribute; // token type (video, audio, etc.)
    [key: string]: UsdAttribute;
  };
}

// Helper types for easier usage
export interface SimpleMediaClip {
  path: string; // USD path
  name: string;
  assetPath: string;
  startTime: number;
  duration: number;
  clipType?: string; // video, audio, image
}

export interface SimpleTrack {
  path: string; // USD path  
  name: string;
  trackType: string;
  clips: SimpleMediaClip[];
}

// Aliases for compatibility
export type UsdClip = SimpleMediaClip;
export type UsdTrack = SimpleTrack;

// Legacy format for backward compatibility
export interface LegacyUsdProject {
  USD_SCHEMA: string;
  schema_version: number;
  name: string;
  stage: {
    name: string;
    type: string;
    tracks: any[];
    global_start_time: { value: number; rate: number };
    global_end_time: { value: number; rate: number };
    metadata: Record<string, any>;
  };
  metadata: {
    timeCodesPerSecond: number;
    resolution: { width: number; height: number };
    upAxis: string;
    metersPerUnit: number;
  };
}

// Union type for all USD project formats
export type AnyUsdProject = UsdProject | LegacyUsdProject | TimelineProject;