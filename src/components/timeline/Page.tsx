import { useEffect, useState, useMemo, useRef } from 'react';
import type { FC } from 'react';
import type { App, TFile } from 'obsidian';
import { normalizePath } from 'obsidian';
import { toolRegistry } from '../../service/core/tool-registry';
import type { TimelineProject, UsdClip, UsdTrack } from '../../types/usd';
import { UsdGenerator } from '../../service/api/usd-tool/usd-generator';
import type { StoryboardData, StoryboardChapter, StoryboardFrame } from '../../types/storyboard';
import VideoPreview from './VideoPreview';
import TimelineSeekBar from './TimelineSeekBar';
import DraggableTimelineTrack from './DraggableTimelineTrack';

interface TimelineReactViewProps {
  app: App;
  file: TFile | null;
}



// USDAファイルからマークダウンコンテンツを抽出
function extractMarkdownFromUsda(usdaContent: string): string | undefined {
  const customLayerDataMatch = usdaContent.match(/customLayerData\s*=\s*\{([\s\S]*?)\}/);
  if (!customLayerDataMatch) return undefined;
  
  const customLayerData = customLayerDataMatch[1];
  const originalContentMatch = customLayerData.match(/string\s+originalContent\s*=\s*"((?:[^"\\]|\\.)*)"/);
  if (!originalContentMatch) return undefined;
  
  // エスケープを元に戻す
  return originalContentMatch[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// マークダウン解析関数
function parseMarkdownToStoryboard(markdown: string): StoryboardData {
  const lines = markdown.split('\n');
  const data: StoryboardData = { title: '', chapters: [], characters: [] };
  let currentFrame: any = null;
  let currentChapter: any = null;
  let inCharacterSection = false;
  let inChapterSection = false;
  let inCodeBlock = false;

  function initializeNewFrame() {
    return {
      dialogues: '',
      speaker: '',
      imageUrl: undefined,
      imagePrompt: undefined,
      prompt: undefined,
      endTime: 0,
      startTime: 0,
      duration: 5,
    };
  }

  function saveCurrentFrameIfValid() {
    if (currentFrame && currentChapter) {
      currentChapter.frames.push(currentFrame);
    }
    currentFrame = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    
    // コードブロックの開始・終了を検出
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // コードブロック内の行は無視
    if (inCodeBlock) {
      continue;
    }
    
    if (line.startsWith('### キャラクター')) {
      inCharacterSection = true;
      inChapterSection = false;
      continue;
    }
    
    if (line.startsWith('### ')) {
      const bgmPrompt = line.replace(/^###\s*/, '');
      if (currentChapter) {
        saveCurrentFrameIfValid();
        data.chapters.push(currentChapter);
      }
      currentChapter = { bgmPrompt, frames: [] };
      inCharacterSection = false;
      inChapterSection = true;
      continue;
    }
    
    if (inChapterSection) {
      if (line.startsWith('####')) {
        saveCurrentFrameIfValid();
        currentFrame = initializeNewFrame();
        currentFrame.speaker = line.replace(/^####\s*/, '');
      } else if (currentFrame) {
        const calloutInfoMatch = line.match(/^>\s*\[!INFO\]\s*(.*)$/);
        const imageMatch = line.match(/^\[(.*)\]\((.*)\)$/);
        
        if (calloutInfoMatch) {
          const infoContent = calloutInfoMatch[1].trim();
          const timingMatch = infoContent.match(/start:\s*(\d+(?:\.\d+)?),\s*duration:\s*(\d+(?:\.\d+)?)/);
          if (timingMatch) {
            currentFrame.startTime = parseFloat(timingMatch[1]);
            currentFrame.duration = parseFloat(timingMatch[2]);
          }
          
          const promptLines: string[] = [];
          while (i + 1 < lines.length && lines[i + 1].trimStart().startsWith('>')) {
            const raw = lines[i + 1].replace(/^>\s*/, '').trim();
            if (raw) promptLines.push(raw);
            i++;
          }
          if (promptLines.length > 0) {
            currentFrame.prompt = promptLines.join('\n');
          }
        } else if (imageMatch) {
          currentFrame.imagePrompt = imageMatch[1];
          currentFrame.imageUrl = imageMatch[2];
        } else if (line.trim() && !line.startsWith('>')) {
          currentFrame.dialogues += (currentFrame.dialogues ? '\n' : '') + line;
        }
      }
    }
  }
  
  saveCurrentFrameIfValid();
  if (currentChapter) {
    data.chapters.push(currentChapter);
  }
  
  return data;
}

// クリップ作成ヘルパー関数
function createClip(filePath: string, startTime = 0, duration = 5): UsdClip {
  return {
    path: `/Clips/clip_${Date.now()}`,
    name: filePath.split('/').pop() || 'Untitled',
    assetPath: filePath,
    startTime: startTime,
    duration: duration,
    clipType: 'video'
  };
}

// トラック作成ヘルパー関数
function createTrack(name: string): UsdTrack {
  return {
    path: `/Tracks/${name.replace(/\s+/g, '_')}`,
    name,
    trackType: 'video',
    clips: []
  };
}

const TimelineReactView: FC<TimelineReactViewProps> = ({ app, file }) => {
  const [project, setProject] = useState<TimelineProject | null>(null);
  const [storyboardData, setStoryboardData] = useState<StoryboardData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bgmSegments = useMemo(() => {
    if (!storyboardData) return [] as { bgmPrompt: string; startTime: number; duration: number }[];
    return storyboardData.chapters.map((ch: StoryboardChapter) => {
      const start = Math.min(...ch.frames.map((f: StoryboardFrame) => f.startTime ?? 0));
      const end = Math.max(...ch.frames.map((f: StoryboardFrame) => (f.startTime ?? 0) + (f.duration ?? 0)));
      return { bgmPrompt: ch.bgmPrompt ?? '', startTime: start, duration: end - start };
    });
  }, [storyboardData]);

  useEffect(() => {
    if (!file) return;

    const loadProject = async () => {
      try {
        const result = await toolRegistry.executeTool('load_usd_file', {
          app,
          file
        });
        
        // USDAコンテンツからプロジェクトデータを作成
        const projectData: TimelineProject = {
          schemaIdentifier: 'usd',
          schemaVersion: '1.0',
          name: file.basename,
          stage: {
            tracks: [],
            timeCodesPerSecond: 30,
            startTimeCode: 0,
            endTimeCode: 1000
          },
          applicationMetadata: {
            version: '1.0',
            creator: 'Obsidian Storyboard',
            sourceMarkdown: extractMarkdownFromUsda(result)
          }
        };
        
        // デフォルトで5個のトラックを追加
        if (projectData.stage.tracks.length === 0) {
          for (let i = 1; i < 5 ; i++) {
            projectData.stage.tracks.push(createTrack(`Track ${i}`));
          }
        }
        
        setProject(projectData);
        
        // ストーリーボードデータを取得（applicationMetadataから）
        const sourceMarkdown = projectData.applicationMetadata.sourceMarkdown;
        if (sourceMarkdown) {
          try {
            const parsedData = parseMarkdownToStoryboard(sourceMarkdown);
            setStoryboardData(parsedData);
          } catch (error) {
            console.error('Failed to parse storyboard data:', error);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadProject();
  }, [app, file]);

  const handleProjectChange = async (updated: TimelineProject) => {
    if (!file) return;
    try {
      const usdaContent = UsdGenerator.generateUsdaContent(updated);
      await toolRegistry.executeTool('save_usd_file', {
        app,
        file,
        content: usdaContent
      });
      setProject(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClipChange = (tIdx: number, cIdx: number, field: 'path' | 'start' | 'duration', value: string) => {
    if (!project) return;
    
    // 最新のprojectを使用して更新を行う
    setProject((currentProject: TimelineProject | null) => {
      if (!currentProject) return currentProject;
      
      const newProject = JSON.parse(JSON.stringify(currentProject)) as TimelineProject;
      const clip = newProject.stage.tracks[tIdx].clips[cIdx] as UsdClip;
      
      if (field === 'path') {
        clip.assetPath = value;
        clip.name = value.split('/').pop() || 'Untitled';
      } else if (field === 'start') {
        clip.startTime = parseFloat(value) || 0;
      } else {
        clip.duration = parseFloat(value) || 0;
      }
      
      // 非同期でファイル保存を実行（状態更新とは分離）
      handleProjectChange(newProject);
      
      return newProject;
    });
  };

  const importFileToVault = async (file: File): Promise<string> => {
    const vaultFiles = app.vault.getFiles();
    const found = vaultFiles.find((f: TFile) => f.name === file.name);
    if (found) {
      return found.path;
    }

    const arrayBuffer = await file.arrayBuffer();
    const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
    const assetsDir = activeDir ? normalizePath(`${activeDir}/assets`) : 'assets';
    try {
      if (!app.vault.getAbstractFileByPath(assetsDir)) {
        await app.vault.createFolder(assetsDir);
      }
    } catch {
      /* ignore */
    }
    const path = normalizePath(`${assetsDir}/${file.name}`);
    const newFile = await app.vault.createBinary(path, arrayBuffer);
    return newFile.path;
  };

  const handleAddClip = async (tIdx: number, files: FileList) => {
    if (!project) return;

    const newProject = JSON.parse(JSON.stringify(project)) as TimelineProject;
    let startTime = Math.max(
      ...newProject.stage.tracks[tIdx].clips.map((c: UsdClip) =>
        c.startTime + c.duration
      ),
      0
    );

    for (const file of Array.from(files)) {
      const filePath = await importFileToVault(file);
      const newClip = createClip(filePath, startTime, 5);
      newProject.stage.tracks[tIdx].clips.push(newClip);
      startTime += newClip.duration;
    }

    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleAddTrack = () => {
    if (!project) return;
    
    const newProject = JSON.parse(JSON.stringify(project)) as TimelineProject;
    const trackNumber = newProject.stage.tracks.length + 1;
    const newTrack = createTrack(`Track ${trackNumber}`);
    newProject.stage.tracks.push(newTrack);
    
    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleClipMove = (trackIdx: number, clipIdx: number, newStartTime: number) => {
    if (!project) return;
    
    const newProject = JSON.parse(JSON.stringify(project)) as TimelineProject;
    const clip = newProject.stage.tracks[trackIdx].clips[clipIdx] as UsdClip;
    clip.startTime = newStartTime;
    
    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleClipResize = (trackIdx: number, clipIdx: number, newStartTime: number, newDuration: number) => {
    if (!project) return;
    
    setProject((currentProject: TimelineProject | null) => {
      if (!currentProject) return currentProject;
      
      const newProject = JSON.parse(JSON.stringify(currentProject)) as TimelineProject;
      const clip = newProject.stage.tracks[trackIdx].clips[clipIdx] as UsdClip;
      clip.startTime = newStartTime;
      clip.duration = newDuration;
      
      // 非同期でファイル保存を実行
      handleProjectChange(newProject);
      
      return newProject;
    });
  };

  const handleFileDrop = async (trackIdx: number, files: FileList, dropTime: number) => {
    if (!project) return;

    const newProject = JSON.parse(JSON.stringify(project)) as TimelineProject;
    let startTime = dropTime;

    for (const file of Array.from(files)) {
      const filePath = await importFileToVault(file);
      const duration = 5;
      const newClip = createClip(filePath, startTime, duration);
      newProject.stage.tracks[trackIdx].clips.push(newClip);
      startTime += duration;
    }

    setProject(newProject);
    handleProjectChange(newProject);
  };

  // 総再生時間を計算
  const totalDuration = useMemo(() => {
    if (!project || !storyboardData) return 60; // デフォルト60秒
    
    const trackDuration = Math.max(
      ...project.stage.tracks.flatMap((track: UsdTrack) =>
        track.clips.map((clip: UsdClip) =>
          clip.startTime + clip.duration
        )
      ),
      0
    );
    
    const storyboardDuration = Math.max(
      ...storyboardData.chapters.flatMap((chapter: StoryboardChapter) =>
        chapter.frames.map((frame: StoryboardFrame) =>
          (frame.startTime || 0) + (frame.duration || 0)
        )
      ),
      0
    );
    
    return Math.max(trackDuration, storyboardDuration, 60);
  }, [project, storyboardData]);

  // 画面に収まるようにpixelsPerSecondを動的に計算
  const pixelsPerSecond = useMemo(() => {
    return 20; // 固定値
  }, []);

  if (!project) {
    return (
      <div className="timeline-view p-4">
        <h2>Timeline View (USD)</h2>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      <div className="flex-shrink-0">
        <VideoPreview 
          project={project}
          storyboardData={storyboardData}
          currentTime={currentTime}
          onTimeUpdate={setCurrentTime}
        />
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
        {project.stage.tracks.map((track: UsdTrack, tIdx: number) => (
          <DraggableTimelineTrack
            key={tIdx}
            track={track}
            trackIndex={tIdx}
            currentTime={currentTime}
            pixelsPerSecond={pixelsPerSecond}
            onClipChange={handleClipChange}
            onClipMove={handleClipMove}
            onClipResize={handleClipResize}
            onAddClip={handleAddClip}
            onTimeSeek={setCurrentTime}
            onFileDrop={handleFileDrop}
          />
        ))}
        
        <div className="flex-shrink-0 p-2">
          <button onClick={handleAddTrack} className="px-3 py-1 text-sm bg-accent text-on-accent rounded hover:bg-accent-hover">
            トラックを追加
          </button>
        </div>
      </div>
      
      <div className="flex-shrink-0 overflow-x-auto">
        <DraggableTimelineTrack
          track={{
            path: '/BGM',
            name: 'BGM',
            trackType: 'audio',
            clips: bgmSegments.map((seg: { bgmPrompt: string; startTime: number; duration: number }) => ({
              path: `/BGM/clip_${seg.startTime}`,
              name: seg.bgmPrompt,
              assetPath: seg.bgmPrompt,
              startTime: seg.startTime,
              duration: seg.duration,
              clipType: 'audio'
            }))
          }}
          trackIndex={-1}
          currentTime={currentTime}
          pixelsPerSecond={pixelsPerSecond}
          onClipChange={() => {}}
          onClipMove={() => {}}
          onClipResize={() => {}}
          onAddClip={(_, __) => {}}
          onTimeSeek={setCurrentTime}
        />
        
        <DraggableTimelineTrack
          track={{
            path: '/Story',
            name: 'ストーリー',
            trackType: 'video',
            clips: storyboardData?.chapters.flatMap((chapter: StoryboardChapter) => chapter.frames).map((frame: StoryboardFrame) => ({
              path: `/Story/clip_${frame.startTime || 0}`,
              name: frame.speaker,
              assetPath: frame.speaker,
              startTime: frame.startTime || 0,
              duration: frame.duration || 0,
              clipType: 'video'
            })) || []
          }}
          trackIndex={-2}
          currentTime={currentTime}
          pixelsPerSecond={pixelsPerSecond}
          onClipChange={() => {}}
          onClipMove={() => {}}
          onClipResize={() => {}}
          onAddClip={(_, __) => {}}
          onTimeSeek={setCurrentTime}
        />
      </div>
    </div>
  );
};

export default TimelineReactView;
