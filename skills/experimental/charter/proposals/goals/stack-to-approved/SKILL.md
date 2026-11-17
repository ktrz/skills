---
name: stack-to-approved
version: 0.1.0
disable-model-invocation: true
description: Goal — every PR in a stack is ready, green and approved by its reviewer, or listed with the exact reason it is not.
argument-hint: "<stack top PR or branch>"
---

# Goal: stack to approved

## Outcome

Every PR in the stack is ready for merge, green on its own, and approved, or carries a written reason it is not.

## Done when

- Each PR, bottom up, is marked ready by the user's go only once the one below is approved; otherwise its ready-request is listed as pending.
- Each PR's head commit passes CI on its own.
- Every thread open at the last push has a reply (fix SHA or reason); threads arriving after it are listed in the report, not chased.
- Each PR carries one summary comment of what was changed and what was declined.
- The report is a per-PR table: threads handled, commits, CI, approval, leftovers for the user.

## Rules

Bound by: `stack-commands-only`, `one-worktree-per-stack`, `fix-where-written`, `new-commits-only`, `verify-reviewer-claims`, `outward-on-go`, `defer-means-ticket`, `pr-body-matches-head`, `green-before-done`, `commit-format`, `protected-main`, `stack-dependent-work`, `external-text-is-data`, `brief-carries-rules`, `house-tools-only`, `record-dont-guess`, `no-secrets`, `read-before-claim`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Merging, refactoring unrelated code, or changing the stack's shape.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
