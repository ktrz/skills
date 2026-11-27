---
name: plan-saved
version: 0.1.0
disable-model-invocation: true
description: Goal — the conversation's plan, session or notes is one file in the plans tree, resumable without the chat.
argument-hint: "[kind or slug]"
allowed-tools: Read, Write, Bash(git rev-parse:*), Bash(basename:*), Bash(dirname:*), Bash(cd:*), Bash(pwd:*), Bash(ls:*), Bash(mkdir -p:*), Bash(mv:*), Bash(grep:*), Bash(date:*), Bash(test:*)
---

# Goal: save a plan

## Outcome

The conversation's plan, session or notes is one file in the plans tree, resumable without the chat.

## Done when

- The file is under `plans.local/<repo>/`, named and placed per the layout (flat or topic directory); the reply is the `plan-messages` entry shown when the file was written, nothing echoed.
- No existing file was overwritten, promoted or moved without the user choosing it.
- A missing or dangling `plans.local` stopped the save with the fixed message; no symlink was created.
- The text keeps the user's own wording; no empty template sections.

## Rules

Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `plans-stay-local`, `named-targets-only`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

File → `saved-plan`; messages → `plan-messages`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Executing the plan, creating the `plans.local` symlink, or rewriting plans the user did not name.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
