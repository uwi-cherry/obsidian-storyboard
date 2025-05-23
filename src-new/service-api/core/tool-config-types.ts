/**
 * ツール設定の型定義
 */
export interface ToolConfig {
  name: string;
  modulePath: string;
  exportName: string;
  ai_enabled: boolean;
  description: string;
  category: string;
}

/**
 * 全体設定の型定義
 */
export interface RegistryConfig {
  autoRegister: boolean;
  enableLogging: boolean;
  failOnError: boolean;
}

/**
 * tools-config.jsonの型定義
 */
export interface ToolsConfiguration {
  tools: ToolConfig[];
  config: RegistryConfig;
} 