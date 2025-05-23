import { 
  Plugin, 
  App, 
  WorkspaceLeaf, 
  View, 
  EventRef, 
  addIcon, 
  TFile, 
  MarkdownView,
  ItemView,
  FileView,
  PluginSettingTab,
  Setting,
  Notice
} from 'obsidian';
import { ApiService } from '../service-api/api-service';

export class ObsidianApiBase extends ApiService {
  protected plugin: Plugin;
  protected app: App;

  constructor(plugin: Plugin) {
    super();
    this.plugin = plugin;
    this.app = plugin.app;
  }

  // ============ Plugin API ============
  
  /**
   * ビュータイプを登録
   */
  registerView(viewType: string, viewCreator: (leaf: WorkspaceLeaf) => View) {
    this.plugin.registerView(viewType, viewCreator);
  }

  /**
   * ファイル拡張子を特定のビュータイプに関連付け
   */
  registerExtensions(extensions: string[], viewType: string) {
    this.plugin.registerExtensions(extensions, viewType);
  }

  /**
   * リボンアイコンを追加
   */
  addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
    return this.plugin.addRibbonIcon(icon, title, callback);
  }

  /**
   * アイコンを登録
   */
  addIcon(iconId: string, svgContent: string) {
    addIcon(iconId, svgContent);
  }

  /**
   * イベントリスナーを登録（プラグインアンロード時に自動削除）
   */
  registerEvent(eventRef: EventRef) {
    this.plugin.registerEvent(eventRef);
  }

  /**
   * クリーンアップコールバックを登録
   */
  registerCleanup(callback: () => void) {
    this.plugin.register(callback);
  }

  /**
   * Documentイベントを登録
   */
  registerDocumentEvent<K extends keyof DocumentEventMap>(
    type: K,
    callback: (ev: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ) {
    this.plugin.registerDomEvent(document, type, callback, options);
  }

  /**
   * HTMLElementイベントを登録
   */
  registerElementEvent<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    callback: (ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ) {
    this.plugin.registerDomEvent(el, type, callback, options);
  }

  // ============ Workspace API ============

  /**
   * 新しいリーフを取得
   */
  getLeaf(newLeaf?: boolean): WorkspaceLeaf {
    return this.app.workspace.getLeaf(newLeaf);
  }

  /**
   * 指定されたビュータイプのリーフ一覧を取得
   */
  getLeavesOfType(viewType: string): WorkspaceLeaf[] {
    return this.app.workspace.getLeavesOfType(viewType);
  }

  /**
   * 右サイドバーのリーフを取得
   */
  getRightLeaf(split: boolean = false): WorkspaceLeaf | null {
    return this.app.workspace.getRightLeaf(split);
  }

  /**
   * アクティブなリーフを取得
   */
  getActiveLeaf(): WorkspaceLeaf | null {
    return this.app.workspace.activeLeaf;
  }

  /**
   * 指定されたビュータイプのアクティブビューを取得
   */
  getActiveViewOfType<T extends View>(viewType: new (...args: any[]) => T): T | null {
    return this.app.workspace.getActiveViewOfType(viewType);
  }

  /**
   * ワークスペースイベントを登録
   */
  onWorkspaceEvent(event: string, callback: (...args: any[]) => void) {
    this.registerEvent(this.app.workspace.on(event as any, callback));
  }

  /**
   * 指定されたビュータイプのリーフをデタッチ
   */
  detachLeavesOfType(viewType: string) {
    this.app.workspace.detachLeavesOfType(viewType);
  }

  // ============ File API ============

  /**
   * ファイルを作成
   */
  async createFile(path: string, data: string): Promise<TFile> {
    return await this.app.vault.create(path, data);
  }

  /**
   * ファイルを読み取り
   */
  async readFile(file: TFile): Promise<string> {
    return await this.app.vault.read(file);
  }

  /**
   * ファイルを変更
   */
  async modifyFile(file: TFile, data: string): Promise<void> {
    await this.app.vault.modify(file, data);
  }

  /**
   * ファイルをリネーム
   */
  async renameFile(file: TFile, newPath: string): Promise<void> {
    await this.app.vault.rename(file, newPath);
  }

  /**
   * パスからファイルを取得
   */
  getFileByPath(path: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  /**
   * リーフでファイルを開く
   */
  async openFileInLeaf(leaf: WorkspaceLeaf, file: TFile): Promise<void> {
    await leaf.openFile(file);
  }

  // ============ View Utilities ============

  /**
   * ビューの状態を設定
   */
  async setViewState(leaf: WorkspaceLeaf, state: { type: string; active?: boolean }): Promise<void> {
    await leaf.setViewState(state);
  }

  /**
   * MarkdownViewにアクションを追加
   */
  addMarkdownAction(view: MarkdownView, id: string, title: string, callback: () => void): HTMLElement {
    return view.addAction(id, title, callback);
  }

  // ============ Settings API ============

  /**
   * 設定データを読み込み
   */
  async loadData(): Promise<any> {
    return await this.plugin.loadData();
  }

  /**
   * 設定データを保存
   */
  async saveData(data: any): Promise<void> {
    await this.plugin.saveData(data);
  }

  /**
   * 設定タブを追加
   */
  addSettingTab(settingTab: PluginSettingTab) {
    this.plugin.addSettingTab(settingTab);
  }

  /**
   * 設定項目を作成
   */
  createSetting(containerEl: HTMLElement): Setting {
    return new Setting(containerEl);
  }

  // ============ Notifications ============

  /**
   * 通知を表示
   */
  showNotice(message: string, timeout?: number): Notice {
    return new Notice(message, timeout);
  }

  // ============ Context Menu ============

  /**
   * ファイルメニューイベントを登録
   */
  onFileMenu(callback: (menu: any, file: TFile) => void) {
    this.registerEvent(this.app.workspace.on('file-menu', callback));
  }
} 