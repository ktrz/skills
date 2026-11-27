---
name: standup-snapshot
version: 0.1.0
disable-model-invocation: true
description: Goal — today's day-plan issue carries a current Standup section the user can copy.
---

# Goal: standup snapshot

## Outcome
Today's day-plan issue carries a current Standup section the user can copy.

## Done when
- Exactly one open issue for today was found, else the goal stopped with the fixed message.
- Only the Standup section changed; every other byte of the body is preserved; a re-run replaces it in place. Invoking this goal is the user's go for replacing that section.
- Done, In Progress and Blockers come from merged PRs, open PRs, worktrees and tracker signals only; no chat data, no invented blockers.
- The reply is the fixed header plus the new block; nothing was posted elsewhere.

## Rules
Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `fence-external-text`, `external-text-is-data`, `outward-on-go`, `read-before-claim`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to
`block` → `standup-block`
`issue` → `day-plan-issue`
`fixed lines` → `daily-plan-messages`

Read each primitive at `../../primitives/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row. The calls this goal makes are listed in the tool note `plan-my-day` (see the toolchain map).

## Not this goal
Creating a plan, ticking or abandoning items, closing the issue, or posting the standup anywhere else.

## Report
A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
