---
name: daily-plan-configured
version: 0.1.0
disable-model-invocation: true
description: Goal — `~/.claude/plan-my-day.yaml` exists, confirmed by the user, and the tracker config is seeded or deliberately left.
---

# Goal: daily plan configured

## Outcome
`~/.claude/plan-my-day.yaml` exists, confirmed by the user, and the tracker config is seeded or deliberately left.

## Done when
- An existing config was shown and edited, replaced or kept by the user's choice; an existing tracker config was rewritten only after the second confirmation.
- Every repo entry has a path git resolves, an `org/repo`, a confirmed branch format and a short name.
- Tracker fields were validated where possible; a failed validation or missing GitHub auth is a warning, not a stop.
- Every user value is double-quoted and escaped; no tracker block is in the plan config.
- The generated files were shown, confirmed, and the fixed closing line printed.

## Rules
Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `named-targets-only`, `fence-external-text`, `external-text-is-data`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to
`config` → `plan-my-day-config`
`tracker config` → `tracker-config`
`fixed lines` → `daily-plan-messages`

Read each primitive at `../../primitives/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row. The calls this goal makes are listed in the tool note `plan-my-day` (see the toolchain map).

## Not this goal
Generating a plan, per-repo tracker overrides, or any change to the tracker beyond the shared config.

## Report
A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
