export type Language = 'ja' | 'en';

export interface Strings {
  AI_SETTINGS: string;
  FAL_API_KEY: string;
  FAL_API_KEY_DESC: string;
  REPLICATE_API_KEY: string;
  REPLICATE_API_KEY_DESC: string;
  API_PROVIDER: string;
  API_PROVIDER_DESC: string;
  LANGUAGE: string;
  LANGUAGE_DESC: string;
  SEND: string;
  INPUT_PLACEHOLDER: string;
  LOADING: string;
  AI_RESPONSE_ERROR: string;
  STORYBOARD_TOGGLE: string;
  ADD_STORYBOARD: string;
  ADD_TIMELINE: string;
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
  TOOL_HAND: string;
  UNDO: string;
  REDO: string;
  BRUSH_SIZE: string;
  SELECTION_TYPE: string;
  SELECT_RECT: string;
  SELECT_LASSO: string;
  SELECT_MAGIC: string;
  IMAGE_PROMPT_PLACEHOLDER: string;
  SE_PROMPT_PLACEHOLDER: string;
  HEADER_IMAGE: string;
  HEADER_DIALOGUE: string;
  HEADER_SE: string;
  HEADER_PREVIEW: string;
  ADD_SE: string;
  ADD_CAMERA_ANGLE: string;
  ADD_TIMECODE: string;
  CAMERA_PROMPT_PLACEHOLDER: string;
  TIMECODE_PLACEHOLDER: string;
  LAYERS: string;
  NEW_LAYER: string;
  IMAGE_LAYER: string;
  DELETE_LAYER: string;
  ENTER_LAYER_NAME: string;
  NO_SPEAKER: string;
  EDIT_CHARACTERS: string;
  DIALOGUE_PLACEHOLDER: string;
  BACKGROUND: string;
  UNTITLED_ILLUSTRATION: string;
  MOVE_ROW_UP: string;
  MOVE_ROW_DOWN: string;
  INSERT_ROW_BELOW: string;
  GENERATING: string;
  AI_GENERATE: string;
  FILE_SELECT: string;
  CLEAR_PATH: string;
  GENERATE_PREVIEW: string;
  SCALE: string;
  ROTATE: string;
  ADD_CHAPTER: string;
  NEW_CHAPTER_PLACEHOLDER: string;
  UNTITLED_CHAPTER: string;
  CANVAS_SIZE: string;
  ZOOM_LEVEL: string;
  ROTATION_ANGLE: string;
  ADD_IMAGE: string;
  ADD_MASK: string;
  ADD_CHARACTER_DESIGN: string;
  ADD_IMAGE_TOOLTIP: string;
  ADD_MASK_TOOLTIP: string;
  ADD_REFERENCE_TOOLTIP: string;
  ADD_CLIP: string;
  ADD_TRACK: string;
  EDIT: string;
  CONFIRM: string;
}

