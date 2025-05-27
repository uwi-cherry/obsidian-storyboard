import React, { useEffect, useState, useMemo } from 'react';
import type { App, TFile } from 'obsidian';
import { normalizePath } from 'obsidian';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import type { OtioProject, OtioClip, OtioTrack } from '../../../types/otio';
import type { StoryboardData } from '../../../types/storyboard';
import VideoPreview from './VideoPreview';
import TimelineSeekBar from './TimelineSeekBar';
import DraggableTimelineTrack from './DraggableTimelineTrack';

interface TimelineReactViewProps {
  app: App;
  file: TFile | null;
}



// マークダウン解析関数
function parseMarkdownToStoryboard(markdown: string): StoryboardData {
  const lines = markdown.split('\n');
  const data: StoryboardData = { title: '', chapters: [], characters: [] };
  let currentFrame: any = null;
  let currentChapter: any = null;
  let inCharacterSection = false;
  let inChapterSection = false;

  function initializeNewFrame() {
    return {
      dialogues: '',
      speaker: '',
      imageUrl: undefined,
      imagePrompt: undefined,
      prompt: undefined,
      endTime: undefined,
      startTime: undefined,
      duration: undefined,
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
function createClip(filePath: string, startTime = 0, duration = 5): OtioClip {
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

// トラック作成ヘルパー関数
function createTrack(name: string): OtioTrack {
  return {
    name,
    kind: "Track",
    children: [],
    source_range: {
      start_time: 0,
      duration: 0
    },
    effects: [],
    markers: [],
    metadata: {}
  };
}

export default function TimelineReactView({ app, file }: TimelineReactViewProps) {
  const [project, setProject] = useState<OtioProject | null>(null);
  const [storyboardData, setStoryboardData] = useState<StoryboardData | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const bgmSegments = useMemo(() => {
    if (!storyboardData) return [] as { bgmPrompt: string; startTime: number; duration: number }[];
    return storyboardData.chapters.map(ch => {
      const start = Math.min(...ch.frames.map(f => f.startTime ?? 0));
      const end = Math.max(...ch.frames.map(f => (f.startTime ?? 0) + (f.duration ?? 0)));
      return { bgmPrompt: ch.bgmPrompt ?? '', startTime: start, duration: end - start };
    });
  }, [storyboardData]);

  useEffect(() => {
    if (!file) return;

    const loadProject = async () => {
      try {
        const result = await toolRegistry.executeTool('load_otio_file', {
          app,
          file
        });
        const projectData = JSON.parse(result);
        
        // デフォルトで5個のトラックを追加
        if (projectData.timeline.tracks.length === 0) {
          for (let i = 1; i < 5 ; i++) {
            projectData.timeline.tracks.push(createTrack(`Track ${i}`));
          }
        }
        
        setProject(projectData);
        
        // ストーリーボードデータを取得（source_markdownから）
        const sourceMarkdown = projectData.timeline.metadata?.source_markdown;
        console.log('Source markdown:', sourceMarkdown);
        if (sourceMarkdown) {
          try {
            const parsedData = parseMarkdownToStoryboard(sourceMarkdown);
            console.log('Parsed storyboard data:', parsedData);
            console.log('Chapters:', parsedData.chapters);
            parsedData.chapters.forEach((chapter, idx) => {
              console.log(`Chapter ${idx}:`, chapter);
              console.log(`Frames:`, chapter.frames);
              chapter.frames.forEach((frame, frameIdx) => {
                console.log(`Frame ${frameIdx}:`, frame);
                console.log(`startTime: ${frame.startTime}, duration: ${frame.duration}`);
              });
            });
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

  const handleProjectChange = async (updated: OtioProject) => {
    if (!file) return;
    try {
      await toolRegistry.executeTool('save_otio_file', {
        app,
        file,
        project: updated
      });
      setProject(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClipChange = (tIdx: number, cIdx: number, field: 'path' | 'start' | 'duration', value: string) => {
    if (!project) return;
    
    // 最新のprojectを使用して更新を行う
    setProject(currentProject => {
      if (!currentProject) return currentProject;
      
      const newProject = JSON.parse(JSON.stringify(currentProject)) as OtioProject;
      const clip = newProject.timeline.tracks[tIdx].children[cIdx] as OtioClip;
      
      if (field === 'path') {
        clip.media_reference.target_url = value;
        clip.media_reference.name = value.split('/').pop() || 'Untitled';
        clip.name = clip.media_reference.name;
      } else if (field === 'start') {
        clip.source_range.start_time = parseFloat(value) || 0;
      } else {
        clip.source_range.duration = parseFloat(value) || 0;
      }
      
      // 非同期でファイル保存を実行（状態更新とは分離）
      handleProjectChange(newProject);
      
      return newProject;
    });
  };

  const importFileToVault = async (file: File): Promise<string> => {
    const vaultFiles = app.vault.getFiles();
    const found = vaultFiles.find(f => f.name === file.name);
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

    const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
    let startTime = Math.max(
      ...newProject.timeline.tracks[tIdx].children.map(c =>
        c.source_range.start_time + c.source_range.duration
      ),
      0
    );

    for (const file of Array.from(files)) {
      const filePath = await importFileToVault(file);
      const newClip = createClip(filePath, startTime, 5);
      newProject.timeline.tracks[tIdx].children.push(newClip);
      startTime += newClip.source_range.duration;
    }

    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleAddTrack = () => {
    if (!project) return;
    
    const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
    const trackNumber = newProject.timeline.tracks.length + 1;
    const newTrack = createTrack(`Track ${trackNumber}`);
    newProject.timeline.tracks.push(newTrack);
    
    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleClipMove = (trackIdx: number, clipIdx: number, newStartTime: number) => {
    if (!project) return;
    
    const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
    const clip = newProject.timeline.tracks[trackIdx].children[clipIdx] as OtioClip;
    clip.source_range.start_time = newStartTime;
    
    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleClipResize = (trackIdx: number, clipIdx: number, newStartTime: number, newDuration: number) => {
    if (!project) return;
    
    setProject(currentProject => {
      if (!currentProject) return currentProject;
      
      const newProject = JSON.parse(JSON.stringify(currentProject)) as OtioProject;
      const clip = newProject.timeline.tracks[trackIdx].children[clipIdx] as OtioClip;
      clip.source_range.start_time = newStartTime;
      clip.source_range.duration = newDuration;
      
      // 非同期でファイル保存を実行
      handleProjectChange(newProject);
      
      return newProject;
    });
  };

  const handleFileDrop = async (trackIdx: number, files: FileList, dropTime: number) => {
    if (!project) return;

    const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
    let startTime = dropTime;

    for (const file of Array.from(files)) {
      const filePath = await importFileToVault(file);
      const duration = 5;
      const newClip = createClip(filePath, startTime, duration);
      newProject.timeline.tracks[trackIdx].children.push(newClip);
      startTime += duration;
    }

    setProject(newProject);
    handleProjectChange(newProject);
  };

  // 総再生時間を計算
  const totalDuration = React.useMemo(() => {
    if (!project || !storyboardData) return 60; // デフォルト60秒
    
    const trackDuration = Math.max(
      ...project.timeline.tracks.flatMap(track =>
        track.children.map((clip: OtioClip) => 
          clip.source_range.start_time + clip.source_range.duration
        )
      ),
      0
    );
    
    const storyboardDuration = Math.max(
      ...storyboardData.chapters.flatMap(chapter =>
        chapter.frames.map(frame => 
          (frame.startTime || 0) + (frame.duration || 0)
        )
      ),
      0
    );
    
    return Math.max(trackDuration, storyboardDuration, 60);
  }, [project, storyboardData]);

  // 画面に収まるようにpixelsPerSecondを動的に計算
  const pixelsPerSecond = React.useMemo(() => {
    return 20; // 固定値
  }, []);

  if (!project) {
    return (
      <div className="timeline-view p-4">
        <h2>Timeline View (OTIO)</h2>
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
        {project.timeline.tracks.map((track, tIdx) => (
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
            name: 'BGM',
            kind: 'Track',
            children: bgmSegments.map(seg => ({
              name: seg.bgmPrompt,
              kind: 'Clip',
              media_reference: {
                name: seg.bgmPrompt,
                target_url: seg.bgmPrompt,
                available_range: { start_time: 0, duration: seg.duration },
                metadata: {}
              },
              source_range: { start_time: seg.startTime, duration: seg.duration },
              effects: [],
              markers: [],
              metadata: {}
            })),
            source_range: { start_time: 0, duration: 0 },
            effects: [],
            markers: [],
            metadata: {}
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
            name: 'ストーリー',
            kind: 'Track',
            children: storyboardData?.chapters.flatMap(chapter => chapter.frames).map(frame => ({
              name: frame.speaker,
              kind: 'Clip',
              media_reference: {
                name: frame.speaker,
                target_url: frame.speaker,
                available_range: { start_time: 0, duration: frame.duration || 0 },
                metadata: {}
              },
              source_range: { start_time: frame.startTime || 0, duration: frame.duration || 0 },
              effects: [],
              markers: [],
              metadata: {}
            })) || [],
            source_range: { start_time: 0, duration: 0 },
            effects: [],
            markers: [],
            metadata: {}
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
}
