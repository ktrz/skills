---
name: review-comments-resolved
version: 0.1.0
disable-model-invocation: true
description: Goal — every unresolved review comment has a decision the user made, and the decided fixes and replies are on the PR.
argument-hint: "[PR] | --from-doc <file>"
---

# Goal: review comments resolved

## Outcome

Every unresolved review comment on the PR has a decision the user made, and the decided fixes and replies are on the PR.

## Done when

- The PR was confirmed; all unresolved threads and substantive review bodies were fetched in full and shown one at a time, condensed, with options.
- No code changed before every decision was in; the decision table was shown; deferred items became tickets the user adjusted.
- Bug fixes were test-first; replies were shown and confirmed, then posted and resolved together; duplicates got the reply on every thread; skipped items are untouched. The user's yes to the shown replies, not invoking this goal, is the go for exactly those replies, resolves and review-body comments.
- A fresh fetch shows no unresolved thread outside the skipped set.
- With `--from-doc`: only `[d]` items were decided, markers and Resolution notes were written in place, the file still validates, nothing was implemented or posted.

## Rules

Bound by: `exact-artifacts`, `verify-reviewer-claims`, `test-first`, `commit-format`, `green-before-done`, `outward-on-go`, `defer-means-ticket`, `fence-external-text`, `external-text-is-data`, `new-commits-only`, `fix-where-written`, `brief-carries-rules`, `house-tools-only`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

investigator brief and reports → `investigation-brief`; decision table and prompts → `review-messages`; thread replies and review-body comments → `review-reply` (no handover); commits → `commit-message`; decisions file in `--from-doc` mode → `review-handover`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Implementing or posting in `--from-doc` mode, merging, or deciding comments for the user.

## Report

The report has a row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result. Include the fresh-fetch unresolved count and the skipped set.
