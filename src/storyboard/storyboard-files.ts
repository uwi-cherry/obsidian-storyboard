import { App, TFile } from 'obsidian';
import { StoryboardData } from './storyboard-types';
import { parseMarkdownToStoryboard, formatStoryboardToMarkdown } from './storyboard-parser';

export async function loadStoryboardData(file: TFile, app: App): Promise<StoryboardData> {
  const markdownContent = await app.vault.read(file);
  return parseMarkdownToStoryboard(markdownContent);
}

export async function saveStoryboardData(file: TFile, app: App, data: StoryboardData): Promise<void> {
  const newMarkdownContent = formatStoryboardToMarkdown(data);
  await app.vault.modify(file, newMarkdownContent);
}