---
name: pr-opened
version: 0.1.0
disable-model-invocation: true
description: Goal — the current branch has a PR whose body follows the repo's own PR template, or `pr-body` where it has none.
argument-hint: "[--draft]"
---

# Goal: PR opened

## Outcome

The current branch has a pull request whose body follows the repo's own PR template, or `pr-body` where it has none, and the user holds its URL.

## Done when

- The PR exists against the default branch, or the parent branch when the work is stacked; its URL is reported, with the stacked or draft note where it applies. Invoking this goal is the user's go for pushing the current branch and opening this one PR.
- The body follows the repo's own PR template where one exists, else `pr-body` (rule `pr-template`); the title follows `pr-body`'s title rule; the ticket line is a link, and the test scenario is concrete steps a reviewer can follow.
- The PR is a draft when `--draft` was given or a calling goal asked for it; otherwise it is opened ready.
- The ticket came from the branch, then history, then the user; with no tracker config the goal stopped with the fixed message.

## Rules

Bound by: `exact-artifacts`, `pr-template`, `ticket-traceable`, `stack-dependent-work`, `protected-main`, `pr-body-matches-head`, `no-secrets`, `record-dont-guess`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

PR title → `pr-body`; PR body → `pr-body` where the repo has no PR template of its own; ticket id and link → `ticket-reference`; stop, stacked and draft notes → `delivery-messages`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Marking the PR ready for review, merging, requesting review, or pushing other branches.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
