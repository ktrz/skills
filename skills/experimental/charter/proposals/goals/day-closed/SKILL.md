---
name: day-closed
version: 0.1.0
disable-model-invocation: true
description: Goal — today's day-plan issue is closed with shipped items ticked and abandoned ones recorded.
---

# Goal: day closed

## Outcome
Today's day-plan issue is closed with shipped items ticked and abandoned ones recorded.

## Done when
- The issue was selected by the none / one / several-open / already-closed cases of `daily-plan-messages` (`close.*`); an already closed issue was refused, never reopened.
- The Standup section was refreshed first.
- A box was ticked only on exact ticket-key or exact label match, in the four sections `day-plan-issue` lists for scanning.
- Remaining items were listed and the user said which were abandoned; those sit under `## Not done`; the rest stay unticked.
- The issue is closed and the fixed summary line printed; tomorrow's plan and the retro are untouched. Invoking this goal is the user's go for closing that issue.

## Rules
Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `fence-external-text`, `external-text-is-data`, `outward-on-go`, `read-before-claim`, `named-targets-only`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to
`issue` → `day-plan-issue`
`block` → `standup-block`
`fixed lines` → `daily-plan-messages`

Read each primitive at `../../primitives/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row. The calls this goal makes are listed in the tool note `plan-my-day` (see the toolchain map).

## Not this goal
Creating tomorrow's plan, touching the monthly review, or reopening a closed issue.

## Report
A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
