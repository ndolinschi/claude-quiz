import type { Domain } from "@/data/types";

export type GuideLink = {
  title: string;
  what: string;
  href: string;
};

export type GuideSection = {
  domain: Domain;
  blurb: string;
  links: GuideLink[];
};

/** URLs below were fetched and returned the named doc (not 404) on 2026-09-18. */
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    domain: "Tools",
    blurb:
      "Built-in tools the agent loop can call: read and edit files, search by name or content, and run shell commands.",
    links: [
      {
        title: "Tools reference",
        what: "Glob sorts by modification time (capped at 100). Edit requires a unique old_string, or replace_all. Grep searches content; Glob searches names.",
        href: "https://code.claude.com/docs/en/tools",
      },
      {
        title: "CLI reference",
        what: "-p is --print (non-interactive). --json-schema validates JSON output in print mode. --resume continues a saved session.",
        href: "https://code.claude.com/docs/en/cli-reference",
      },
    ],
  },
  {
    domain: "MCP",
    blurb:
      "Model Context Protocol servers add tools and documents the agent does not have built in.",
    links: [
      {
        title: "Claude Code MCP",
        what: "Add servers with claude mcp add (stdio, HTTP, SSE). Project servers live in .mcp.json. /mcp shows status. Resources are @-mentioned; tool search defers big tool lists.",
        href: "https://code.claude.com/docs/en/mcp",
      },
      {
        title: "MCP resources",
        what: "Resources are the primitive for static or templated documents (resources/list, resources/read). Tools are model-invoked actions. Transports only move the messages.",
        href: "https://modelcontextprotocol.io/specification/2026-07-28/server/resources",
      },
    ],
  },
  {
    domain: "Subagents",
    blurb:
      "A subagent runs a focused task in its own context and returns one result to the parent.",
    links: [
      {
        title: "Subagents",
        what: "Each subagent starts fresh and does not see the parent transcript, unless you fork. The parent passes a delegation message. Use the tools field to narrow what that agent can call.",
        href: "https://code.claude.com/docs/en/subagents",
      },
    ],
  },
  {
    domain: "Sessions",
    blurb:
      "Sessions keep the transcript so you can resume, compact, or clear without losing files on disk.",
    links: [
      {
        title: "Manage sessions",
        what: "--resume / /resume continues a session. /compact summarizes history. /clear starts an empty context; prior files and git state stay. You can fork a session to branch.",
        href: "https://code.claude.com/docs/en/sessions",
      },
      {
        title: "Context window",
        what: "Context fills with every tool result. Delegate large reads to a subagent. Compact before a long new task; clear when you switch tasks.",
        href: "https://code.claude.com/docs/en/context-window",
      },
      {
        title: "Built-in commands",
        what: "/diff shows uncommitted and per-turn changes. /theme sets the CLI theme. /status is account and model info, not a file list.",
        href: "https://code.claude.com/docs/en/commands",
      },
    ],
  },
  {
    domain: "Memory/CLAUDE.md",
    blurb:
      "CLAUDE.md and rules are instructions Claude reads at startup. They guide; they do not enforce.",
    links: [
      {
        title: "Memory",
        what: "Import other files with @path (imports still load at launch). .claude/rules/ can be path-scoped so they load only when a matching file is read. /memory lists what loaded.",
        href: "https://code.claude.com/docs/en/memory",
      },
    ],
  },
  {
    domain: "Permissions",
    blurb:
      "Permission rules and the Bash sandbox decide what actually runs. Prompts cannot override a deny.",
    links: [
      {
        title: "Permissions",
        what: "Deny rules beat allow rules. Read(.env) and Edit(archive/**) use gitignore-style paths. There is no .claudeignore file. A ! prefix can carve a path out of a deny in the same file.",
        href: "https://code.claude.com/docs/en/permissions",
      },
      {
        title: "Sandboxing",
        what: "The Bash sandbox is OS-level filesystem and network isolation for shell commands. Read, Edit, and Write still follow permission rules, not the sandbox.",
        href: "https://code.claude.com/docs/en/sandboxing",
      },
    ],
  },
  {
    domain: "Hooks",
    blurb:
      "Hooks run your code at lifecycle points. Only some events can stop a tool.",
    links: [
      {
        title: "Hooks",
        what: "PreToolUse runs before a tool executes and can deny it (permissionDecision or exit code 2). PostToolUse runs after success and can add context or replace output. It cannot undo a call that already ran.",
        href: "https://code.claude.com/docs/en/hooks",
      },
      {
        title: "Agent SDK hooks",
        what: "Register callbacks on options.hooks. PreToolUse deny uses hookSpecificOutput.permissionDecision. PostToolUse uses updatedToolOutput or additionalContext.",
        href: "https://code.claude.com/docs/en/agent-sdk/hooks",
      },
    ],
  },
  {
    domain: "Skills",
    blurb:
      "A skill is a SKILL.md workflow. You invoke it with /name, or Claude loads it when it fits.",
    links: [
      {
        title: "Skills",
        what: "Project skills live in .claude/skills/<name>/SKILL.md and can be committed. Custom commands in .claude/commands/ still work; skills are the current format. The body loads only when invoked.",
        href: "https://code.claude.com/docs/en/skills",
      },
    ],
  },
  {
    domain: "Prompting",
    blurb:
      "Prompts, examples, and schemas shape output. They are not a substitute for hooks or permission denies.",
    links: [
      {
        title: "Prompt engineering overview",
        what: "Start from success criteria, then examples, structure, and chaining. Not every failure is a prompt problem.",
        href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
      },
      {
        title: "Messages API",
        what: "tool_choice any forces a tool call. tool_choice auto may return text. A tool_result is sent back in a user message, not a tool role.",
        href: "https://docs.anthropic.com/en/api/messages",
      },
      {
        title: "Prompt caching",
        what: "Default cache TTL is 5 minutes. The maximum TTL is 1 hour (ttl: 1h), at a higher write price.",
        href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
      },
    ],
  },
  {
    domain: "Architecture",
    blurb:
      "The agent loop plans, calls tools, and stops. The SDK runs that loop; you set tools, turns, and budget.",
    links: [
      {
        title: "Agent SDK overview",
        what: "The SDK is Claude Code as a library: tools, hooks, subagents, MCP, permissions, sessions, and skills.",
        href: "https://code.claude.com/docs/en/agent-sdk/overview",
      },
      {
        title: "Agent loop",
        what: "stop_reason tool_use means you run the tool and return a tool_result. Cap the loop with maxTurns and maxBudgetUsd. allowedTools auto-approves; it does not remove tools. disallowedTools and a subagent tools list do.",
        href: "https://code.claude.com/docs/en/agent-sdk/agent-loop",
      },
      {
        title: "Message Batches API",
        what: "Batches are 50% off and usually finish within an hour, with a 24-hour cap. They support tool use and multi-turn messages. Each request is independent; a paused server-tool turn is continued with a follow-up request. Limit: 100,000 requests or 256 MB.",
        href: "https://docs.anthropic.com/en/docs/build-with-claude/batch-processing",
      },
    ],
  },
];
