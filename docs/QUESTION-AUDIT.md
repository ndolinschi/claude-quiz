# Question audit

Date: 2026-09-18 (Europe/Chisinau). Branch: quiz-audit. Source of truth: official docs fetched that day, not the PDF answer key.

## Counts

- Questions in `src/data/questions.json`: 1078
- Answer keys changed: 18
- Thin items (empty or under 80 characters, including "Correct.") that received a real explanation: 98
- Of those, explanation-only (key kept): 80
- Choice-text or stem repairs (parser merges and non-features such as .claudeignore / Monitor): 26
- Longer explanations that only lost a broken Refer-to URL: 56
- Docs guide links (verified pages): 20

## Docs checked (fetched, not 404)

- https://code.claude.com/docs/en/permissions (no .claudeignore; Read/Edit deny; `!` negation in the same file; launch directory is the working directory; PreToolUse exit 2 blocks before rules; CLAUDE.md does not enforce)
- https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching (default TTL 5 minutes; maximum 1 hour)
- https://docs.anthropic.com/en/docs/build-with-claude/batch-processing (50% price; most batches under 1 hour; expire at 24 hours; cap 100,000 requests or 256 MB; tool use and multi-turn messages; server-side agentic loop; pause_turn continued with a follow-up request; each request independent)
- Guide URLs in `src/data/guide.ts` were fetched earlier the same day and returned the named pages: tools, CLI, commands, MCP, MCP resources, subagents, sessions, context window, memory, permissions, sandboxing, hooks, Agent SDK hooks, skills, prompt engineering overview, Messages API, prompt caching, Agent SDK overview, agent loop, batches.

## Answer keys changed

- `s1-q17` C → D. Edit uniqueness is a longer old_string or replace_all, not a full Write rewrite (tools reference).
- `s1-q18` C → B. PostToolUse runs after the tool succeeds and cannot block process_refund. Among listed options only a separate verification gate can withhold the refund.
- `s1-q19` C → B. PostToolUse does not run before execution. Restrict the subagent tools list / disallowedTools instead.
- `s1-q21` C → B. Filling a research gap is a new delegation. A fork copies the whole transcript; it is for branching, not a targeted gap fill.
- `s1-q29` D → B. PostToolUse cannot prevent process_refund from executing. Sequence the calls in orchestration, or use PreToolUse (not listed).
- `s2-q23` D → E. Parser had merged the real choice E into D. The customer already asked for a human; call escalate_to_human.
- `s2-q27` C → A. Batches support tool use and multi-turn messages. The documented limit is async processing with a 24-hour expiration.
- `s3-q27` D → B. 'All of the above' includes skipping validation. Verify generated files by running checks with Bash.
- `s4-q26` B → D. The batch worker runs the server-side agentic loop and accepts multi-turn messages. 'You cannot use the loop' is false.
- `s4-q27` B → D. Batches do support tool use. A hard limit is 100,000 requests or 256 MB.
- `s4-q28` A → C. Style lives in repo files or CLAUDE.md. Find the file with Glob; do not invent an MCP server for it.
- `s4-q29` B → A. @path imports do not isolate per subagent. Role rules belong in that agent's own prompt.
- `s4-q30` D → B. Resume reloads the same history. A full window needs compaction or a fresh session with a summary of findings.
- `s5-q29` C → B. Conversation history is not a cache. Repeat lookups should be cached in the tool or MCP server.
- `s7-q26` B → D. Loading every full contract fills context and cost. Split work across subagents (context window / subagents).
- `s10-q25` A → C. /status is version and account. Per-turn file changes are /diff, not `claude status`.
- `s10-q30` A → D. 5 minutes is the default cache TTL. The maximum is 1 hour.
- `s4-q24` C → B. All three includes asking the user. Read the ORM model files that define the schema (tools reference).

## Thin items that only got an explanation

