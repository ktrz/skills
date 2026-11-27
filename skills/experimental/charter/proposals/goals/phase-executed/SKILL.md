---
name: phase-executed
version: 0.1.0
disable-model-invocation: true
description: Goal — one plan phase is built and green in its own worktree, with progress written back beside the plan.
argument-hint: "<plan path or ticket> <phase> [base]"
---

# Goal: phase executed

## Outcome

One phase of a plan is implemented, committed and green in its own worktree, and its progress file sits beside the plan.

## Done when

- The worktree and branch exist via the house worktree tool, named `<plan-name>-phase-<N>`, based on the given base or the derived default branch; the name was confirmed before creation.
- The progress file lists one box per deliverable, every finished box is ticked, and a copy sits next to the plan.
- Tests were written first; the project's install and check commands pass in the worktree.
- Work is committed in logical units; nothing is left uncommitted.
- The report names files changed, check results, unticked items and the worktree path.

## Rules

Bound by: `exact-artifacts`, `test-first`, `isolated-worktree`, `commit-format`, `protected-main`, `green-before-done`, `stack-dependent-work`, `house-tools-only`, `plans-stay-local`, `brief-carries-rules`, `ticket-traceable`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

Progress file → `phase-progress`; the brief to a child that builds the phase → `phase-brief`; commits → `commit-message`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Opening the PR, running the review pipeline, dispatching other phases, or editing the plan.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
