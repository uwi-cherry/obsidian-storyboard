/**
 * 共通ベースクラス - 自動メソッド登録機能付き
 */
export class ApiService {
  private _routes = new Map<string, Function>();

  constructor() {
    const proto = Object.getPrototypeOf(this);
    for (const key of Object.getOwnPropertyNames(proto)) {
      const value = (this as any)[key];
      if (typeof value === 'function' && key !== 'constructor') {
        this._routes.set(key, value.bind(this));
      }
    }
  }

  /**
   * メソッドをディスパッチして実行する
   * @param method メソッド名
   * @param args 引数
   * @returns メソッドの実行結果
   */
  dispatch(method: string, ...args: any[]) {
    const fn = this._routes.get(method);
    if (!fn) throw new Error(`Unknown method: ${method}`);
    return fn(...args);
  }

  /**
   * 利用可能なメソッド一覧を取得する
   * @returns メソッド名の配列
   */
  listMethods(): string[] {
    return [...this._routes.keys()];
  }
} 