const STRINGS: Record<Language, Strings> = {
  ja: {
    AI_SETTINGS: 'AI設定',
    FAL_API_KEY: 'fal.ai APIキー',
    FAL_API_KEY_DESC: 'fal.aiで利用するAPIキーを入力してください',
    REPLICATE_API_KEY: 'Replicate APIキー',
    REPLICATE_API_KEY_DESC: 'Replicateで利用するAPIキーを入力してください',
    API_PROVIDER: '使用するAPI',
    API_PROVIDER_DESC: 'fal.ai または Replicate を選択',
    LANGUAGE: '言語',
    LANGUAGE_DESC: 'UIに使用する言語',
    SEND: '送信',
    INPUT_PLACEHOLDER: 'メッセージを入力...',
    LOADING: 'AIが応答中...',
    AI_RESPONSE_ERROR: 'AI応答エラー',
    STORYBOARD_TOGGLE: '絵コンテ切替',
    ADD_STORYBOARD: '新規ストーリーボードを追加',
    ADD_TIMELINE: '新規タイムラインを追加',
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
    TOOL_HAND: '手のひら',
    UNDO: '元に戻す',
    REDO: 'やり直す',
    BRUSH_SIZE: 'ブラシサイズ',
    SELECTION_TYPE: '選択種別',
    SELECT_RECT: '矩形',
    SELECT_LASSO: '投げ縄',
    SELECT_MAGIC: 'マジックワンド',
    IMAGE_PROMPT_PLACEHOLDER: '画像生成プロンプト(任意)',
    SE_PROMPT_PLACEHOLDER: 'SE生成プロンプト(任意)',
    HEADER_IMAGE: '画像',
    HEADER_DIALOGUE: '話者とセリフ',
    HEADER_SE: 'SE',
    HEADER_PREVIEW: 'プロンプト',
    ADD_SE: '効果音を追加',
    ADD_CAMERA_ANGLE: 'カメラアングルを追加',
    ADD_TIMECODE: '再生時間を追加',
    CAMERA_PROMPT_PLACEHOLDER: 'カメラアングル(任意)',
    TIMECODE_PLACEHOLDER: 'hh:mm:ss-hh:mm:ss',
    LAYERS: 'レイヤー',
    NEW_LAYER: '新規レイヤー',
    IMAGE_LAYER: '画像レイヤー',
    DELETE_LAYER: 'レイヤーを削除',
    ENTER_LAYER_NAME: 'レイヤー名を入力',
    NO_SPEAKER: '話者なし',
    EDIT_CHARACTERS: 'キャラクター情報を追加・編集',
    DIALOGUE_PLACEHOLDER: '台詞',
    BACKGROUND: '背景',
    UNTITLED_ILLUSTRATION: '無題のイラスト',
    MOVE_ROW_UP: '行を上に移動',
    MOVE_ROW_DOWN: '行を下に移動',
    INSERT_ROW_BELOW: '一つ下に新規追加',
    GENERATING: '生成中',
    AI_GENERATE: 'AI生成',
    FILE_SELECT: 'ファイル選択',
    CLEAR_PATH: 'クリア',
    GENERATE_PREVIEW: 'プレビュー動画をAI生成',
    SCALE: '拡縮',
    ROTATE: '回転',
    ADD_CHAPTER: 'BGMプロンプトを追加',
    NEW_CHAPTER_PLACEHOLDER: '新しいBGMプロンプトを追加',
    UNTITLED_CHAPTER: '無題の章',
    CANVAS_SIZE: 'キャンバスサイズ',
    ZOOM_LEVEL: '拡大率',
    ROTATION_ANGLE: '回転角',
    ADD_IMAGE: '編集したい画像を追加',
    ADD_MASK: '編集画像のマスクを追加',
    ADD_CHARACTER_DESIGN: '参考にしたい画像を追加',
    ADD_IMAGE_TOOLTIP: '画像を追加',
    ADD_MASK_TOOLTIP: 'マスクを追加',
    ADD_REFERENCE_TOOLTIP: '参考画像を追加',
    ADD_CLIP: 'クリップを追加',
    ADD_TRACK: 'トラックを追加',
    EDIT: '編集',
    CONFIRM: '確定',
  },
  en: {
    AI_SETTINGS: 'AI Settings',
    FAL_API_KEY: 'fal.ai API Key',
    FAL_API_KEY_DESC: 'Enter your fal.ai API key',
    REPLICATE_API_KEY: 'Replicate API Key',
    REPLICATE_API_KEY_DESC: 'Enter your Replicate API key',
    API_PROVIDER: 'API Provider',
    API_PROVIDER_DESC: 'Choose fal.ai or Replicate',
    LANGUAGE: 'Language',
    LANGUAGE_DESC: 'Language for the UI',
    SEND: 'Send',
    INPUT_PLACEHOLDER: 'Enter message...',
    LOADING: 'AI is typing...',
    AI_RESPONSE_ERROR: 'AI response error',
    STORYBOARD_TOGGLE: 'Toggle storyboard',
    ADD_STORYBOARD: 'Add storyboard',
    ADD_TIMELINE: 'Add timeline',
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
    TOOL_HAND: 'Hand',
    UNDO: 'Undo',
    REDO: 'Redo',
    BRUSH_SIZE: 'Brush size',
    SELECTION_TYPE: 'Selection mode',
    SELECT_RECT: 'Rectangle',
    SELECT_LASSO: 'Lasso',
    SELECT_MAGIC: 'Magic wand',
    IMAGE_PROMPT_PLACEHOLDER: 'Image prompt (optional)',
    SE_PROMPT_PLACEHOLDER: 'SE prompt (optional)',
    HEADER_IMAGE: 'Image',
    HEADER_DIALOGUE: 'Speaker & Dialogue',
    HEADER_SE: 'SE',
    HEADER_PREVIEW: 'Prompt',
    ADD_SE: 'Add SE',
    ADD_CAMERA_ANGLE: 'Add Camera Angle',
    ADD_TIMECODE: 'Add Timecode',
    CAMERA_PROMPT_PLACEHOLDER: 'Camera angle (optional)',
    TIMECODE_PLACEHOLDER: 'hh:mm:ss-hh:mm:ss',
    LAYERS: 'Layers',
    NEW_LAYER: 'New Layer',
    IMAGE_LAYER: 'Image Layer',
    DELETE_LAYER: 'Delete Layer',
    ENTER_LAYER_NAME: 'Enter layer name',
    NO_SPEAKER: 'No speaker',
    EDIT_CHARACTERS: 'Add/Edit character info',
    DIALOGUE_PLACEHOLDER: 'Dialogue',
    BACKGROUND: 'Background',
    UNTITLED_ILLUSTRATION: 'Untitled Illustration',
    MOVE_ROW_UP: 'Move row up',
    MOVE_ROW_DOWN: 'Move row down',
    INSERT_ROW_BELOW: 'Insert row below',
    GENERATING: 'Generating...',
    AI_GENERATE: 'Generate',
    FILE_SELECT: 'Select file',
    CLEAR_PATH: 'Clear',
    GENERATE_PREVIEW: 'Generate Preview',
    SCALE: 'Scale',
    ROTATE: 'Rotate',
    ADD_CHAPTER: 'Add BGM prompt',
    NEW_CHAPTER_PLACEHOLDER: 'Add new BGM prompt',
    UNTITLED_CHAPTER: 'Untitled Chapter',
    CANVAS_SIZE: 'Canvas Size',
    ZOOM_LEVEL: 'Zoom',
    ROTATION_ANGLE: 'Rotation',
    ADD_IMAGE: 'Add image to edit',
    ADD_MASK: 'Add mask for the image',
    ADD_CHARACTER_DESIGN: 'Add reference image',
    ADD_IMAGE_TOOLTIP: 'Add image',
    ADD_MASK_TOOLTIP: 'Add mask',
    ADD_REFERENCE_TOOLTIP: 'Add reference',
    ADD_CLIP: 'Add clip',
    ADD_TRACK: 'Add track',
    EDIT: 'Edit',
    CONFIRM: 'Confirm',
  }
};

let currentLanguage: Language = 'ja';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function t(key: keyof Strings): string {
  return STRINGS[currentLanguage][key];
}
