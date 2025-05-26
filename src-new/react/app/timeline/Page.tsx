import React, { useEffect, useState, useMemo } from 'react';
import type { App, TFile } from 'obsidian';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import type { OtioProject, OtioClip, OtioTrack } from '../../../types/otio';
import type { StoryboardData } from '../../../types/storyboard';

interface TimelineReactViewProps {
  app: App;
  file: TFile | null;
}

const PIXELS_PER_SECOND = 20;

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
    
    const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
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
    
    setProject(newProject);
    handleProjectChange(newProject);
  };

  const handleAddClip = (tIdx: number) => {
    if (!project) return;
    
    const newClip = createClip('', 0, 5);
    const newProject = JSON.parse(JSON.stringify(project)) as OtioProject;
    newProject.timeline.tracks[tIdx].children.push(newClip);
    
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

  if (!project) {
    return (
      <div className="timeline-view p-4">
        <h2>Timeline View (OTIO)</h2>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="timeline-view p-4 space-y-6 text-text-normal">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Timeline View (OTIO)</h2>
        <div className="text-sm text-text-muted">
          Project: {project.name}
        </div>
      </div>
      
      <div className="flex justify-end mb-2">
        <button
          className="px-3 py-1 text-sm bg-accent text-on-accent rounded hover:bg-accent-hover"
          onClick={handleAddTrack}
        >
          トラックを追加
        </button>
      </div>
      
        {/* BGMトラック */}
        <div className="bg-secondary border border-modifier-border rounded p-3 space-y-2">
          <div className="font-semibold text-sm text-green-400">BGM</div>
          <div className="relative h-6 bg-primary border border-modifier-border rounded overflow-hidden">
            {bgmSegments.length > 0 ? (
              bgmSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 h-full bg-green-600 text-white text-center text-xs truncate flex items-center justify-center border-r border-green-400"
                  style={{
                    left: `${seg.startTime * PIXELS_PER_SECOND}px`,
                    width: `${seg.duration * PIXELS_PER_SECOND}px`
                  }}
                  title={seg.bgmPrompt}
                >
                  {seg.bgmPrompt}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-muted">
                BGMデータなし
              </div>
            )}
          </div>
        </div>

        {/* ストーリーボードトラック */}
        <div className="bg-secondary border border-modifier-border rounded p-3 space-y-2">
          <div className="font-semibold text-sm text-purple-400">ストーリーボード</div>
          <div className="relative h-10 bg-primary border border-modifier-border rounded overflow-hidden">
            {storyboardData ? (
              storyboardData.chapters.flatMap(chapter =>
                chapter.frames
              ).map((frame, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 h-full bg-purple-500 text-white text-center text-xs truncate flex items-center justify-center border-r border-purple-400"
                  style={{
                    left: `${(frame.startTime || 0) * PIXELS_PER_SECOND}px`,
                    width: `${(frame.duration || 0) * PIXELS_PER_SECOND}px`
                  }}
                  title={`${frame.speaker}: ${frame.dialogues}`}
                >
                  {frame.speaker}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-muted">
                ストーリーボードデータなし
              </div>
            )}
          </div>
        </div>
      
      {project.timeline.tracks.map((track, tIdx) => (
        <div
          key={tIdx}
          className="bg-secondary border border-modifier-border rounded p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{track.name}</div>
            <button
              className="px-2 py-1 text-xs bg-accent text-on-accent rounded hover:bg-accent-hover"
              onClick={() => handleAddClip(tIdx)}
            >
              クリップを追加
            </button>
          </div>
          
          <div className="relative h-10 bg-primary border border-modifier-border rounded overflow-hidden">
            {track.children.map((clip: OtioClip, cIdx: number) => (
              <div
                key={cIdx}
                className="absolute top-0 h-full bg-accent text-on-accent text-center text-xs truncate flex items-center justify-center"
                style={{
                  left: `${clip.source_range.start_time * PIXELS_PER_SECOND}px`,
                  width: `${clip.source_range.duration * PIXELS_PER_SECOND}px`
                }}
              >
                {clip.media_reference.target_url.split('/').pop() || 'Untitled'}
              </div>
            ))}
          </div>
          
          <table className="w-full text-xs mt-2">
            <thead>
              <tr className="border-b border-modifier-border">
                <th className="text-left p-2">ファイル</th>
                <th className="text-left p-2">開始時間</th>
                <th className="text-left p-2">長さ</th>
              </tr>
            </thead>
            <tbody>
              {track.children.map((clip: OtioClip, cIdx: number) => (
                <tr key={cIdx} className="border-b border-modifier-border">
                  <td className="p-2">
                    <input
                      className="w-full p-1 text-xs border border-modifier-border rounded bg-primary text-text-normal"
                      value={clip.media_reference.target_url}
                      onChange={e => handleClipChange(tIdx, cIdx, 'path', e.target.value)}
                      placeholder="ファイルパスを入力"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full p-1 text-xs border border-modifier-border rounded bg-primary text-text-normal"
                      value={clip.source_range.start_time}
                      onChange={e => handleClipChange(tIdx, cIdx, 'start', e.target.value)}
                      step="0.1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full p-1 text-xs border border-modifier-border rounded bg-primary text-text-normal"
                      value={clip.source_range.duration}
                      onChange={e => handleClipChange(tIdx, cIdx, 'duration', e.target.value)}
                      step="0.1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      
      {project.timeline.tracks.length === 0 && (
        <div className="text-center text-text-muted py-8">
          <p>トラックがありません</p>
          <p className="text-sm">「トラックを追加」ボタンをクリックして開始してください</p>
        </div>
      )}
    </div>
  );
}
