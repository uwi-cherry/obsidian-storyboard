export type Language = 'ja' | 'en';

export interface Strings {
  AI_SETTINGS: string;
  OPENAI_API_KEY: string;
  OPENAI_API_KEY_DESC: string;
  LANGUAGE: string;
  LANGUAGE_DESC: string;
  SEND: string;
  INPUT_PLACEHOLDER: string;
  LOADING: string;
  AI_RESPONSE_ERROR: string;
  STORYBOARD_TOGGLE: string;
  ADD_STORYBOARD: string;
  EXT_CHANGE_FAILED: string;
  CREATE_PSD: string;
  OPEN_PSD: string;
  EXPORT_VIDEO: string;
  BACK_TO_STORYBOARD: string;
  EXPORT_IMAGE: string;
  CHARACTER_EDIT: string;
  CHARACTER_NAME: string;
  DESCRIPTION: string;
  DELETE: string;
  CANCEL: string;
  SAVE: string;
  PROMPT_REQUIRED: string;
  PLUGIN_NOT_FOUND: string;
  GENERATE_FAILED: string;
  TOOL_BRUSH: string;
  TOOL_ERASER: string;
  TOOL_SELECTION: string;
}

const STRINGS: Record<Language, Strings> = {
  ja: {
    AI_SETTINGS: 'AI設定',
    OPENAI_API_KEY: 'OpenAI APIキー',
    OPENAI_API_KEY_DESC: 'openaiで利用するAPIキーを入力してください',
    LANGUAGE: '言語',
    LANGUAGE_DESC: 'UIに使用する言語',
    SEND: '送信',
    INPUT_PLACEHOLDER: 'メッセージを入力...',
    LOADING: 'AIが応答中...',
    AI_RESPONSE_ERROR: 'AI応答エラー',
    STORYBOARD_TOGGLE: '絵コンテ切替',
    ADD_STORYBOARD: '新規ストーリーボードを追加',
    EXT_CHANGE_FAILED: 'ファイル拡張子の変更に失敗しました。コンソールログを確認してください。',
    CREATE_PSD: 'PSDペインターを新規作成',
    OPEN_PSD: 'PSDペインターを開く',
    EXPORT_VIDEO: '動画出力',
    BACK_TO_STORYBOARD: 'ストーリーボードに戻る',
    EXPORT_IMAGE: '画像出力',
    CHARACTER_EDIT: 'キャラクター編集',
    CHARACTER_NAME: 'キャラ名',
    DESCRIPTION: '説明',
    DELETE: '削除',
    CANCEL: 'キャンセル',
    SAVE: '保存',
    PROMPT_REQUIRED: 'プロンプトを入力してください',
    PLUGIN_NOT_FOUND: 'プラグインインスタンスが見つかりませんでした',
    GENERATE_FAILED: 'AI画像生成に失敗しました。コンソールを確認してください',
    TOOL_BRUSH: 'ブラシ',
    TOOL_ERASER: '消しゴム',
    TOOL_SELECTION: '選択',
  },
  en: {
    AI_SETTINGS: 'AI Settings',
    OPENAI_API_KEY: 'OpenAI API Key',
    OPENAI_API_KEY_DESC: 'Enter your OpenAI API key',
    LANGUAGE: 'Language',
    LANGUAGE_DESC: 'Language for the UI',
    SEND: 'Send',
    INPUT_PLACEHOLDER: 'Enter message...',
    LOADING: 'AI is typing...',
    AI_RESPONSE_ERROR: 'AI response error',
    STORYBOARD_TOGGLE: 'Toggle storyboard',
    ADD_STORYBOARD: 'Add storyboard',
    EXT_CHANGE_FAILED: 'Failed to change file extension. Check console logs.',
    CREATE_PSD: 'Create PSD Painter',
    OPEN_PSD: 'Open PSD Painter',
    EXPORT_VIDEO: 'Export video',
    BACK_TO_STORYBOARD: 'Back to storyboard',
    EXPORT_IMAGE: 'Export image',
    CHARACTER_EDIT: 'Edit Characters',
    CHARACTER_NAME: 'Name',
    DESCRIPTION: 'Description',
    DELETE: 'Delete',
    CANCEL: 'Cancel',
    SAVE: 'Save',
    PROMPT_REQUIRED: 'Please enter a prompt',
    PLUGIN_NOT_FOUND: 'Plugin instance not found',
    GENERATE_FAILED: 'Failed to generate image. Check console',
    TOOL_BRUSH: 'Brush',
    TOOL_ERASER: 'Eraser',
    TOOL_SELECTION: 'Select',
  }
};

let currentLanguage: Language = 'ja';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function t(key: keyof Strings): string {
  return STRINGS[currentLanguage][key];
}
