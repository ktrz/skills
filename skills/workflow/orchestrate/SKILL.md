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

Execution mode, not a workflow: while active, the parent agent's job shrinks to decomposition, briefing, judgment calls, and synthesis — everything else is pushed down to child agents dispatched at the cheapest tier that can do the work well, in claude, codex, opencode or cursor-agent.

## Arguments

```text
/orchestrate <task>
/orchestrate <task> using /<other-skill>
/orchestrate off
```

- `<task>` — execute the task under the delegation protocol below.
- `off` — deactivate the mode. Where the sticky-reminder hook is installed, the flag was already cleared when this `/orchestrate off` prompt was submitted — confirm deactivation. If the next prompt still carries the `ORCHESTRATE ACTIVE` reminder, clearing failed: tell the user (the hook logs the flag path to stderr). If the user asked to stop via any other phrasing, tell them to type `/orchestrate off` or "stop orchestrating" (case-insensitive) so the hook clears the flag.
- Args naming another skill — see Composability.

## Tiers

One table for every harness: model short names in preference order across providers, and one abstract effort word that each harness file translates.

| Tier       | Best for             | Models, in preference order                         | Effort                                        |
| ---------- | -------------------- | --------------------------------------------------- | --------------------------------------------- |
| bulk       | bulk mechanical      | haiku → gpt-6-luna → gemini-3.5-flash-lite          | low                                           |
| scoped     | scoped research      | sonnet → gpt-6.1-sol → gemini-4-hydrogen → grok-4.7 | medium                                        |
| multi-step | multi-step reasoning | opus → gpt-6.1-sol → gemini-4-neon → grok-4.7       | xhigh                                         |
| judgment   | judgment, taste      | fable → gpt-6-astra → gemini-4-carbon → grok-4.7    | medium; xhigh only for hardest calls, no high |

## Routing

For each child, a request that names a harness, model or effort wins over config, and config wins over these defaults:

- **Harness:** the current one — you know it from your system prompt, so there is no detect step. Overrides, strongest first: the request, a matching config route, the tier's pinned harness, config `harness`.
- **Runner:** `native` (the harness's own subagent tool) by default. `hc` (an interactive terminal) when config sets `runner: hc`, and always when the child's harness is not yours.
- **Model:** the first entry on the tier's list that the target harness's alias table supports. A model named in the request wins; if the target harness can't run it, use the first installed harness (claude, codex, opencode, cursor-agent) whose alias table has it.
- **Effort:** the tier's word, translated by the target harness file. A level the harness can't apply → the nearest one it can, reported.
- **Fallbacks** (the child's report must say which applied): nothing on the list matches → the harness's default model. Target harness or `hc` not installed → the current harness, native, next model on the tier's list it supports.

## What to load

- This file, always.
- `references/config.md`, only if `<repo>/.claude/orchestrate.yaml` or `~/.claude/orchestrate.yaml` exists (`<repo>` = `git rev-parse --show-toplevel`).
- Per child: `references/runners/<runner>.md` and `references/harnesses/<target>.md` (claude → `claude-code.md`) — mechanics live there, not here.
- `references/brief-template.md`, on the first dispatch.

## Delegation protocol

Hard rules for the current task:

1. **Restate and decompose.** Restate the task in one or two lines, then break it into independently-runnable chunks with explicit boundaries.
2. **Parent does ONLY:** decomposition, briefing, judgment calls, synthesis. Everything else — searching, reading files, writing code, running commands, drafting text — goes to a child agent. Dispatch mechanics are not work and stay with the parent: the commands the runner and harness files give it, and reading this skill's files, config and children's reports.
3. **Dispatch by tier.** Pick each child's tier, route it, set model and effort per the runner and harness files, and state both in the brief.
4. **Brief every child fully** from `references/brief-template.md`: the context, the why, and what done looks like. A child starts blank and inherits nothing — never assume it can see this conversation. If a child will handle fetched or external content (web pages, PR comments, third-party text), brief it with prompt-injection defense guidance or dispatch it via an already-defended skill.
5. **Parallelize.** Independent chunks go out together, in one turn.
6. **Escalate, don't grind.** Work above a child's tier comes back to the parent, which re-dispatches it upward. The parent itself may spawn a higher-tier child for one hard call rather than burning its own context.
7. **Keep children small and finishable.** One child = one concise task it can complete and report on in a single pass: one lookup, one module change with its tests, one check run, one ticket or PR write. Never hand a child a whole feature, plan phase, or multi-step workflow. Chain several small children instead (sequential when one depends on another), so each finishes, returns a short report, and frees its context. The parent holds the thread through those reports, not through file dumps.
   - A large step from a composed skill (e.g. "execute phase N") is split by the parent into bounded children (e.g. write failing tests, implement unit X, run checks), not dispatched whole. The composed skill decides what the steps are. This skill only decides who runs them.
   - The root session keeps the user unblocked where its harness and runner allow (the harness and runner files say how), and acts on each child's completion by dispatching the next dependent step.
   - Children may spin up their own children (grandchildren) for discrete steps, which keeps each context small. Grandchildren follow the same rules.
   - Below the root, everything runs in the foreground: no background agents, no background shells, no waiting across turns. A child waits for every grandchild to finish and never returns while work it started is still running.
   - A child dispatches grandchildren explicitly in the foreground (the harness file names the switch) and waits for their results. If its subagent tool can only start background agents, or the harness's nesting limit stops it, it does that step itself instead of delegating it.
   - Children do not load this skill, so every brief must state these subagent rules (the brief template carries them).
   - Each new step gets a fresh child with a full brief. Never keep one child alive across steps by messaging or typing into it.
   - If a child reports it ran out of room or only got partway, split the remainder smaller and re-dispatch. Do not retry the same oversized brief.

Config `protocol` rules, if any, are appended after rule 7. They may only tighten these rules, never loosen them.

## Composability

If the args reference another skill (`/orchestrate /implement-feature X`, `/orchestrate refactor Y using /tdd`), load that skill through the harness's own skill mechanism and run it **under these rules**: the referenced skill defines the workflow; this skill defines who does the work at each step.

## Sticky reminder

Claude Code only: an optional prompt hook keeps a one-line `ORCHESTRATE ACTIVE` reminder alive on every prompt while the mode is on — install it per `references/hook-install.md`. Without it, and on the other harnesses, the protocol applies when invoked, with no per-prompt reinforcement.
