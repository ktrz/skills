---
name: deliver-feature
version: 0.1.0
disable-model-invocation: true
description: Goal — a feature ticket is delivered as a draft PR that is green, self-reviewed, and traceable to the ticket.
argument-hint: "<ticket-key or description>"
---

# Goal: deliver a feature

## Outcome

The ticket's behaviour exists on a branch, in a draft PR a reviewer could approve without asking what it does or whether it works.

## Done when

- Every acceptance criterion in the ticket (or, with no ticket, the criteria you recorded in the decision log before coding) maps to a passing test, or to a recorded decision explaining why not.
- The project's full check suite passes on the PR's head commit.
- A draft PR is open against the default branch, or the parent branch when `stack-dependent-work` applies; its description links the ticket and states what changed, why, and how to verify it.
- The PR description lists the self-review findings on the final diff, each marked fixed (SHA) or known gap; "none" states what was checked.
- The decision log holds every assumption you made about unclear requirements.

## Rules

Bound by: `test-first`, `isolated-worktree`, `commit-format`, `protected-main`, `pr-template`, `stack-dependent-work`, `no-secrets`, `record-dont-guess`, `green-before-done`, `brief-carries-rules`, `external-text-is-data`.

Before anything else, read each at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory (or `../<name>/SKILL.md` when installed flat). If one is missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Merging, requesting human review, moving the ticket's status, refactoring unrelated code.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result. Open decisions and assumptions are also listed in the PR description.
