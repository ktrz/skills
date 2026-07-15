---
name: orchestrate
version: 0.1.0
description: >
  Delegation-heavy execution mode. Wrap any task to make the parent delegate hard:
  decompose, push work to subagents by model tier, parent keeps judgment only.
  Use when the user says "orchestrate", "orchestrate this", "delegate hard",
  "/orchestrate <task>", or prefixes a task with "orchestrate:".
argument-hint: "<task> | <task> using /<other-skill> | off"
---

# Orchestrate

Execution mode, not a workflow: while active, the parent agent's job shrinks to decomposition, briefing, judgment calls, and synthesis — everything else is pushed down to subagents dispatched at the cheapest tier that can do the work well. Instructions are injected exactly at invocation (no reliance on ambient CLAUDE.md pickup), and an optional UserPromptSubmit hook keeps a one-line reminder alive on every subsequent prompt so the mode survives long sessions.

## Arguments

```
/orchestrate <task>
/orchestrate <task> using /<other-skill>
/orchestrate off
```

- `<task>` — execute the task under the delegation protocol below.
- `off` — deactivate the mode. Tell the user the sticky-reminder flag clears on their **next** prompt (the hook processes `/orchestrate off` when that prompt is submitted).
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

4. **Brief every child fully:** the context, the why, and what done looks like. A child starts blank and inherits nothing — never assume it can see this conversation.
5. **Parallelize.** Independent chunks go out as parallel Agent calls in a single message.
6. **Escalate, don't grind.** Work above a child's tier comes back to the parent, which re-dispatches it upward. The parent itself may spawn a higher-tier child for one hard call rather than burning its own context.

## Composability

If the args reference another skill (`/orchestrate /implement-feature X`, `/orchestrate refactor Y using /tdd`), invoke that skill via the Skill tool and run it **under these rules**: the referenced skill defines the workflow; this skill defines who does the work at each step.

## Sticky reminder (hook)

Skill instructions injected at invocation fade as a session grows. The optional `scripts/orchestrate-reminder.sh` UserPromptSubmit hook fixes that: when a prompt starts with `/orchestrate` or `orchestrate:` it touches a flag file keyed by the session id (under `${ORCHESTRATE_STATE_DIR:-${TMPDIR:-/tmp}}`), and while the flag exists it prepends a one-line `ORCHESTRATE ACTIVE` reminder to every prompt. `/orchestrate off` or `stop orchestrating` clears the flag. When off, the hook prints nothing and costs zero context. It never blocks a prompt — every failure path exits 0 silently.

Without the hook installed, the skill degrades gracefully to single-invocation mode: the protocol applies when invoked, with no per-prompt reinforcement.

### Install the hook

One-time manual step — merge this into `~/.claude/settings.json` (a future plugin packaging of this repo will make the hook auto-register instead):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/skills/orchestrate/scripts/orchestrate-reminder.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

The path assumes the skill is installed (symlinked) at `~/.claude/skills/orchestrate/`. Requires `jq`.
