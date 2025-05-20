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
  LAYERS: string;
  NEW_LAYER: string;
  IMAGE_LAYER: string;
  DELETE_LAYER: string;
  LAYER_NAME_PROMPT: string;
  BRUSH_SIZE: string;
  SELECTION_TYPE: string;
  SELECTION_RECT: string;
  SELECTION_LASSO: string;
  SELECTION_MAGIC: string;
  SPEAKER_NONE: string;
  EDIT_CHARACTER_INFO: string;
  DIALOGUE_PLACEHOLDER: string;
  IMAGE_HEADER: string;
  SPEAKER_DIALOGUE_HEADER: string;
  AI_GENERATE: string;
  FILE_SELECT: string;
  CLEAR_PATH: string;
  GENERATING: string;
  ADD_ROW: string;
  MOVE_ROW_UP: string;
  MOVE_ROW_DOWN: string;
  INSERT_BELOW: string;
  BACKGROUND_LAYER: string;
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
    LAYERS: 'レイヤー',
    NEW_LAYER: '新規レイヤー',
    IMAGE_LAYER: '画像レイヤー',
    DELETE_LAYER: 'レイヤーを削除',
    LAYER_NAME_PROMPT: 'レイヤー名を入力',
    BRUSH_SIZE: 'ブラシサイズ',
    SELECTION_TYPE: '選択種別',
    SELECTION_RECT: '矩形',
    SELECTION_LASSO: '投げ縄',
    SELECTION_MAGIC: 'マジックワンド',
    SPEAKER_NONE: '話者なし',
    EDIT_CHARACTER_INFO: 'キャラクター情報を追加・編集',
    DIALOGUE_PLACEHOLDER: '台詞',
    IMAGE_HEADER: '画像',
    SPEAKER_DIALOGUE_HEADER: '話者とセリフ',
    AI_GENERATE: 'AI生成',
    FILE_SELECT: 'ファイル選択',
    CLEAR_PATH: 'パスをクリア',
    GENERATING: '生成中...',
    ADD_ROW: '行を追加',
    MOVE_ROW_UP: '行を上に移動',
    MOVE_ROW_DOWN: '行を下に移動',
    INSERT_BELOW: '一つ下に新規追加',
    BACKGROUND_LAYER: '背景',
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
    LAYERS: 'Layers',
    NEW_LAYER: 'New Layer',
    IMAGE_LAYER: 'Image Layer',
    DELETE_LAYER: 'Delete Layer',
    LAYER_NAME_PROMPT: 'Layer name',
    BRUSH_SIZE: 'Brush Size',
    SELECTION_TYPE: 'Selection Type',
    SELECTION_RECT: 'Rectangle',
    SELECTION_LASSO: 'Lasso',
    SELECTION_MAGIC: 'Magic Wand',
    SPEAKER_NONE: 'No Speaker',
    EDIT_CHARACTER_INFO: 'Add/Edit character info',
    DIALOGUE_PLACEHOLDER: 'Dialogue',
    IMAGE_HEADER: 'Image',
    SPEAKER_DIALOGUE_HEADER: 'Speaker & Dialogue',
    AI_GENERATE: 'AI Generate',
    FILE_SELECT: 'Choose File',
    CLEAR_PATH: 'Clear Path',
    GENERATING: 'Generating...',
    ADD_ROW: 'Add Row',
    MOVE_ROW_UP: 'Move up',
    MOVE_ROW_DOWN: 'Move down',
    INSERT_BELOW: 'Insert below',
    BACKGROUND_LAYER: 'Background',
  }
};

let currentLanguage: Language = 'ja';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function t(key: keyof Strings): string {
  return STRINGS[currentLanguage][key];
}
