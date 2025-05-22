/* ===================================================================
 *  functional-view.ts   — 1 ファイルで完結する “React‑ish + クロージャ” ヘルパ
 * ===================================================================*/
import {
  App,
  FileView,
  ItemView,
  WorkspaceLeaf,
  TFile,
  Plugin,
} from 'obsidian';

/* ---------- 型定義 ---------- */
export type ViewBase = typeof FileView | typeof ItemView;

/** 利用側に渡されるコンテキスト */
export interface FuncCtx<Props, State> {
  /** ペインの root 要素 (= contentEl) */
  root: HTMLElement;
  app: App;
  leaf: WorkspaceLeaf;
  file: TFile | null;
  /** setProps() で上書きされた最新の値 */
  props: Props;
  /** Workspace 復元時に渡される state (初回 undefined) */
  state?: State;
  /* ---- Hook API ---- */
  useState: <T>(init: T | (() => T)) => [T, (v: T | ((p: T) => T)) => void];
  /** useState で値を書き換えた後に呼ぶと再描画される */
  refresh: () => void;
}

/** UI 関数の戻り値で追加オプションを指定 */
export type FuncReturn<State> =
  | void
  | {
      /** ペインを閉じる時に呼ばれる */
      cleanup?: () => void;
      /** 保持したいデータを返す (getState から呼び出し) */
      getState?: () => State;
      /** 復元データを受け取る (setState 時に呼ばれる) */
      setState?: (s: State) => void;
    };

export type FunctionalView<Props, State> = (
  ctx: FuncCtx<Props, State>,
) => FuncReturn<State>;

/* ---------- 内部: 最小フックランタイム ---------- */
function makeHookHost() {
  let cursor = 0;
  const buckets: any[] = [];

  function reset() {
    cursor = 0;
  }

  function useState<T>(init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void] {
    const i = cursor++;
    if (buckets[i] === undefined) {
      buckets[i] = typeof init === 'function' ? (init as any)() : init;
    }
    const set: (v: T | ((p: T) => T)) => void = (v) => {
      buckets[i] = typeof v === 'function' ? (v as any)(buckets[i]) : v;
    };
    return [buckets[i], set];
  }

  return { reset, useState } as const;
}

/* ---------- メイン API: createFunctionalView ---------- */
export function createFunctionalView<
  Props = void,
  State = void,
  Base extends ViewBase = typeof FileView,
>(
  viewType: string,
  icon: string,
  render: FunctionalView<Props, State>,
  defaultProps: Props,
  BaseCls: Base = FileView as Base,
) {
  const DisplayName = `${viewType}View`;

  return class extends (BaseCls as any) {
    /* ── private fields ── */
    #props: Props = defaultProps;
    #cachedState?: State;
    #cleanup?: () => void;
    #getStateImpl?: () => State;
    #setStateImpl?: (s: State) => void;
    readonly #hooks = makeHookHost();

    constructor(leaf: WorkspaceLeaf, initialProps: Partial<Props> = {}) {
      super(leaf);
      Object.assign(this.#props, initialProps);
    }

    /* ---- Obsidian metadata ---- */
    getViewType() {
      return viewType;
    }
    getIcon() {
      return icon;
    }
    getDisplayText() {
      return this.file?.basename ?? viewType;
    }

    /* ---- Props API ---- */
    setProps(p: Partial<Props>) {
      Object.assign(this.#props, p);
      if (this.#cleanup) this.#rerender();
    }
    getProps(): Props {
      return this.#props;
    }

    /* ---- Workspace state ---- */
    getState(): any {
      return this.#getStateImpl?.() ?? {};
    }
    async setState(s: any) {
      this.#cachedState = s as State;
      if (this.#cleanup) this.#rerender();
    }

    /* ---- Lifecycle ---- */
    async onOpen() {
      this.#rerender();
    }
    async onClose() {
      this.#cleanup?.();
    }

    /* ---- Internals ---- */
    #rerender() {
      /* 前回のクリーンアップ */
      this.#cleanup?.();
      this.contentEl.empty();

      /* Hook システム初期化 */
      this.#hooks.reset();

      const ret = render({
        root: this.contentEl,
        app: this.app,
        leaf: this.leaf,
        file: this.file instanceof TFile ? this.file : null,
        props: this.#props,
        state: this.#cachedState,
        useState: this.#hooks.useState,
        refresh: () => this.#rerender(),
      } as FuncCtx<Props, State>);

      /* オプション登録 */
      this.#cleanup = ret?.cleanup ?? undefined;
      this.#getStateImpl = ret?.getState ?? undefined;
      this.#setStateImpl = ret?.setState ?? undefined;
    }
  } as unknown as new (
    leaf: WorkspaceLeaf,
    props?: Partial<Props>,
  ) => InstanceType<Base>;
}

/* ---------- 便利: Plugin に一発登録 ---------- */
export function installFunctionalView<
  Props = void,
  State = void,
  Base extends ViewBase = typeof FileView,
>(
  plugin: Plugin,
  viewType: string,
  icon: string,
  render: FunctionalView<Props, State>,
  defaultProps: Props,
  BaseCls: Base = FileView as Base,
) {
  const Klass = createFunctionalView<Props, State, BaseCls>(
    viewType,
    icon,
    render,
    defaultProps,
    BaseCls,
  );

  plugin.registerView(viewType, (leaf) => new Klass(leaf));
  return Klass; // getActiveViewOfType 用
}

/* ===================================================================*/
