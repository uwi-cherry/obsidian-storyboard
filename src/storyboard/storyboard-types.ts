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

export interface StoryboardData {
  title: string;
  frames: StoryboardFrame[];
  characters?: CharacterInfo[];
}
