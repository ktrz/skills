---
name: explain-change
version: 0.1.0
disable-model-invocation: true
description: Goal — a reader who did not build the change understands a PR, design or plan from one page.
argument-hint: "<PR, design or plan>"
---

# Goal: explain a change

## Outcome

A reader who did not build it understands the PR, design or plan from one page, in the form the user asked for.

## Done when

- The page opens with a short summary and a suggested reading order.
- Every coined term used is defined in a glossary on the page.
- At least one before/after diagram shows the change.
- It is delivered in the form the user named (local file, published page, or plain text).
- Follow-up questions the user asked are folded into the page, not left in chat.

## Rules

Bound by: `read-before-claim`, `named-means-used`, `answer-not-act`, `outward-on-go`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Changing the code or design being explained, or sharing the page beyond what the user approved.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
