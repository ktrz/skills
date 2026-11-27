---
name: review-decisions-applied
version: 0.1.0
disable-model-invocation: true
description: Goal — every item the user approved in a decisions file is implemented, pushed and answered on the PR in one confirmed batch.
argument-hint: "<decisions file>"
---

# Goal: review decisions applied

## Outcome

Every item the user approved in the decisions file is implemented on the branch, pushed, and answered on the PR in one batch the user confirmed.

## Done when

- The file was re-read in full; `[x]` items got option (a), `[~]` items the Resolution note; an ambiguous note was applied in its narrowest reading and listed. With nothing marked, the goal exited with the fixed line; otherwise the fixed bucket-count line was printed.
- Bug items were fixed test-first; the full suite passes; the branch was pushed before any reply.
- The proposed-reply table was shown and the user said yes before the first GitHub write; that yes, not invoking this goal, is the user's go for exactly the table's rows and the grouped comment. A partial implementation posted nothing.
- Thread items have a severity-prefixed reply and are resolved; auto-review items have one grouped comment; `[d]` and `[-]` items are untouched.
- Every auto-review item was overlap-skimmed against the PR's existing comments before posting; a suppressed item is left out of the grouped comment and, once fixed, has the `+1` reply on the earlier comment, a row of the confirmed table; the run report shows the suppressed count.
- A fresh fetch shows unresolved threads equal to skipped plus discuss; if so and the PR is a draft, mark-ready was offered with the fixed prompt.

## Rules

Bound by: `exact-artifacts`, `test-first`, `commit-format`, `green-before-done`, `outward-on-go`, `read-before-claim`, `fence-external-text`, `external-text-is-data`, `new-commits-only`, `fix-where-written`, `protected-main`, `house-tools-only`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

input file → `review-handover`; thread and `+1` replies → `review-reply` (from a handover item); grouped comment → `auto-review-summary-comment`; overlap-skim → `review-aggregation` ("Overlap-skim suppression" only); commits → `commit-message`; reply table, prompts, counts and run report → `review-messages`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Re-investigating items, deciding pending ones, merging, or resolving threads the user marked `[d]` or `[-]`.

## Report

The report has a row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
