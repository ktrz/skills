---
name: compact-or-handoff
version: 0.1.0
disable-model-invocation: true
description: Goal — at a checkpoint the user holds one recommendation and a paste-ready prompt for each path.
argument-hint: "[compact | handoff]"
---

# Goal: compact or hand off

## Outcome

At a session checkpoint the user holds one recommendation and a paste-ready prompt for each path, and chooses.

## Done when

- The assessment states the goal, what is done and verified, what is open, and whether the work is saved outside the conversation.
- One path is recommended with a one-line reason: compact when the work is mid-thread and the live context still carries the next steps; handoff at a clean break, with the work durably saved so a fresh agent could resume from a file. An argument skips the assessment and yields only that prompt.
- Both prompts are shown, the pick marked; artifacts are cited by path or URL, not restated.
- Nothing was run and the goal stopped for the user's choice: the user runs `/compact` or `/handoff`; a handoff file is written only after the user confirms, and its saved path is reported.

## Rules

Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `answer-not-act`, `read-before-claim`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

Prompts → `checkpoint-prompts`. Read it at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), with any file it names. If it is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Compacting, handing off or doing the remaining work itself.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
