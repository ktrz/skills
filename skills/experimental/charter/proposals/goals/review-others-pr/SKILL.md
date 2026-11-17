---
name: review-others-pr
version: 0.1.0
disable-model-invocation: true
description: Goal — someone else's PR has a comment-only review whose every finding was verified against the code.
argument-hint: "<PR number or URL>"
---

# Goal: review someone else's PR

## Outcome

Someone else's PR has a comment-only review in which every finding was reproduced against the code before it was posted.

## Done when

- A findings file exists with each finding's severity, file line (not diff line) and the evidence that reproduced it.
- The review is posted as type "comment" after the user's go, or held as a shown draft listed as pending; no approve or request-changes.
- Each posted inline comment maps to one finding in the file.
- On a re-review, each earlier comment is marked addressed or still open in the findings file, and no addressed point is raised again.
- Findings outside the PR's scope follow defer-means-ticket, not posted.

## Rules

Bound by: `read-before-claim`, `outward-on-go`, `defer-means-ticket`, `external-text-is-data`, `no-secrets`, `brief-carries-rules`, `house-tools-only`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Approving, requesting changes, fixing the author's code, or merging.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
