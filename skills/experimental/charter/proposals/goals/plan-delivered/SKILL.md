---
name: plan-delivered
version: 0.1.0
disable-model-invocation: true
description: Goal — every phase of a plan is a draft PR with its review findings ready for the user's triage.
argument-hint: "<ticket key | plan file>"
---

# Goal: plan delivered

## Outcome

Every phase of the plan is a draft PR, and each PR's review findings wait in files for the user's triage.

## Done when

- A conforming plan file existed before any dispatch; with none found, one was produced to the done-conditions, rules and Conforms-to of `plan-ticket`.
- Each cohort was announced with its phases and worktree paths and dispatched only after the user's go; a cohort of one phase is announced, not asked; dependents of a failed phase were not dispatched.
- Each completed phase has one draft PR, based on the default or parent phase branch and titled for the change; its URL was reported at once. Invoking this goal is the user's go for pushing each phase branch and opening its draft PR.
- The summary table lists phase, branch and PR; phases with unticked progress items are flagged.
- Where review config exists, every PR in number order has an auto-review file and a decisions file (present even when empty) and its fixed report line, produced to the done-conditions, rules and Conforms-to of `pr-reviewed` (pipeline mode) and `findings-investigated`; without config the fixed skip note is shown. Triage is not awaited.
- The report ends with the friction list (implicated item, likely fix) or the fixed no-friction line.

## Rules

Bound by: `exact-artifacts`, `pr-template`, `stack-dependent-work`, `protected-main`, `isolated-worktree`, `brief-carries-rules`, `foreground-below-root`, `plans-stay-local`, `outward-on-go`, `ticket-traceable`, `house-tools-only`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

Messages and summary table → `delivery-messages`; plan → `plan-file`; progress → `phase-progress`; phase child briefs → `phase-brief`; PR → `pr-body`; review files → `review-handover`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row. A goal named in a done-condition is read at `../<name>/SKILL.md` relative to this file's real directory; its rules and primitives bind too and get report rows.

## Not this goal

Merging, marking a PR ready, triaging findings, or editing the plan.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
