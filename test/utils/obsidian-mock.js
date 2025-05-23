/**
 * Obsidian モックユーティリティ
 * Obsidian APIをシミュレートして単体テストを可能にする
 */

/**
 * MockVault - Obsidian Vault の簡単なモック
 */
class MockVault {
  constructor() {
    this.files = new Map();
    this.createdFiles = [];
    this.deletedFiles = [];
  }

  /**
   * パスによってファイルを取得
   */
  getAbstractFileByPath(path) {
    return this.files.get(path) || null;
  }

  /**
   * 新しいファイルを作成
   */
  async create(path, content) {
    const file = new MockTFile(path, content);
    this.files.set(path, file);
    this.createdFiles.push({ path, content });
    return file;
  }

  /**
   * ファイルを削除
   */
  async delete(file) {
    const path = typeof file === 'string' ? file : file.path;
    this.files.delete(path);
    this.deletedFiles.push(path);
  }

  /**
   * ファイル内容を読み取り
   */
  async read(file) {
    const fileObj = typeof file === 'string' ? this.files.get(file) : file;
    return fileObj ? fileObj.content : '';
  }

  /**
   * ファイルを変更
   */
  async modify(file, content) {
    const fileObj = typeof file === 'string' ? this.files.get(file) : file;
    if (fileObj) {
      fileObj.content = content;
    }
  }

  /**
   * ファイル名を変更
   */
  async rename(file, newPath) {
    const oldPath = typeof file === 'string' ? file : file.path;
    const fileObj = this.files.get(oldPath);
    if (fileObj) {
      this.files.delete(oldPath);
      fileObj.path = newPath;
      fileObj.name = newPath.split('/').pop();
      this.files.set(newPath, fileObj);
    }
  }

  /**
   * テスト用のヘルパーメソッド
   */
  reset() {
    this.files.clear();
    this.createdFiles = [];
    this.deletedFiles = [];
  }

  getCreatedFiles() {
    return [...this.createdFiles];
  }

  getDeletedFiles() {
    return [...this.deletedFiles];
  }
}

/**
 * MockTFile - Obsidian TFile の簡単なモック
 */
class MockTFile {
  constructor(path, content = '') {
    this.path = path;
    this.name = path.split('/').pop();
    this.basename = this.name.split('.')[0];
    this.extension = this.name.includes('.') ? this.name.split('.').pop() : '';
    this.content = content;
    this.stat = {
      ctime: Date.now(),
      mtime: Date.now(),
      size: content.length
    };
  }
}

/**
 * MockWorkspace - Obsidian Workspace の簡単なモック
 */
class MockWorkspace {
  constructor() {
    this.activeLeaf = null;
    this.rightSplit = null;
    this.leftSplit = null;
  }

  getActiveViewOfType(viewType) {
    return this.activeLeaf && this.activeLeaf.view && this.activeLeaf.view.getViewType() === viewType 
      ? this.activeLeaf.view 
      : null;
  }

  getLeavesOfType(viewType) {
    return [];
  }
}

/**
 * MockApp - Obsidian App の簡単なモック
 */
class MockApp {
  constructor() {
    this.vault = new MockVault();
    this.workspace = new MockWorkspace();
    this.fileManager = {
      renameFile: (file, newPath) => this.vault.rename(file, newPath)
    };
  }

  /**
   * テスト用のリセット
   */
  reset() {
    this.vault.reset();
  }
}

/**
 * ファクトリー関数
 */
export function createMockApp() {
  return new MockApp();
}

export function createMockVault() {
  return new MockVault();
}

export function createMockTFile(path, content = '') {
  return new MockTFile(path, content);
}

/**
 * エクスポート
 */
export { MockApp, MockVault, MockTFile, MockWorkspace }; 