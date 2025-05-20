export interface StoryboardFrame {
  dialogues: string;
  speaker: string;
  imageUrl?: string;
  imagePrompt?: string;
}

export interface CharacterInfo {
  name: string;
  attributes: { [label: string]: string };
}

export interface StoryboardChapter {
  title: string;
  frames: StoryboardFrame[];
}

export interface StoryboardData {
  title: string;
  chapters: StoryboardChapter[];
  characters?: CharacterInfo[];
}
