import type { 
  UsdProject, 
  UsdStage, 
  UsdPrim, 
  UsdAttribute, 
  SimpleMediaClip, 
  SimpleTrack,
  MediaClipPrim,
  TrackPrim 
} from '../../../types/usd';

/**
 * USD Data Conversion Utilities
 * Converts between simplified timeline data and proper USD structure
 */
export class UsdConverter {
  
  /**
   * Create a simple USD project for timeline usage
   */
  static createSimpleProject(name: string = 'Timeline Project'): UsdProject {
    return {
      schemaIdentifier: 'usd',
      schemaVersion: '1.0',
      name,
      stage: {
        rootPrim: {
          path: '/Root',
          typeName: 'Xform',
          specifier: 'def',
          attributes: {},
          relationships: {},
          children: [],
          metadata: {}
        },
        layerMetadata: {
          defaultPrim: 'Root',
          upAxis: 'Y',
          metersPerUnit: 1.0,
          timeCodesPerSecond: 30,
          startTimeCode: 0,
          endTimeCode: 1000
        },
        timeCodesPerSecond: 30,
        startTimeCode: 0,
        endTimeCode: 1000
      },
      applicationMetadata: {
        version: '1.0',
        creator: 'Obsidian Storyboard',
        resolution: { width: 1920, height: 1080 }
      }
    };
  }

  /**
   * Create a simple media clip
   */
  static createSimpleClip(
    name: string, 
    assetPath: string, 
    startTime: number = 0, 
    duration: number = 5,
    trackPath: string = '/Root/Track1'
  ): SimpleMediaClip {
    return {
      path: `${trackPath}/${name}`,
      name,
      assetPath,
      startTime,
      duration,
      clipType: this.inferClipType(assetPath)
    };
  }

  /**
   * Create a simple track
   */
  static createSimpleTrack(
    name: string, 
    trackType: string = 'video',
    index: number = 1
  ): SimpleTrack {
    return {
      path: `/Root/${name}`,
      name,
      trackType,
      clips: []
    };
  }

  /**
   * Convert simple clip to USD MediaClipPrim
   */
  static simpleClipToPrim(clip: SimpleMediaClip): MediaClipPrim {
    return {
      path: clip.path,
      typeName: 'MediaClip',
      specifier: 'def',
      attributes: {
        assetPath: {
          typeName: 'asset',
          value: `@${clip.assetPath}@`
        },
        startTime: {
          typeName: 'double',
          value: clip.startTime
        },
        duration: {
          typeName: 'double', 
          value: clip.duration
        },
        clipName: {
          typeName: 'string',
          value: clip.name
        }
      },
      relationships: {},
      children: [],
      metadata: {
        clipType: clip.clipType || 'unknown'
      }
    };
  }

  /**
   * Convert simple track to USD TrackPrim
   */
  static simpleTrackToPrim(track: SimpleTrack): TrackPrim {
    return {
      path: track.path,
      typeName: 'Track',
      specifier: 'def',
      attributes: {
        trackName: {
          typeName: 'string',
          value: track.name
        },
        trackType: {
          typeName: 'token',
          value: track.trackType
        }
      },
      relationships: {},
      children: track.clips.map(clip => this.simpleClipToPrim(clip)),
      metadata: {}
    };
  }

  /**
   * Convert USD MediaClipPrim to simple clip
   */
  static primToSimpleClip(prim: MediaClipPrim): SimpleMediaClip {
    return {
      path: prim.path,
      name: prim.attributes.clipName?.value || 'Untitled',
      assetPath: this.extractAssetPath(prim.attributes.assetPath?.value || ''),
      startTime: prim.attributes.startTime?.value || 0,
      duration: prim.attributes.duration?.value || 5,
      clipType: prim.metadata?.clipType || 'unknown'
    };
  }

  /**
   * Convert USD TrackPrim to simple track
   */
  static primToSimpleTrack(prim: TrackPrim): SimpleTrack {
    return {
      path: prim.path,
      name: prim.attributes.trackName?.value || 'Untitled',
      trackType: prim.attributes.trackType?.value || 'video',
      clips: prim.children.map(child => this.primToSimpleClip(child))
    };
  }

  /**
   * Extract asset path from USD asset reference (@path@)
   */
  private static extractAssetPath(assetRef: string): string {
    if (assetRef.startsWith('@') && assetRef.endsWith('@')) {
      return assetRef.slice(1, -1);
    }
    return assetRef;
  }

  /**
   * Infer clip type from file extension
   */
  private static inferClipType(assetPath: string): string {
    const ext = assetPath.split('.').pop()?.toLowerCase();
    if (!ext) return 'unknown';
    
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'audio';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    
    return 'unknown';
  }

  /**
   * Add track to USD project
   */
  static addTrackToProject(project: UsdProject, track: SimpleTrack): UsdProject {
    const newProject = JSON.parse(JSON.stringify(project));
    const trackPrim = this.simpleTrackToPrim(track);
    newProject.stage.rootPrim.children.push(trackPrim);
    return newProject;
  }

  /**
   * Add clip to track in USD project
   */
  static addClipToTrack(project: UsdProject, trackPath: string, clip: SimpleMediaClip): UsdProject {
    const newProject = JSON.parse(JSON.stringify(project));
    const trackPrim = this.findPrimByPath(newProject.stage.rootPrim, trackPath) as TrackPrim;
    
    if (trackPrim && trackPrim.typeName === 'Track') {
      const clipPrim = this.simpleClipToPrim(clip);
      trackPrim.children.push(clipPrim);
    }
    
    return newProject;
  }

  /**
   * Find USD prim by path
   */
  private static findPrimByPath(root: UsdPrim, path: string): UsdPrim | null {
    if (root.path === path) return root;
    
    for (const child of root.children) {
      const found = this.findPrimByPath(child, path);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Get all tracks from USD project as simple tracks
   */
  static getTracksFromProject(project: UsdProject): SimpleTrack[] {
    return project.stage.rootPrim.children
      .filter(child => child.typeName === 'Track')
      .map(child => this.primToSimpleTrack(child as TrackPrim));
  }
}