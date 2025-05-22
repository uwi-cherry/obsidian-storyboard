/* ===================================================================
 *  functional-view.ts   -----  汎用ファイルはこれ 1 本だけ  -----
 * ===================================================================*/
import {
    App, FileView, ItemView, WorkspaceLeaf, TFile, Plugin,
  } from 'obsidian';
  
  /* ---------- 型定義 ---------- */
  export type ViewBase = typeof FileView | typeof ItemView;
  
  export interface FuncCtx<Props, State> {
    root   : HTMLElement;      // contentEl
    app    : App;
    leaf   : WorkspaceLeaf;
    file   : TFile | null;
    /** 注入された props（setProps で更新可） */
    props  : Props;
    /** ワークスペース復元用 state（初回は undefined） */
    state ?: State;
  }
  
  /** UI 関数の戻り値でオプションを指定 */
  export type FuncReturn<State> =
    | void
    | {
        /** ペインを閉じる時に呼ぶ */
        cleanup? : () => void;
        /** 保存するデータを返す（呼び出し毎に実行） */
        getState?: () => State;
        /** 復元データを受け取る（setState 時に呼ばれる） */
        setState?: (s: State) => void;
      };
  
  export type FunctionalView<Props, State> =
    (ctx: FuncCtx<Props, State>) => FuncReturn<State>;
  
  /* ---------- ラッパ生成 ---------- */
  export function defineFunctionalView<
    Props = void,
    State = void,
    Base extends ViewBase = typeof FileView
  >(
    Base     : Base,
    viewType : string,
    icon     : string,
    render   : FunctionalView<Props, State>,
  ) {
  
    return class Wrapped extends (Base as any) {
      /* 内部保持 */
      #props!           : Props;
      #cachedState?     : State;
      #cleanup?         : () => void;
      #getStateImpl?    : () => State;
      #setStateImpl?    : (s: State) => void;
  
      constructor(leaf: WorkspaceLeaf, initialProps: Props) {
        super(leaf);
        this.#props = initialProps;
      }

      getProps(): Props {
        return this.#props;
      }
  
      /* ── Obsidian 規定メタ ── */
      getViewType()   { return viewType; }
      getIcon()       { return icon; }
      getDisplayText(){ return this.file?.basename ?? viewType; }
  
      /* ── Workspace State ── */
      getState(): any { return this.#getStateImpl?.() ?? {}; }
      async setState(s: any) {
        this.#cachedState = s as State;
        if (this.#cleanup) this.#rerender();          // 既に開いていれば再描画
      }
  
      /* ── props 更新 API ── */
      setProps(p: Props) {
        this.#props = p;
        if (this.#cleanup) this.#rerender();
      }
  
      /* ── LifeCycle ── */
      async onOpen () { this.#rerender(); }
      async onClose() { this.#cleanup?.(); }
  
      /* ── 内部描画 ── */
      #rerender() {
        this.#cleanup?.();
        this.contentEl.empty();
  
        const ret = render({
          root : this.contentEl,
          app  : this.app,
          leaf : this.leaf,
          file : this.file instanceof TFile ? this.file : null,
          props: this.#props,
          state: this.#cachedState,
        });
  
        if (ret) {
          this.#cleanup      = ret.cleanup    ?? undefined;
          this.#getStateImpl = ret.getState   ?? undefined;
          this.#setStateImpl = ret.setState   ?? undefined;
        }
      }
    } as unknown as new (leaf: WorkspaceLeaf, props: Props) => InstanceType<Base>;
  }
  
  /* ---------- 便利: プラグインへ一発登録 ---------- */
  export function installFunctionalView<
    Props = void,
    State = void,
    Base extends ViewBase = typeof FileView
  >(
    plugin     : Plugin,
    Base       : Base,
    viewType   : string,
    icon       : string,
    render     : FunctionalView<Props, State>,
    defaultProps: Props,
  ) {
    const Klass = defineFunctionalView<Props, State, Base>(
      Base, viewType, icon, render,
    );
  
    plugin.registerView(viewType,
      (leaf: WorkspaceLeaf) => new Klass(leaf, defaultProps),
    );
  
    return Klass;                              // getActiveViewOfType で使える
  }
  
  /* ===================================================================*/
  