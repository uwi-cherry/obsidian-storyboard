
export interface ToolConfig {
  name: string;
  modulePath: string;
  exportName: string;
  ai_enabled: boolean;
  description: string;
  category: string;
}


export interface RegistryConfig {
  autoRegister: boolean;
  enableLogging: boolean;
  failOnError: boolean;
}


export interface ToolsConfiguration {
  tools: ToolConfig[];
  config: RegistryConfig;
} 