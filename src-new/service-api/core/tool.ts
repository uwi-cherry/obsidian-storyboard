export interface Tool<TInput = Record<string, unknown>> {
  
  name: string;
  
  description: string;
  
  parameters: Record<string, unknown>;
  
  execute: (args: TInput) => Promise<string>;
}
