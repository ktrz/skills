---
name: orchestrate
version: 0.1.0
disable-model-invocation: true
description: Goal — the task is done with this session only decomposing, briefing, judging and synthesizing.
argument-hint: "<task> | <task> using /<goal> | off"
---

# Goal: orchestrate

## Outcome

The task is complete, and everything that was searched, read, written, run or drafted along the way was done by a child agent, so this session's context held only the plan, the briefs, the judgments and the synthesis.

## Done when

- The task is restated in one or two lines and split into independently-runnable chunks, each with explicit boundaries.
- Every search, read, write, run or draft was done by a child on the model and effort the delegation table assigns to that kind of work.
- Each child had one small task it could finish and report on in a single pass, and a brief with the context, the why, what done looks like, and the foreground rule for grandchildren.
- With `using /<goal>`, that goal's done-conditions and rules were met too, and its done-conditions were split into bounded children rather than dispatched whole.
- `off` ended the mode and the user was told so; when the user asked to stop in any phrasing other than `/orchestrate off` or "stop orchestrating", they were told to type `/orchestrate off` or "stop orchestrating" (case-insensitive) so the hook clears the flag.

## Rules

Bound by: `parent-only-judges`, `delegate-by-tier`, `foreground-below-root`, `brief-carries-rules`, `fence-external-text`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. A primitive named by a bound rule is read at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat) and gets a report row. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Doing any chunk yourself because it looks small, or keeping one child alive across steps. Running beside the `orchestrate` skill: when adopted, this goal replaces it, keeping its name and its `/orchestrate off` hook.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
