#!/usr/bin/env node
/**
 * Attach domains + keyword tags to each question.
 * Can run standalone on questions.json, or be imported by parse-questions.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Canonical domains shown in the UI */
export const DOMAINS = [
  "Tools",
  "MCP",
  "Subagents",
  "Sessions",
  "Memory/CLAUDE.md",
  "Permissions",
  "Hooks",
  "Skills",
  "Prompting",
  "Architecture",
];

/** Map PDF Domain(s): labels → our taxonomy */
const PDF_DOMAIN_MAP = {
  "Tool Design & MCP Integration": ["Tools", "MCP"],
  "Agentic Architecture & Orchestration": ["Architecture", "Subagents"],
  "Context Management & Reliability": ["Memory/CLAUDE.md", "Sessions"],
  "Prompt Engineering & Structured Output": ["Prompting"],
  "Claude Code Configuration & Workflows": ["Tools", "Skills"],
};

/** Tag extractors: [tag, RegExp] — order matters for display uniqueness */
const TAG_RULES = [
  ["MCP", /\bMCP\b|Model Context Protocol/i],
  ["CLAUDE.md", /\bCLAUDE\.md\b/i],
  ["subagent", /\bsub-?agents?\b/i],
  ["session-resume", /\b(session[- ]?resume|resumeSession|\/resume)\b/i],
  ["session", /\bsessions?\b/i],
  ["hooks", /\bhooks?\b/i],
  ["permissions", /\bpermissions?\b|permissionMode|allowedTools|deny[Ll]ist/i],
  ["skills", /\bskills?\b|Skill tool|\/skill/i],
  ["Bash", /\bBash\b/],
  ["Grep", /\bGrep\b/],
  ["Glob", /\bGlob\b/],
  ["Read", /\bRead\b/],
  ["Write", /\bWrite\b/],
  ["Edit", /\bEdit\b/],
  ["WebFetch", /\bWebFetch\b/],
  ["WebSearch", /\bWebSearch\b/],
  ["TodoWrite", /\bTodoWrite\b/],
  ["AskUserQuestion", /\bAskUserQuestion\b/],
  ["SlashCommand", /\bSlashCommand\b|slash commands?\b/i],
  ["memory", /\b(memory|memories|persistent memory)\b/i],
  ["prompting", /\b(prompt(?:ing)?|system prompt|few-shot)\b/i],
  ["orchestration", /\b(orchestrat\w+|coordinator|multi-agent)\b/i],
  ["tool-use", /\b(tool use|tool_use|built-in tools?)\b/i],
  ["context", /\b(context (?:window|management|budget)|compaction)\b/i],
  ["streaming", /\bstream(?:ing)?\b/i],
  ["sandbox", /\bsandbox(?:ed|ing)?\b/i],
  ["plan-mode", /\bplan mode\b|permissionMode.*plan/i],
];

/** Domain classifiers: domain → predicate on haystack text */
const DOMAIN_RULES = [
  {
    domain: "MCP",
    test: (t) =>
      /\bMCP\b|Model Context Protocol|mcpServers|mcp__|list_mcp/i.test(t),
  },
  {
    domain: "Subagents",
    test: (t) =>
      /\bsub-?agents?\b|Task tool|coordinator agent|multi-agent|delegate(?:s|d| to)/i.test(
        t
      ),
  },
  {
    domain: "Sessions",
    test: (t) =>
      /\b(session[- ]?resume|resumeSession|\/resume|session (?:id|state|history)|continue a session|fork(?:ed)? session)\b/i.test(
        t
      ),
  },
  {
    domain: "Memory/CLAUDE.md",
    test: (t) =>
      /\bCLAUDE\.md\b|\bmemory\b|project memory|auto-?memory|context management|compaction/i.test(
        t
      ),
  },
  {
    domain: "Permissions",
    test: (t) =>
      /\bpermissions?\b|permissionMode|allowedTools|deny[Ll]ist|canUseTool|ask permission|bypassPermissions/i.test(
        t
      ),
  },
  {
    domain: "Hooks",
    test: (t) =>
      /\bhooks?\b|PreToolUse|PostToolUse|Stop hook|Notification hook|UserPromptSubmit/i.test(
        t
      ),
  },
  {
    domain: "Skills",
    test: (t) =>
      /\bskills?\b|Skill tool|\/skill|skill\.md|custom skill/i.test(t),
  },
  {
    domain: "Prompting",
    test: (t) =>
      /\b(prompt(?:ing)?|system prompt|few-shot|structured output|output schema|XML tags in prompts?)\b/i.test(
        t
      ),
  },
  {
    domain: "Architecture",
    test: (t) =>
      /\b(architect(?:ure|ing)|orchestrat\w+|multi-pass|multi-agent|coordinator|agent loop|tool[- ]use loop)\b/i.test(
        t
      ),
  },
  {
    domain: "Tools",
    test: (t) =>
      /\b(built-in tools?|Bash|Grep|Glob|Read|Write|Edit|WebFetch|WebSearch|TodoWrite|AskUserQuestion|tool design|custom tools?)\b/i.test(
        t
      ),
  },
];

