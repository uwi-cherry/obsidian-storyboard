export interface Tool<TInput = Record<string, unknown>, TOutput = string> {
  
  name: string;
  
  description: string;
  
  parameters: Record<string, unknown>;
  
  execute: (args: TInput) => Promise<TOutput>;
}
