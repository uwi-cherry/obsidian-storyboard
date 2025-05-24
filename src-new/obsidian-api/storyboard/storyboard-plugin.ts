import { Plugin, addIcon, TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { StoryboardFactory } from './storyboard-factory';
import { STORYBOARD_ICON_SVG, STORYBOARD_TOGGLE_ICON_SVG } from '../../constants/icons';
import { toolRegistry } from '../../service-api/core/tool-registry';
import { TOOL_NAMES } from '../../constants/tools-config';

/**
 * Storyboard Plugin - Obsidian Plugin Integration
 */
export class StoryboardPlugin {
  private plugin: Plugin;
  private factory: StoryboardFactory;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.factory = new StoryboardFactory();
  }

  initialize(): void {
    // ストーリーボードアイコンを登録
    addIcon('storyboard', STORYBOARD_ICON_SVG);
    addIcon('storyboard-toggle', STORYBOARD_TOGGLE_ICON_SVG);

    // .storyboard拡張子を独自の拡張子として登録
    this.plugin.registerExtensions(['storyboard'], 'markdown');
    
    // リボンアイコンは統一メニュー（CreateMenuPlugin）で管理されるため、個別追加はコメントアウト
    // this.plugin.addRibbonIcon('storyboard', '新規ストーリーボードを追加', async () => {
    //   // ... (個別リボンアイコンのコード)
    // });

    // 全てのMarkdownビューにボタンを確実に表示するための処理
    const ensureButtonsInAllMarkdownViews = () => {
      this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf: WorkspaceLeaf) => {
        if (leaf.view instanceof MarkdownView) {
          this.factory.ensureStoryboardToggleButtonForLeaf(leaf, this.plugin.app);
        }
      });
    };

    // アクティブなリーフが変更されたときにもボタンを確認・追加
    const handleActiveLeafChange = (leaf: WorkspaceLeaf | null) => {
      if (leaf && leaf.view instanceof MarkdownView) {
        this.factory.ensureStoryboardToggleButtonForLeaf(leaf, this.plugin.app);
      }
    };

    this.plugin.registerEvent(this.plugin.app.workspace.on('layout-change', ensureButtonsInAllMarkdownViews));
    this.plugin.registerEvent(this.plugin.app.workspace.on('active-leaf-change', handleActiveLeafChange));

    // 初期状態でボタンを配置
    ensureButtonsInAllMarkdownViews();

    // ファイルを開いたときの処理
    const handleFileOpen = async (file: TFile) => {
      const activeLeaf = this.plugin.app.workspace.activeLeaf;
      if (!activeLeaf || !(activeLeaf.view instanceof MarkdownView)) return;

      // .storyboard拡張子の場合は自動的にストーリーボードビューを表示
      if (file.extension === 'storyboard') {
        await this.factory.switchToStoryboardViewMode(activeLeaf, this.plugin.app);
      } else if (this.factory.getCurrentViewMode(activeLeaf) === 'storyboard') {
        this.factory.switchToMarkdownViewMode(activeLeaf);
      }
    };
    this.plugin.registerEvent(this.plugin.app.workspace.on('file-open', handleFileOpen));
    
    // プラグインアンロード時のクリーンアップ処理を登録
    this.plugin.register(() => {
      this.factory.cleanupStoryboardViewRoots(this.plugin.app);
    });
  }

  // ファクトリメソッドへのアクセスを提供
  getFactory(): StoryboardFactory {
    return this.factory;
  }

  // アイコンは共通定義から読み込み
} 