`s1-q1`, `s1-q13`, `s1-q14`, `s1-q15`, `s1-q20`, `s1-q22`, `s1-q23`, `s1-q24`, `s1-q25`, `s1-q26`, `s1-q27`, `s1-q28`, `s1-q30`, `s2-q1`, `s2-q14`, `s2-q15`, `s2-q17`, `s2-q18`, `s2-q19`, `s2-q20`, `s2-q21`, `s2-q22`, `s2-q24`, `s2-q25`, `s2-q26`, `s2-q28`, `s2-q29`, `s2-q30`, `s3-q23`, `s3-q24`, `s3-q25`, `s3-q26`, `s3-q28`, `s3-q29`, `s3-q30`, `s4-q18`, `s4-q19`, `s4-q20`, `s4-q21`, `s4-q22`, `s4-q23`, `s4-q25`, `s5-q27`, `s5-q28`, `s5-q30`, `s6-q23`, `s6-q24`, `s6-q25`, `s6-q26`, `s6-q27`, `s6-q28`, `s6-q29`, `s6-q30`, `s7-q23`, `s7-q24`, `s7-q25`, `s7-q27`, `s7-q28`, `s7-q29`, `s7-q30`, `s8-q27`, `s8-q28`, `s8-q29`, `s8-q30`, `s9-q28`, `s9-q29`, `s9-q30`, `s10-q24`, `s10-q26`, `s10-q27`, `s10-q28`, `s10-q29`, `s11-q30`, `s12-q25`, `s12-q26`, `s12-q27`, `s12-q28`, `s12-q29`, `s12-q30`, `s17-q30`

## Choice or stem repairs

