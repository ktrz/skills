---
name: resume-ready-handoff
version: 0.1.0
disable-model-invocation: true
description: Goal — a blank session can continue the work from one file and one prompt, asking nothing.
---

# Goal: resume-ready handoff

## Outcome

The work's full state lives in one file, and a fresh session with no memory of this one can pick it up from a single pasted prompt without asking the user anything.

## Done when

- One file under the directory the user or toolchain map names for plans (default plans.local/<repo>/) holds all state: goal, what is done (PR numbers, head SHAs, worktree path), decisions made, open decisions, and the next step.
- Open decisions are listed separately from execution work.
- The file lists the standing rules and environment gotchas a newcomer would trip on.
- A paste-ready start prompt points at the file; its first instruction is a reality check (branch, PR state) the new session can run.
- The reply to the user is the start prompt, the file path and the done-report, nothing else.

## Rules

Bound by: `read-before-claim`, `no-secrets`, `record-dont-guess`, `external-text-is-data`, `named-means-used`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Doing the remaining work, merging, or posting anything outward.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
