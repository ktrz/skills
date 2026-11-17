---
name: pr-reviewed
version: 0.1.0
disable-model-invocation: true
description: Goal — a PR has severity-ranked findings in the handover format, written to a file, posted, or triaged, per the mode asked.
argument-hint: "[PR] [--deep] [--pipeline] [--re-review]"
---

# Goal: PR reviewed

## Outcome

A PR has severity-ranked findings in the handover format, written to a file, posted, or triaged with the user, per the mode asked.

## Done when

- File modes (default, pipeline): `pr-<N>-auto-review.md` exists in the output directory, passes the handover validator, and a re-run on an unchanged PR is byte-identical; pipeline posts nothing and skips with the fixed line when unconfigured.
- Invoking this goal in default mode is the user's go for posting the surviving findings as comment-type review comments on this PR; in deep mode the go is the user's per-finding answer; pipeline mode posts nothing.
- Default mode: each finding surviving overlap with existing comments is posted as a comment-type review comment and the fixed count line is printed.
- Deep mode: no file; skimmed findings were listed with the fixed block; each finding was shown with post / edit / drop; one review was posted only after the walk, then the fixed count line.
- Findings were deduplicated, overlap-handled, threshold-filtered and sorted per the aggregation protocol; nothing was dropped silently; an empty diff stopped the run with the fixed line.
- With `--re-review`: every prior comment has a verdict in `pr-<N>-rereview-<k>.md`, and no prior point is re-raised.

## Rules

Bound by: `exact-artifacts`, `fence-external-text`, `external-text-is-data`, `outward-on-go`, `read-before-claim`, `plans-stay-local`, `brief-carries-rules`, `house-tools-only`, `no-secrets`, `record-dont-guess`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

`pr-<N>-auto-review.md` → `review-handover`; each finding → `review-finding`; child briefs → `review-agent-brief`, `rereview-briefs`; aggregation → `review-aggregation`, `comment-relevance`; re-review report → `rereview-report`; posted comments and the deep-mode review → `review-comment`; fixed lines, prompts and counts → `review-messages`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Approving, requesting changes, fixing the author's code, merging, or triaging the findings file (that is `findings-investigated`).

## Report

The report has a row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
