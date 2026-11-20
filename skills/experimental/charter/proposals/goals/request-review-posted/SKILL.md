---
name: request-review-posted
version: 0.1.0
disable-model-invocation: true
description: Goal — a PR has one review request in the configured channel and its ticket shows In Review.
argument-hint: "[PR]"
---

# Goal: request review posted

## Outcome

The PR has one review request in the configured channel, and its ticket shows In Review.

## Done when

- Invoking this goal is the user's go for one message in the configured channel and for moving the ticket to In Review; the message is there with the reviewers on the last line.
- It paraphrases the PR; no PR text was copied in.
- The ticket was moved to In Review, or the skip (no tracker, no ticket key) or the transition error is reported.
- Missing config stopped the goal with the fixed message.

## Rules

Bound by: `exact-artifacts`, `outward-on-go`, `fence-external-text`, `external-text-is-data`, `ticket-traceable`, `house-tools-only`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

message → `review-request-message`; fixed lines → `review-messages`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Reviewing the PR, assigning reviewers on GitHub, or marking the PR ready.

## Report

The report has a row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
