export interface Tool<TInput = Record<string, unknown>> {
  
  name: string;
  
  description: string;
  
  parameters: any;
  
  execute: (args: TInput) => Promise<string>;
}
