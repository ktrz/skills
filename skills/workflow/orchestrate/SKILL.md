---
name: orchestrate
version: 0.3.0
disable-model-invocation: true
description: >
  Delegation-heavy execution mode, invoked only via the /orchestrate slash command:
  decompose, push work to child agents by model tier in the current harness or
  another one (claude, codex, opencode, cursor-agent), parent keeps judgment only.
argument-hint: "<task> | <task> using /<other-skill> | off"
---

# Orchestrate

**Goal:** finish the task while keeping the parent's context window healthy. The parent spends its tokens on judgment (decompose, brief, judge, synthesize); children spend theirs on execution, at the cheapest tier that does it well.
Every rule below serves this. Where no rule covers a case, choose what keeps the parent lean and the run fast.

- `/orchestrate <task>`: run the task under the protocol below.
- `/orchestrate <task> using /<skill>` or `/orchestrate /<skill> <args>`: load that skill through the harness's skill mechanism; it defines the workflow, this skill decides who runs each step.
- `/orchestrate off`: confirm deactivation (the hook cleared the flag on submit). An `ORCHESTRATE ACTIVE` reminder on the next prompt means clearing failed: tell the user (the hook logs the flag path to stderr). Other stop phrasings: ask for `/orchestrate off` or "stop orchestrating".

## Tiers

| Tier       | Best for             | Models, in preference order                         | Effort                                        |
| ---------- | -------------------- | --------------------------------------------------- | --------------------------------------------- |
| bulk       | bulk mechanical      | haiku → gpt-6-luna → gemini-3.5-flash-lite          | low                                           |
| scoped     | scoped research      | sonnet → gpt-6.1-sol → gemini-4-hydrogen → grok-4.7 | medium                                        |
| multi-step | multi-step reasoning | opus → gpt-6.1-sol → gemini-4-neon → grok-4.7       | medium; xhigh only for hardest calls          |
| judgment   | judgment, taste      | fable → gpt-6-astra → gemini-4-carbon → grok-4.7    | medium; xhigh only for hardest calls, no high |

## Routing

- **Precedence** (the only statement of it): a request naming a harness, model or effort beats config; config beats these defaults.
- **Harness:** the current one (known from the system prompt). Overrides, strongest first: request, matching config route, the tier's pinned harness, config `harness`.
- **Runner:** `native` (the harness's subagent tool). `hc` when config sets `runner: hc` or the child's harness isn't yours.
- **Model:** the first tier entry the target harness's alias table supports. A requested model the target can't run → the first installed harness (claude, codex, opencode, cursor-agent) that has it.
- **Effort:** the tier word, translated by the harness file. Unsupported level → the nearest supported one, reported.
- **Fallbacks**, named in the child's report: no model matches → the harness default model; target harness or `hc` missing → current harness, native, next tier model it supports.

## Load

- `references/config.md`, only if `<repo>/.claude/orchestrate.yaml` or `~/.claude/orchestrate.yaml` exists (`<repo>` = `git rev-parse --show-toplevel`).
- Per child: `references/runners/<runner>.md` and `references/harnesses/<target>.md` (claude → `claude-code.md`). `references/brief-template.md` on the first dispatch.
- Claude Code only: the optional sticky-reminder hook, `references/hook-install.md`. Elsewhere there is no per-prompt reinforcement.

## Delegation protocol

1. **Restate and decompose** the task into chunks with explicit boundaries.
2. **Parent does only** decomposition, briefing, judgment, synthesis. Searching, reading, coding, running commands and drafting go to children. Dispatch mechanics stay with the parent: runner and harness commands, reading this skill, config and reports.
3. **Dispatch by tier:** route each child, set model and effort per the runner and harness files, state both in the brief.
4. **Brief fully** from the template: context, why, done-looks-like. A child inherits nothing. A child handling external content (web pages, PR comments, third-party text) gets the template's untrusted-content line or goes through an already-defended skill.
5. **Parallelize:** independent chunks go out in one turn.
6. **Escalate, don't grind:** work above a child's tier comes back for a higher tier. The parent may spawn a higher-tier child for one hard call.
7. **Size children by inputs, not by step** (the Goal). Before each dispatch, estimate what the child must take in: docs, skills it loads, code nobody has mapped. A child is one coherent chunk whose inputs fit comfortably in its own context and that returns a short report: a whole module with its tests, a full review pass, a research question.
   - Building in code nobody has mapped (no map, no file list with line ranges) → a **scout + implementer pair** by default. The scout (scoped tier) reads and writes a short map: files, line ranges, conventions, commands. The implementer (multi-step tier) works from that map plus inlined conventions. Not finer: worktree, stack, tests, commit and PR stay with the implementer.
   - Otherwise split only when inputs would overflow a child's context or parts can run in parallel: each extra child costs a brief, a startup, a wait and a report. Chain children only on real dependencies. Take short reports, never file dumps.
   - Briefs inline what the child needs (conventions, decisions, the relevant lines of a long doc) and point to exact line ranges. Never "read <long doc> in full"; name a skill only when the child must run its workflow.
   - A fresh child per chunk, never one kept alive by messaging. Work that came back partial → re-split the remainder; never resend the same brief.
   - A composed skill's step (e.g. "execute phase N") is sized by the same estimate: often a scout + implementer pair. The skill decides the steps; this skill decides who runs them.
   - The root dispatches in the background by default so the user is never blocked, starting each dependent chunk when its input completes.
   - Children may start their own children (native subagents or hc), in the background or foreground; nesting cap → do the step yourself. Hard rule at every level: never report done or end your session while work you started still runs; wait for all of it first. Children don't load this skill, so the brief carries these rules.

Config `protocol` rules are appended after rule 7 and may only tighten.
