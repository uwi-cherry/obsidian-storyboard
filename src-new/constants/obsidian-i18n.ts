import { App, moment } from 'obsidian';

let app: App | null = null;

/**
 * アプリインスタンスを設定
 */
export function setAppInstance(appInstance: App): void {
  app = appInstance;
}

/**
 * Obsidian標準の翻訳機能を使用して翻訳を取得
 */
export function t(key: string, vars: Record<string, string | number> = {}): string {
  if (!app) {
    console.warn('App instance not set for i18n');
    return key;
  }
  
  // Obsidianの内部翻訳システムを使用
  // @ts-ignore - Obsidianの内部APIアクセス
  const locale = moment.locale();
  
  // 日本語の場合は日本語の翻訳を返す
  let result: string;

  if (locale === 'ja') {
    const jaTranslations: Record<string, string> = {
      'STORYBOARD_TOGGLE': '絵コンテ切替',
      'CHARACTER_EDIT': 'キャラクター編集',
      'CHARACTER_NAME': 'キャラ名',
      'DESCRIPTION': '説明',
      'DELETE': '削除',
      'CANCEL': 'キャンセル',
      'SAVE': '保存',
      'NO_SPEAKER': '話者なし',
      'EDIT_CHARACTERS': 'キャラクター情報を追加・編集',
      'DIALOGUE_PLACEHOLDER': '台詞',
      'AI_GENERATE': 'AI生成',
      'FILE_SELECT': 'ファイル選択',
      'GENERATING': '生成中',
      'MOVE_ROW_UP': '行を上に移動',
      'MOVE_ROW_DOWN': '行を下に移動',
      'INSERT_ROW_BELOW': '一つ下に新規追加',
      'PROMPT_REQUIRED': 'プロンプトを入力してください',
      'HEADER_IMAGE': '画像',
      'HEADER_DIALOGUE': '話者とセリフ',
      'HEADER_SE': 'SE',
      'HEADER_PREVIEW': 'プロンプト',
      'LOADING': '読み込み中...',
      'NEW_CHAPTER_PLACEHOLDER': '新しいBGMプロンプトを追加',
      'PROMPT_PLACEHOLDER': 'プロンプト',
      'IMAGE_PROMPT_PLACEHOLDER': '画像生成プロンプト(任意)',
      'ATTACHMENT': '{type}添付',
      'CLEAR_PATH': 'クリア',
      'TOOL_BRUSH': 'ブラシ',
      'TOOL_ERASER': '消しゴム',
      'TOOL_SELECTION': '選択',
      'TOOL_HAND': '手のひら',
      'BRUSH_SIZE': 'ブラシサイズ',
      'SELECTION_TYPE': '選択種別',
      'SELECT_RECT': '矩形',
      'SELECT_LASSO': '投げ縄',
      'SELECT_MAGIC': 'マジックワンド',
      'CANVAS_SIZE': 'キャンバスサイズ',
      'ZOOM_LEVEL': '拡大率',
      'ROTATION_ANGLE': '回転角'
      , 'LAYERS': 'レイヤー'
      , 'NEW_LAYER': '新規レイヤー'
      , 'IMAGE_LAYER': '画像レイヤー'
      , 'DELETE_LAYER': 'レイヤー削除'
      , 'ENTER_LAYER_NAME': 'レイヤー名を入力'
      , 'BACKGROUND': '背景'
    };
    result = jaTranslations[key] || key;
  }

  // 英語の場合は英語の翻訳を返す
  const enTranslations: Record<string, string> = {
    'STORYBOARD_TOGGLE': 'Toggle storyboard',
    'CHARACTER_EDIT': 'Edit characters',
    'CHARACTER_NAME': 'Character name',
    'DESCRIPTION': 'Description',
    'DELETE': 'Delete',
    'CANCEL': 'Cancel',
    'SAVE': 'Save',
    'NO_SPEAKER': 'No speaker',
    'EDIT_CHARACTERS': 'Add/edit character information',
    'DIALOGUE_PLACEHOLDER': 'Dialogue',
    'AI_GENERATE': 'AI generate',
    'FILE_SELECT': 'Select file',
    'GENERATING': 'Generating',
    'MOVE_ROW_UP': 'Move row up',
    'MOVE_ROW_DOWN': 'Move row down',
    'INSERT_ROW_BELOW': 'Insert row below',
    'PROMPT_REQUIRED': 'Please enter a prompt',
    'HEADER_IMAGE': 'Image',
    'HEADER_DIALOGUE': 'Speaker and dialogue',
    'HEADER_SE': 'SE',
    'HEADER_PREVIEW': 'Prompt',
    'LOADING': 'Loading...',
    'NEW_CHAPTER_PLACEHOLDER': 'Add new BGM prompt',
    'PROMPT_PLACEHOLDER': 'Prompt',
    'IMAGE_PROMPT_PLACEHOLDER': 'Image generation prompt (optional)',
    'ATTACHMENT': '{type} attachment',
    'CLEAR_PATH': 'Clear',
    'TOOL_BRUSH': 'Brush',
    'TOOL_ERASER': 'Eraser',
    'TOOL_SELECTION': 'Select',
    'TOOL_HAND': 'Hand',
    'BRUSH_SIZE': 'Brush size',
    'SELECTION_TYPE': 'Selection mode',
    'SELECT_RECT': 'Rectangle',
    'SELECT_LASSO': 'Lasso',
    'SELECT_MAGIC': 'Magic wand',
    'CANVAS_SIZE': 'Canvas Size',
    'ZOOM_LEVEL': 'Zoom',
    'ROTATION_ANGLE': 'Rotation',
    'LAYERS': 'Layers',
    'NEW_LAYER': 'New Layer',
    'IMAGE_LAYER': 'Image Layer',
    'DELETE_LAYER': 'Delete Layer',
    'ENTER_LAYER_NAME': 'Enter layer name',
    'BACKGROUND': 'Background'
  };
  if (result === undefined) {
    result = enTranslations[key] || key;
  }

  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}
