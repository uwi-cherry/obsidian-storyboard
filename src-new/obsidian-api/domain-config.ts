/**
 * ドメイン別Obsidian API使い分け設定
 */

export interface DomainConfig {
  /** ドメイン名 */
  name: string;
  /** 使用するObsidianビュータイプ */
  viewType: 'FileView' | 'ItemView' | 'MarkdownView' | 'PluginSettingTab';
  /** 拡張子設定 */
  extensions?: {
    /** 関連付ける拡張子一覧 */
    list: string[];
    /** 既存拡張子からの切り替えか */
    switchFrom?: string;
  };
  /** ビュー登録設定 */
  viewRegistration?: {
    /** ビュータイプID */
    viewTypeId: string;
    /** ビュークリエーター関数名 */
    creatorFunction: string;
  };
  /** React使用有無 */
  usesReact: boolean;
  /** リボンアイコン設定 */
  ribbonIcon?: {
    iconId: string;
    title: string;
    action: string;
  };
  /** 特殊な統合パターン */
  integration?: 'sidebar-persistent' | 'markdown-injection' | 'context-menu' | 'settings-only';
  /** クリーンアップが必要か */
  needsCleanup: boolean;
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  timeline: {
    name: 'Timeline',
    viewType: 'FileView',
    extensions: {
      list: ['otio']
    },
    viewRegistration: {
      viewTypeId: 'otio-view',
      creatorFunction: 'createTimelineView'
    },
    usesReact: true,
    ribbonIcon: {
      iconId: 'timeline',
      title: 'Add Timeline',
      action: 'createOtioFile'
    },
    needsCleanup: true
  },

  painter: {
    name: 'Painter',
    viewType: 'FileView',
    extensions: {
      list: ['psd']
    },
    viewRegistration: {
      viewTypeId: 'psd-view',
      creatorFunction: 'createPainterView'
    },
    usesReact: true,
    ribbonIcon: {
      iconId: 'palette',
      title: 'PSD Tool',
      action: 'createPsd'
    },
    integration: 'context-menu',
    needsCleanup: true
  },

  storyboard: {
    name: 'Storyboard',
    viewType: 'MarkdownView',
    extensions: {
      list: ['storyboard'],
      switchFrom: 'md'
    },
    usesReact: true,
    ribbonIcon: {
      iconId: 'storyboard',
      title: 'Add Storyboard',
      action: 'createSampleStoryboardFile'
    },
    integration: 'markdown-injection',
    needsCleanup: true
  },

  sidebar: {
    name: 'Right Sidebar',
    viewType: 'ItemView',
    // 拡張子なし
    viewRegistration: {
      viewTypeId: 'layer-sidebar',
      creatorFunction: 'createLayerSidebar'
    },
    usesReact: true,
    integration: 'sidebar-persistent',
    needsCleanup: true
  },

  settings: {
    name: 'Settings',
    viewType: 'PluginSettingTab',
    // 拡張子なし、ビュー登録なし
    usesReact: false,
    integration: 'settings-only',
    needsCleanup: false
  }
};

/**
 * 設定に基づく初期化パターンの判定
 */
export class DomainConfigHelper {
  
  static needsExtensionRegistration(config: DomainConfig): boolean {
    return !!config.extensions?.list.length;
  }
  
  static needsViewRegistration(config: DomainConfig): boolean {
    return !!config.viewRegistration;
  }
  
  static needsRibbonIcon(config: DomainConfig): boolean {
    return !!config.ribbonIcon;
  }
  
  static getInitializationSteps(domainName: string): string[] {
    const config = DOMAIN_CONFIGS[domainName];
    if (!config) return [];
    
    const steps: string[] = [];
    
    // アイコン登録
    if (config.ribbonIcon) {
      steps.push(`addIcon('${config.ribbonIcon.iconId}', ICON_SVG)`);
    }
    
    // ビュー登録
    if (this.needsViewRegistration(config)) {
      steps.push(`registerView('${config.viewRegistration!.viewTypeId}', ${config.viewRegistration!.creatorFunction})`);
    }
    
    // 拡張子登録
    if (this.needsExtensionRegistration(config)) {
      const targetViewType = config.viewType === 'MarkdownView' ? 'markdown' : config.viewRegistration!.viewTypeId;
      steps.push(`registerExtensions([${config.extensions!.list.map(e => `'${e}'`).join(', ')}], '${targetViewType}')`);
    }
    
    // リボンアイコン
    if (this.needsRibbonIcon(config)) {
      steps.push(`addRibbonIcon('${config.ribbonIcon!.iconId}', '${config.ribbonIcon!.title}', ${config.ribbonIcon!.action})`);
    }
    
    // 特殊統合
    switch (config.integration) {
      case 'context-menu':
        steps.push('onFileMenu(setupContextMenu)');
        break;
      case 'markdown-injection':
        steps.push('onWorkspaceEvent("layout-change", ensureMarkdownButtons)');
        steps.push('onWorkspaceEvent("file-open", handleFileOpen)');
        break;
      case 'sidebar-persistent':
        steps.push('ensureSidebarExists()');
        break;
    }
    
    // クリーンアップ
    if (config.needsCleanup) {
      steps.push(`registerCleanup(() => detachLeavesOfType('${config.viewRegistration?.viewTypeId || 'unknown'}'))`);
    }
    
    return steps;
  }
  
  static getViewPattern(domainName: string): 'file-based' | 'markdown-extension' | 'sidebar-item' | 'settings-tab' {
    const config = DOMAIN_CONFIGS[domainName];
    
    switch (config.viewType) {
      case 'FileView':
        return 'file-based';
      case 'MarkdownView':
        return 'markdown-extension';
      case 'ItemView':
        return 'sidebar-item';
      case 'PluginSettingTab':
        return 'settings-tab';
      default:
        throw new Error(`Unknown view type: ${config.viewType}`);
    }
  }
} 