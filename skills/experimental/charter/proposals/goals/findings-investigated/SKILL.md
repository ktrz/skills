---
name: findings-investigated
version: 0.1.0
disable-model-invocation: true
description: Goal — every auto-review finding and relevant reviewer comment on a PR is one item in a validated decisions file.
argument-hint: "[PR] [--auto-review-file <path>]"
---

# Goal: findings investigated

## Outcome

Every auto-review finding and every relevant reviewer comment on the PR is one item in a decisions file the user can triage offline, and the file loads in the review plugin.

## Done when

- `pr-<N>-review-decisions.md` exists and passes the handover validator, even with zero items; a second validation failure left no file and printed the refusal line.
- All threads (resolved ones too) and review bodies were fetched in full; resolved threads never became items, only prior-handled notes.
- Auto-review items pass through unchanged; each reviewer item has analysis, lettered options and one suggestion.
- Items are ordered and annotated per the format; auto-review and human items are never merged.
- The fixed summary block is printed; nothing was posted; the goal ended without waiting for the user.

## Rules

Bound by: `exact-artifacts`, `fence-external-text`, `external-text-is-data`, `read-before-claim`, `decisions-stand-alone`, `plans-stay-local`, `brief-carries-rules`, `house-tools-only`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

decisions file → `review-handover`; investigator brief and its reports → `investigation-brief`; already-handled notes → `prior-handled`; comment filter → `comment-relevance`; summary block and refusal line → `review-messages`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Posting to GitHub, implementing any item, or deciding items for the user.

## Report

The report has a row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
