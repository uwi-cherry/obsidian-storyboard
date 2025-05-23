export interface Tool<TInput = Record<string, unknown>> {
  /** Unique function name (<50 chars, snake_case) */
  name: string;
  /** Natural-language description presented to the model */
  description: string;
  /** JSON-Schema describing `args` */
  parameters: any;
  /** Actual implementation */
  execute: (args: TInput) => Promise<string>;
}