function haystack(q) {
  const choiceText = (q.choices || []).map((c) => c.text).join(" ");
  return `${q.stem || ""}\n${q.explanation || ""}\n${choiceText}`;
}

function domainsFromPdfExplanation(explanation) {
  const m = (explanation || "").match(/Domain\(s\):\s*(.+)$/i);
  if (!m) return [];
  const out = new Set();
  for (const raw of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
    const mapped = PDF_DOMAIN_MAP[raw];
    if (mapped) mapped.forEach((d) => out.add(d));
  }
  return [...out];
}

function classifyDomains(q) {
  const text = haystack(q);
  const fromPdf = domainsFromPdfExplanation(q.explanation);
  const fromRules = DOMAIN_RULES.filter((r) => r.test(text)).map((r) => r.domain);
  const merged = [...new Set([...fromPdf, ...fromRules])];
  // Prefer stable order matching DOMAINS
  const ordered = DOMAINS.filter((d) => merged.includes(d));
  if (ordered.length) return ordered;
  // Fallback: Architecture for agent-y stems, else Tools
  if (/\bagent\b/i.test(text)) return ["Architecture"];
  return ["Tools"];
}

const DOMAIN_FALLBACK_TAGS = {
  Tools: "tool-use",
  MCP: "MCP",
  Subagents: "subagent",
  Sessions: "session",
  "Memory/CLAUDE.md": "CLAUDE.md",
  Permissions: "permissions",
  Hooks: "hooks",
  Skills: "skills",
  Prompting: "prompting",
  Architecture: "orchestration",
};

function extractTags(q, domains = []) {
  const text = haystack(q);
  const tags = [];
  for (const [tag, re] of TAG_RULES) {
    if (re.test(text)) tags.push(tag);
  }
  if (!tags.length) {
    for (const d of domains) {
      const fb = DOMAIN_FALLBACK_TAGS[d];
      if (fb && !tags.includes(fb)) tags.push(fb);
    }
  }
  // Cap to keep chips usable
  return tags.slice(0, 8);
}

export function enrichQuestion(q) {
  const { num, ...rest } = q;
  const domains = classifyDomains(q);
  return {
    ...rest,
    domains,
    tags: extractTags(q, domains),
  };
}

export function enrichBank(questions) {
  return questions.map(enrichQuestion);
}

function main() {
  const args = process.argv.slice(2);
  const inputArg = args.find((a) => a.startsWith("--input="))?.slice(8);
  const outputArg = args.find((a) => a.startsWith("--output="))?.slice(9);
  const INPUT = resolve(
    inputArg || resolve(__dirname, "../src/data/questions.json")
  );
  const OUTPUT = resolve(outputArg || INPUT);

  const raw = JSON.parse(readFileSync(INPUT, "utf8"));
  const enriched = enrichBank(raw);
  writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2) + "\n");

  const domainCounts = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
  const tagCounts = new Map();
  for (const q of enriched) {
    for (const d of q.domains) domainCounts[d] = (domainCounts[d] || 0) + 1;
    for (const t of q.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
  }
  console.log(`Enriched ${enriched.length} questions → ${OUTPUT}`);
  console.log("Domains:", domainCounts);
  console.log(
    "Top tags:",
    [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([t, n]) => `${t}:${n}`)
      .join(", ")
  );
  const empty = enriched.filter((q) => !q.domains.length || !q.tags.length);
  console.log(`Empty domains/tags: ${empty.length}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
