export interface PositionalArg {
  name: string;
  required: boolean;
  description: string;
}

export interface CommandOption {
  flag: string;
  valueName?: string;
  description: string;
  required: boolean;
  allowedValues?: readonly string[];
  defaultValue?: string;
}

export interface CommandExample {
  command: string;
  description: string;
}

export interface CommandDefinition {
  name: string;
  summary: string;
  usage: string;
  positionalArgs: PositionalArg[];
  options: CommandOption[];
  examples: CommandExample[];
  successBehavior: string[];
  sideEffects: string[];
  failureCases: string[];
  exitBehavior: { success: string; failure: string };
}