- s1-q19 B rewritten: tools / disallowedTools, not allowedTools-removes-tools
- s1-q30 D restored to the real E text (errorCategory); leaked 'Incorrect' sentence removed. Key stays A
- s2-q23 dropped duplicated stem as choice A; restored choice E. Key D to E
- s3-q23 A rewritten to the subagent tools field
- s3-q40 D rewritten off allowedTools. Key stays D
- s4-q25 stripped trailing 'E Correct...' from choice D. Key stays D
- s7-q24 A rewritten from .claudeignore to Read deny. Key stays A
- s8-q29 D rewritten to Edit(archive/**). Key stays D
- s8-q30 B rewritten: /mcp and /config, not claude config. Key stays B
- s8-q35 D rewritten to Read deny. Key stays D
- s8-q58 stem and C rewritten to Read deny patterns. Key stays C
- s9-q19 B rewritten: narrow reads and compact, not .claudeignore. Key stays B
- s9-q30 B rewritten to maxTurns / maxBudgetUsd. Key stays B
- s9-q43 B rewritten off the Monitor class. Key stays B
- s9-q45 stem and B rewritten to Read deny patterns. Key stays B
- s10-q15 D rewritten to Read deny. Key stays D
- s10-q20 C rewritten: Grep skips gitignore, Glob does not by default. Key stays C
- s10-q25 C rewritten to /diff. Key A to C
- s10-q26 C rewritten from 'Tools and Transports' to Resources. Key stays C
- s10-q48 B rewritten to the Grep/Glob/Read split. Key stays B
- s11-q17 stem and C rewritten: ! negation is a permission rule, not .claudeignore. Key stays C
- s11-q20 C rewritten to Read(tests/**/*.dat). Key stays C
- s11-q40 stem and A rewritten to Read(**/*.log) and Read(build/**). Key stays A
- s12-q26 A rewritten to permissions.deny. Key stays A
- s12-q27 B rewritten: -p is --print, not --project, and does not scope to the diff. Key stays B
- s17-q30 choice A was the question text; moved into the stem. Old E (copy JSONL) is now choice A. Key stays D

## .claudeignore

The permissions page documents deny rules (`Read(./.env)`, `Edit(archive/**)`), not a `.claudeignore` file. Every item whose marked choice was that file was rewritten to the real control and the key was kept, except where the table above already changed the key. Distractors may still mention the name so the wrong option stays wrong.

Items whose explanations only dropped a broken `docs.anthropic.com/.../claude-code` or Google-search citation (keys not re-judged in this pass):

`s7-q3`, `s7-q8`, `s7-q11`, `s7-q12`, `s7-q14`, `s7-q31`, `s7-q38`, `s7-q40`, `s7-q44`, `s7-q52`, `s8-q4`, `s8-q10`, `s8-q34`, `s8-q40`, `s8-q44`, `s8-q53`, `s8-q59`, `s9-q5`, `s9-q10`, `s9-q22`, `s9-q24`, `s9-q35`, `s9-q37`, `s9-q41`, `s9-q51`, `s9-q59`, `s10-q5`, `s10-q31`, `s10-q38`, `s10-q51`, `s10-q52`, `s11-q2`, `s11-q5`, `s11-q6`, `s11-q8`, `s11-q11`, `s11-q21`, `s11-q34`, `s11-q35`, `s11-q47`, `s11-q51`, `s12-q5`, `s12-q9`, `s12-q10`, `s12-q13`, `s12-q15`, `s12-q17`, `s12-q35`, `s12-q37`, `s12-q42`, `s12-q44`, `s12-q48`, `s12-q50`, `s12-q53`, `s12-q56`, `s12-q59`

## Long explanations sampled and left as-is

At least three long items per domain were read. Keys below were not flipped. Hooks, permissions, tools, subagents, MCP, skills, architecture, sessions, memory, and prompting are each represented.

- Tools `s1-q2` key D. Resume does not push a new scope into subagents; the parent must say it on the next delegation. Sessions + subagents.
- Tools `s18-q59` key C. Plan mode is read-only and adds a pass. A small known edit can be asked directly. Permissions, plan mode.
- Tools `s1-q25` key D. Glob is sorted by modification time and capped at 100. Tools reference. (thin, key kept)
- Subagents `s18-q54` key A. Parallel subagents take distinct slices and return short findings. Subagents, parallel research.
- Subagents `s1-q14` key A. Non-fork subagents do not inherit the parent transcript. Subagents, startup. (thin, key kept)
- Subagents `s12-q25` key A. VIP status only in the parent turn is invisible. Subagents, fresh context. (thin, key kept)
- MCP `s1-q37` key A. stop_reason tool_use means run the tool and return a tool_result. Agent loop.
- MCP `s10-q26` key C. Resources, not Tools or Transports. MCP resources spec. Choice text repaired.
- MCP `s5-q29` key B. Cache in the server, not in the transcript. Context cost. Key changed.
- Sessions `s2-q3` key A. A tool input schema is stronger than prompt-only JSON. Messages API.
- Sessions `s2-q4` key C. Retries do not invent facts that were never in the input. Judgment, no doc contradiction.
- Sessions `s1-q13` key C. Resume restores the full transcript and fills the window again. Sessions. (thin, key kept)
- Memory/CLAUDE.md `s2-q48` key A. Few-shot examples for edge cases. Prompt engineering. Domain tag is memory; the claim is prompting and is not contradicted.
- Memory/CLAUDE.md `s2-q49` key C. Explicit testable criteria beat 'check for security issues'. Prompt engineering.
- Memory/CLAUDE.md `s1-q20` key D. @path imports. The choice says @import; the real syntax is @path/to/file, and imports still load at launch. Key kept, explanation names the syntax. Memory.
- Permissions `s7-q35` key C. PreToolUse can block transfer_funds on the amount. Hooks + permissions.
- Permissions `s12-q36` key B. Same interceptor pattern for a $200 gate.
- Permissions `s16-q16` key B. The app returns tool_result, including structured errors. Messages API / agent loop.
- Hooks `s7-q22` key C. PreToolUse blocks a refund over $500. Hooks.
- Hooks `s8-q7` key C. Exit code 2 blocks. Hooks. Fake URL stripped only.
- Hooks `s17-q35` key B. CI rule lives in a PreToolUse hook, not the prompt.
- Skills `s15-q42` key B. Migrate a command to .claude/skills/<name>/SKILL.md. Skills. Legacy commands still work.
- Skills `s12-q6` key A. Overnight high volume is the Message Batches API at 50%. Batches. (also tagged Skills)
- Skills `s7-q23` key D. Project skill path .claude/skills/. Skills. (thin, key kept)
- Prompting `s2-q11` key A. Schema should carry confidence and source. Structured output judgment, not contradicted.
- Prompting `s2-q12` key C. Conflicts stay in the schema instead of being silently dropped.
- Prompting `s2-q1` key C. tool_choice any forces a tool. Messages API. (thin, key kept)
- Architecture `s7-q5` key C. Larger models are the usual choice for a wide tool surface. Anthropic agent guidance, not a Claude Code contradiction.
- Architecture `s7-q33` key C. Escalate when confidence is low. Pattern, not a wrong key.
- Architecture `s7-q49` key D. Independent flight lookups can be parallel tool calls in one turn. Agent loop.

## Not claimed

- The other ~900 long explanations were not re-keyed. A pattern scan covered PostToolUse-before-execute, 'no multi-turn batches', `.claudeignore` as the marked answer, a Monitor class for budgets, and a 5-minute maximum cache TTL. Those patterns were fixed where the marked choice taught them.
- s10-q60 (`error.type` retry) was not checked against an errors page and was not changed.
- s4-q26 D still says 'full multi-turn agentic loops'. The batches page does run a server-side agentic loop and accepts multi-turn messages, so D is the true option next to B. The explanation says a `pause_turn` result needs a follow-up request and that each request stays independent.
- s2-q27 A says the window 'requires' 24 hours. Most batches finish in under an hour; 24 hours is the expiration. A is the listed constraint. The explanation says so.


## Second pass — 2026-09-18

Pattern scan covered all 1,078 items again. This pass did not re-read every stem. Concrete checks used pages fetched this pass:

- https://code.claude.com/docs/en/hooks (command hooks get JSON on stdin; `tool_input.command`; exit 2 blocks PreToolUse; PostToolUse exit 2 does not undo a call that already ran; no `CLAUDE_TOOL_NAME`)
- https://code.claude.com/docs/en/agent-sdk/agent-loop (`allowedTools` auto-approves only; `maxTurns` / `maxBudgetUsd`; PostToolUse cannot block)
- Subagents and permissions pages (search, same day): `AgentDefinition.tools` and a bare `disallowedTools` name remove tools. `allowedTools` does not. The spawn tool is `Agent`; `Task` remains a documented alias, so Task-named keys were left.

### New key flips

- `s2-q37` A → C. The stem configures `allowedTools`. That list does not make other tools fail at runtime. Doc: agent loop, tool permissions.
- `s7-q3` C → A. The marked snippet used `CLAUDE_TOOL_NAME` / `CLAUDE_TOOL_ARG_COMMAND`, which the hooks reference does not define. A is the PreToolUse block. Doc: hooks.
- `s15-q9` D → E. Parser had merged choice E (and "Answer: E") into D. E keeps execution errors as `isError` tool results with retry metadata. D's JSON-RPC codes are for protocol errors.

### Choice repairs, key kept

- `s2-q16`, `s2-q31`, `s2-q44`, `s4-q12`, `s5-q46`: marked text now says `tools` / `disallowedTools`, not that `allowedTools` removes tools.
- `s9-q51` B rewritten to read `.tool_input.command` from stdin and `exit 2`. No other choice was the real hook.
- `s15-q9` restored choice E; B was leaked commentary and is now a short wrong option.

### Pattern scan vs full read

- Scanned every item for `.claudeignore` as the marked control, PostToolUse blocking, batches-cannot-use-tools, 5-minute max cache TTL, `/status` shows the diff, `allowedTools` removes tools, a Monitor class, blank or "Correct." explanations, Refer-to / Google-search citations, and parser-merged choices.
- Zero remaining marked hits for ignore-as-feature, PostToolUse-blocks, batch-cannot-tools, 5-minute maximum TTL, status-shows-diff, Monitor class, or thin explanations.
- 299 explanations lost a trailing `Refer to` URL or a quoted `Search for "…"`. Teaching text before that tail was kept. `s1-q9` style "search for import statements" was not cut.
- Fully read this pass: the `allowedTools` cluster (`s2-q16`, `s2-q31`, `s2-q37`, `s2-q44`, `s4-q12`, `s5-q46`), the hook-snippet pair (`s7-q3`, `s9-q51`), and the merged `s15-q9`. Sets were not opened item-by-item. Judgment and scenario keys were left unless a fetched page contradicted the marked choice.

### Still uncertain

- `Task` vs `Agent`: docs still call `Task(...)` an alias. Keys that say Task were not flipped.
- Cache minimum token counts, `error.type` (`s10-q60`), and model output limits were not re-fetched.
- Most long scenario keys in sets 13–18 were pattern-scanned, not re-keyed.
