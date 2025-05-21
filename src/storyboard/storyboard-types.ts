export interface StoryboardFrame {
  dialogues: string;
  speaker: string;
  imageUrl?: string;
  imagePrompt?: string;
  sePrompt?: string;
  cameraPrompt?: string;
  timecode?: string;
}

export interface CharacterInfo {
  name: string;
  attributes: { [label: string]: string };
}

export interface StoryboardChapter {
  bgmPrompt?: string;
  frames: StoryboardFrame[];
}

export interface StoryboardData {
  title: string;
  chapters: StoryboardChapter[];
  characters?: CharacterInfo[];
}
