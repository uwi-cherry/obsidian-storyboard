import { Plugin } from 'obsidian';
import { PainterFactory } from './obsidian-api/painter-factory';
import { RightSidebarFactory } from './obsidian-api/right-sidebar-factory';
import { TimelineFactory } from './obsidian-api/timeline-factory';
import { StoryboardFactory } from './obsidian-api/storyboard-factory';

/**
 * メインプラグインクラス
 */
export default class MyPlugin extends Plugin {
  private painterFactory: PainterFactory;
  private rightSidebarFactory: RightSidebarFactory;
  private timelineFactory: TimelineFactory;
  private storyboardFactory: StoryboardFactory;

  async onload() {
    console.log('🚀 Loading plugin...');

    // Obsidian API層の初期化
    this.painterFactory = new PainterFactory(this);
    this.rightSidebarFactory = new RightSidebarFactory(this);
    this.timelineFactory = new TimelineFactory(this);
    this.storyboardFactory = new StoryboardFactory(this);

    // 各ファクトリの初期化
    this.painterFactory.initialize();
    this.rightSidebarFactory.initialize();
    this.timelineFactory.initialize();
    this.storyboardFactory.initialize();

    console.log('✅ Plugin loaded successfully');
  }

  onunload() {
    console.log('🔄 Unloading plugin...');
    // 必要に応じてクリーンアップ処理
    console.log('✅ Plugin unloaded');
  }
} 