import { MyPluginInstance } from "main";
import { App, TFile, Notice, WorkspaceLeaf, MarkdownView, addIcon } from "obsidian";
import { t } from "src/i18n";
import { STORYBOARD_ICON_SVG, STORYBOARD_TOGGLE_ICON_SVG } from "src/icons";
import { getCurrentViewMode, switchToStoryboardViewMode, switchToMarkdownViewMode, cleanupStoryboardViewRoots } from "./storyboard-factory";

/**
 * サポート関数: ファイルの拡張子を変更します。既存ファイルと競合する場合は連番を付与します。
 */
async function _renameFileExtension(app: App, file: TFile, newExt: string): Promise<void> {
    const parentPath = file.parent?.path ?? '';
    const baseName = file.basename;

    // 衝突回避のため存在チェックを行う
    let counter = 0;
    let newPath = `${parentPath ? parentPath + '/' : ''}${baseName}.${newExt}`;
    while (app.vault.getAbstractFileByPath(newPath)) {
        counter += 1;
        newPath = `${parentPath ? parentPath + '/' : ''}${baseName}-${counter}.${newExt}`;
    }

    try {
        await app.vault.rename(file, newPath);
    } catch (error) {
        console.error('ファイル拡張子の変更に失敗しました:', error);
        new Notice(t('EXT_CHANGE_FAILED'));
    }
}

/**
 * 指定されたリーフの表示モードをMarkdownと絵コンテの間で切り替えます。
 */
async function _toggleStoryboardForLeaf(leaf: WorkspaceLeaf, app: App): Promise<void> {
    if (!(leaf.view instanceof MarkdownView)) {
        return;
    }
    const view = leaf.view;
    const file = view.file;
    if (!file) {
        return;
    }

    const currentMode = getCurrentViewMode(leaf);
    if (currentMode === 'markdown') {
        // markdown -> storyboard へ切り替え
        if (file.extension !== 'storyboard') {
            await _renameFileExtension(app, file, 'storyboard');
        }
        await switchToStoryboardViewMode(leaf, app);
    } else {
        // storyboard -> markdown へ切り替え
        if (file.extension === 'storyboard') {
            await _renameFileExtension(app, file, 'md');
        }
        switchToMarkdownViewMode(leaf);
    }
}

/**
 * 指定されたMarkdownビューのヘッダーに絵コンテ切替ボタンがなければ追加します。
 */
function _ensureStoryboardToggleButtonForLeaf(leaf: WorkspaceLeaf, app: App): void {
    if (!(leaf.view instanceof MarkdownView)) {
        return;
    }
    const view = leaf.view;
    const buttonClass = 'storyboard-toggle-button-common';

    const existingButton = view.containerEl.querySelector(`.clickable-icon.${buttonClass}`);

    if (!existingButton) {
        const newButton = view.addAction('storyboard-toggle', t('STORYBOARD_TOGGLE'), () => {
            _toggleStoryboardForLeaf(leaf, app);
        }) as HTMLElement;
        newButton.classList.add(buttonClass);
    }
}

/**
 * サンプルのストーリーボードファイルを作成します
 */
async function createSampleStoryboardFile(app: App): Promise<TFile | null> {
    const sampleContent = `### キャラクター
#### 太郎
- 説明
  - 主人公。高校生。
#### 花子
- 説明
  - ヒロイン。転校生。
### シナリオ
#### 太郎
あ、新しい転校生だ
#### 花子
はじめまして、田中花子です
#### 太郎
よろしく。僕は山田太郎だよ
#### 花子
山田くん、席案内してくれない？
#### 太郎
あ、うん。こっちだよ
`;

    try {
        // 連番を付けてファイルを作成
        let counter = 1;
        let fileName = `無題のファイル ${counter}.storyboard`;
        
        // 既存のファイルをチェックして、使用可能な番号を見つける
        while (app.vault.getAbstractFileByPath(fileName)) {
            counter++;
            fileName = `無題のファイル ${counter}.storyboard`;
        }

        // 新しいファイルを作成
        return await app.vault.create(fileName, sampleContent);
    } catch (error) {
        console.error('サンプルファイルの作成に失敗しました:', error);
        return null;
    }
}

/**
 * 左メニューにサンプルファイルを追加します
 */
async function addSampleFileToRibbon(app: App, plugin: MyPluginInstance): Promise<void> {
    // リボンアイコンを追加
    plugin.addRibbonIcon('storyboard', t('ADD_STORYBOARD'), async () => {
        // ファイルが存在しない場合は作成
        const file = await createSampleStoryboardFile(app);
        if (file) {
            // ファイルを開く
            const leaf = app.workspace.getLeaf(true);
            await leaf.openFile(file);
        }
    });
}

/**
 * ストーリーボード機能に関連するUI要素の初期化とイベントリスナの登録を行います。
 * @param plugin MyPlugin のインスタンス
 */
export function initializeStoryboardIntegration(plugin: MyPluginInstance): void {
    const app = plugin.app;

    // ストーリーボードアイコンを登録
    addIcon('storyboard', STORYBOARD_ICON_SVG);
    addIcon('storyboard-toggle', STORYBOARD_TOGGLE_ICON_SVG);

    // .story.mdを独自の拡張子として登録
    plugin.registerExtensions(['storyboard'], 'markdown');

    // 左メニューにサンプルファイルを追加
    addSampleFileToRibbon(app, plugin);

    // 全てのMarkdownビューにボタンを確実に表示するための処理
    const ensureButtonsInAllMarkdownViews = () => {
        app.workspace.getLeavesOfType('markdown').forEach(leaf => {
            if (leaf.view instanceof MarkdownView) {
                _ensureStoryboardToggleButtonForLeaf(leaf, app);
            }
        });
    };

    // アクティブなリーフが変更されたときにもボタンを確認・追加
    const handleActiveLeafChange = (leaf: WorkspaceLeaf | null) => {
        if (leaf && leaf.view instanceof MarkdownView) {
            _ensureStoryboardToggleButtonForLeaf(leaf, app);
        }
    };

    plugin.registerEvent(app.workspace.on('layout-change', ensureButtonsInAllMarkdownViews));
    plugin.registerEvent(app.workspace.on('active-leaf-change', handleActiveLeafChange));

    // 初期状態でボタンを配置
    ensureButtonsInAllMarkdownViews();

    // ファイルを開いたときの処理
    const handleFileOpen = async (file: TFile) => {
        const activeLeaf = app.workspace.activeLeaf;
        if (!activeLeaf || !(activeLeaf.view instanceof MarkdownView)) return;

        // .storyboard拡張子の場合は自動的にストーリーボードビューを表示
        if (file.extension === 'storyboard') {
            await switchToStoryboardViewMode(activeLeaf, app);
        } else if (getCurrentViewMode(activeLeaf) === 'storyboard') {
            switchToMarkdownViewMode(activeLeaf);
        }
    };
    plugin.registerEvent(app.workspace.on('file-open', handleFileOpen));

    // プラグインアンロード時のクリーンアップ処理を登録
    plugin.register(() => {
        cleanupStoryboardViewRoots(app);
    });
} 