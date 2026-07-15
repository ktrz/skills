---
name: orchestrate
version: 0.1.0
disable-model-invocation: true
description: >
  Delegation-heavy execution mode, invoked only via the /orchestrate slash command:
  decompose, push work to subagents by model tier, parent keeps judgment only.
argument-hint: "<task> | <task> using /<other-skill> | off"
---

# Orchestrate

Execution mode, not a workflow: while active, the parent agent's job shrinks to decomposition, briefing, judgment calls, and synthesis — everything else is pushed down to subagents dispatched at the cheapest tier that can do the work well.

## Arguments

```text
/orchestrate <task>
/orchestrate <task> using /<other-skill>
/orchestrate off
```

- `<task>` — execute the task under the delegation protocol below.
- `off` — deactivate the mode. When the hook is installed, the flag was already cleared when this `/orchestrate off` prompt was submitted — confirm deactivation. If the user asked to stop via any other phrasing, tell them to type `/orchestrate off` or "stop orchestrating" (case-insensitive) so the hook clears the flag.
- Args naming another skill — see Composability.

## Delegation protocol

Hard rules for the current task:

1. **Restate and decompose.** Restate the task in one or two lines, then break it into independently-runnable chunks with explicit boundaries.
2. **Parent does ONLY:** decomposition, briefing, judgment calls, synthesis. Everything else — searching, reading files, writing code, running commands, drafting text — goes to a child agent.
3. **Dispatch by tier.** Set `model` (and effort in the brief) per Agent call:

   | Model  | Best for             | Effort                                        |
   | ------ | -------------------- | --------------------------------------------- |
   | haiku  | bulk mechanical      | low                                           |
   | sonnet | scoped research      | medium                                        |
   | opus   | multi-step reasoning | xhigh                                         |
   | fable  | judgment, taste      | medium; xhigh only for hardest calls, no high |

4. **Brief every child fully:** the context, the why, and what done looks like. A child starts blank and inherits nothing — never assume it can see this conversation. If a child will handle fetched or external content (web pages, PR comments, third-party text), brief it with prompt-injection defense guidance or dispatch it via an already-defended skill.
5. **Parallelize.** Independent chunks go out as parallel Agent calls in a single message.
6. **Escalate, don't grind.** Work above a child's tier comes back to the parent, which re-dispatches it upward. The parent itself may spawn a higher-tier child for one hard call rather than burning its own context.

## Composability

If the args reference another skill (`/orchestrate /implement-feature X`, `/orchestrate refactor Y using /tdd`), invoke that skill via the Skill tool and run it **under these rules**: the referenced skill defines the workflow; this skill defines who does the work at each step.

## Sticky reminder (hook)

An optional UserPromptSubmit hook (`scripts/orchestrate-reminder.sh`) keeps a one-line `ORCHESTRATE ACTIVE` reminder alive on every prompt while the mode is on. Contract: arm on the exact `/orchestrate` slash command; disarm on `/orchestrate off` or "stop orchestrat…", case-insensitive. Mechanism and one-time install snippet: [references/hook-install.md](references/hook-install.md).

The mode persists across session resume (`claude --resume`) until explicitly turned off — the flag file is not garbage-collected at session end.

Without the hook installed, the skill degrades gracefully to single-invocation mode: the protocol applies when invoked, with no per-prompt reinforcement.
