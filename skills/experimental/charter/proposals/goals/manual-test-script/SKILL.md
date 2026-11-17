---
name: manual-test-script
version: 0.1.0
disable-model-invocation: true
description: Goal — the user can verify or demo a change by following one file, with every input and expected result written out.
argument-hint: "<change, PR or branch>"
---

# Goal: manual test script

## Outcome

The user can verify or demo the change by following one file, with every input and expected result written out.

## Done when

- A self-contained file lists scenarios, each with an id, the exact input (command, prompt or clicks), and the expected result.
- Each scenario maps to an acceptance criterion or a changed behaviour.
- The file states what to ignore and what changed versus before.
- Each input was run or traced against the code at the head commit.

## Rules

Bound by: `read-before-claim`, `named-means-used`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. A primitive named by a bound rule is read at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat) and gets a report row. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Automated tests, fixing failures the script reveals, or signing off the change for the user.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
