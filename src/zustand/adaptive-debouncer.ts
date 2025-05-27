// シンプルなデバウンス処理
export class AdaptiveDebouncer {
  private timeout: NodeJS.Timeout | null = null;
  private saveHistory: number[] = []; // 保存実行のタイムスタンプ履歴
  
  constructor(private func: Function) {}
  
  execute(...args: unknown[]) {
    const now = Date.now();
    
    // 過去1分間の保存履歴をクリーンアップ
    this.saveHistory = this.saveHistory.filter(time => now - time < 60000);
    
    // 過去1分間の保存回数に応じてデバウンス時間を決定
    const saveCount = this.saveHistory.length;
    
    if (saveCount === 0) {
      // 初回は即座に実行
      this.saveHistory.push(now);
      this.func(...args);
    } else {
      // 1回以上なら段階的にデバウンス（最大5秒）
      const debounceTime = Math.min(saveCount, 5) * 1000;
      
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.saveHistory.push(Date.now());
        this.func(...args);
      }, debounceTime);
    }
  }
  
  getCurrentDelay() {
    const saveCount = this.saveHistory.filter(time => Date.now() - time < 60000).length;
    return Math.min(saveCount, 5) * 1000;
  }
} 