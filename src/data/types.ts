export type Choice = {
  key: string;
  text: string;
};

export type Domain =
  | "Tools"
  | "MCP"
  | "Subagents"
  | "Sessions"
  | "Memory/CLAUDE.md"
  | "Permissions"
  | "Hooks"
  | "Skills"
  | "Prompting"
  | "Architecture";

export type Question = {
  id: string;
  set: number;
  stem: string;
  choices: Choice[];
  answer: string;
  explanation: string;
  domains: Domain[];
  tags: string[];
};
