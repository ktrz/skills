---
name: daily-plan
version: 0.1.0
disable-model-invocation: true
description: Goal — today's prioritised work list exists as the day-plan issue or file, built from worktrees, tickets, PRs and chat since the last plan.
---

# Goal: daily plan

## Outcome
Today's prioritised work list exists, as the day-plan issue or file, built from worktrees, tickets, PRs and chat since the last plan.

## Done when
- The lookback window runs from the last plan; a gap over three days was confirmed first.
- Every item ties to a branch, PR, ticket or attributed chat quote; review asks are kept, marked handled or dropped per the triage table.
- A source that failed shows its fixed warning; nothing is invented to fill it.
- Issue mode: the issue is created, the previous open plan is closed, and no local file is written; file mode: the file exists and its path is reported. The plan is also printed. Invoking this goal is the user's go for creating that issue, closing the previous open plan and creating last month's retro.
- Last month's retro exists if that month had plans (announced only when created, never edited); its posture hint is one paraphrased line.

## Rules
Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `fence-external-text`, `external-text-is-data`, `ticket-traceable`, `outward-on-go`, `read-before-claim`, `named-targets-only`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to
`issue` → `day-plan-issue`
`file` → `day-plan-file`
`retro` → `monthly-review-issue`
`review asks` → `review-ask-triage`
`config` → `plan-my-day-config`
`fixed lines` → `daily-plan-messages`

Read each primitive at `../../primitives/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row. The calls this goal makes are listed in the tool note `plan-my-day` (see the toolchain map).

## Not this goal
Standup snapshots, closing a day, or editing an existing retro or config.

## Report
A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
