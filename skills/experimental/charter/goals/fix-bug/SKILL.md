---
name: fix-bug
version: 0.1.0
disable-model-invocation: true
description: Goal — a reported bug is reproduced by a test that failed before the fix and passes after, in a green draft PR.
argument-hint: "<ticket-key, issue link, or bug description>"
---

# Goal: fix a bug

## Outcome

The reported bug no longer occurs, and a test now exists that would catch it coming back, in a draft PR a reviewer could approve without re-investigating.

## Done when

- A test reproduces the bug as reported; you can show its failing output from before the fix, and it passes on the PR's head commit.
- The project's full check suite passes on the PR's head commit.
- A draft PR is open against the default branch, or the parent branch when `stack-dependent-work` applies; its description states the cause, the fix, and how to verify it.
- The PR description lists the self-review findings on the final diff, each marked fixed (SHA) or known gap; "none" states what was checked.
- The decision log holds every assumption you made about unclear reports or expected behaviour.

## Rules

Bound by: `test-first`, `isolated-worktree`, `commit-format`, `protected-main`, `pr-template`, `stack-dependent-work`, `no-secrets`, `record-dont-guess`, `green-before-done`, `brief-carries-rules`, `external-text-is-data`.

Before anything else, read each at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory (or `../<name>/SKILL.md` when installed flat). If one is missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Merging, requesting human review, moving the ticket's status, fixing other bugs found along the way (list them in the report instead), refactoring unrelated code.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result. Open decisions and assumptions are also listed in the PR description.
