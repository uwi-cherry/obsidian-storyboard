import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockApp } from '../utils/obsidian-mock.js';
import { assertStringMatches } from '../utils/test-helpers.js';

// テスト対象の実装をここに再現
async function executeSaveStoryboardData({ app, file, data }) {
  try {
    const storyboardData = JSON.parse(data);
    let content = '';
    content += '### キャラクター\n\n';
    if (storyboardData.characters && storyboardData.characters.length > 0) {
      storyboardData.characters.forEach((char) => {
        content += `#### ${char.name}\n`;
        content += `- 説明\n  - ${char.attributes['説明'] || ''}\n`;
      });
    }
    storyboardData.chapters.forEach(chapter => {
      content += `\n### ${chapter.bgmPrompt ?? ''}\n\n`;
      let prevEnd = '00:00:00';
      chapter.frames.forEach(frame => {
        content += `#### ${frame.speaker || ''}\n`;
        content += `${frame.dialogues || ''}\n`;
        if (frame.imageUrl !== undefined || frame.imagePrompt !== undefined) {
          content += `[${frame.imagePrompt ?? ''}](${frame.imageUrl ?? ''})\n`;
        }
        if (frame.endTime !== undefined || frame.prompt !== undefined) {
          const timecode = `${prevEnd}-${frame.endTime ?? ''}`;
          content += `> [!INFO] ${timecode}`.trimEnd() + '\n';
          if (frame.prompt !== undefined) {
            frame.prompt.split('\n').forEach(l => {
              content += `> ${l}\n`;
            });
          }
          prevEnd = frame.endTime ?? prevEnd;
        }
      });
    });
    const newMarkdownContent = content.trimEnd() + (storyboardData.chapters.some(c => c.frames.length > 0) ? '\n' : '');
    await app.vault.modify(file, newMarkdownContent);
    return `ストーリーボードファイル "${file.name}" を保存しました`;
  } catch (error) {
    console.error('ストーリーボードファイル保存エラー:', error);
    return 'ストーリーボードファイルの保存に失敗しました';
  }
}

test.describe('Save Storyboard Data Tool', () => {
  let mockApp;
  let file;

  test.beforeEach(async () => {
    mockApp = createMockApp();
    await mockApp.vault.create('test.storyboard', 'old');
    file = mockApp.vault.getAbstractFileByPath('test.storyboard');
  });

  test.afterEach(() => {
    mockApp.reset();
  });

  test('StoryboardData を保存し vault.modify が正しく呼ばれる', async () => {
    const dataObj = {
      title: 'Test',
      characters: [
        { name: '太郎', attributes: { '説明': '主人公' } }
      ],
      chapters: [
        {
          bgmPrompt: '第1章',
          frames: [
            { speaker: '太郎', dialogues: 'こんにちは', endTime: '00:00:03' }
          ]
        }
      ]
    };

    const jsonData = JSON.stringify(dataObj);

    let modifyCalledWith = null;
    mockApp.vault.modify = async (f, content) => {
      modifyCalledWith = content;
      const fileObj = typeof f === 'string' ? mockApp.vault.getAbstractFileByPath(f) : f;
      if (fileObj) { fileObj.content = content; }
    };

    const result = await executeSaveStoryboardData({ app: mockApp, file, data: jsonData });

    assertStringMatches(result, '保存しました');

    const expectedMarkdown = '### キャラクター\n\n#### 太郎\n- 説明\n  - 主人公\n\n### 第1章\n\n#### 太郎\nこんにちは\n> [!INFO] 00:00:00-00:00:03\n';
    assert.equal(modifyCalledWith, expectedMarkdown, 'vault.modify に渡される Markdown が期待通り');
  });

  test('保存失敗時にエラーメッセージが返る', async () => {
    const dataObj = { title: 'Test', chapters: [], characters: [] };
    const jsonData = JSON.stringify(dataObj);

    mockApp.vault.modify = async () => { throw new Error('write error'); };

    const result = await executeSaveStoryboardData({ app: mockApp, file, data: jsonData });
    assert.equal(result, 'ストーリーボードファイルの保存に失敗しました');
  });
});
