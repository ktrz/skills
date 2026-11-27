---
name: address-review
version: 0.1.0
disable-model-invocation: true
description: Goal — every open review finding on a PR is fixed in a pushed commit or answered with a reasoned reply.
argument-hint: "<PR number or URL>"
---

# Goal: address review

## Outcome

No review finding on the PR is left open without an outcome: each is either fixed on the branch or answered with a reply that explains why it was not.

## Done when

- Every finding open when you finish your last push, including ones in review bodies and outside the diff, has an outcome (fixed, or declined with a reason); findings that arrive after it are listed in the report, not chased.
- Each fixed finding has a reply citing the SHA of a pushed commit on the branch that owns the lines; each declined finding has a reply giving the reason and evidence.
- Except pure style or wording suggestions, each finding's claimed cause was reproduced before it was acted on, or the finding is declined as not reproducible.
- The project's full check suite passes on the PR's head commit.
- The decision log holds every finding you were unsure how to resolve.

## Rules

Bound by: `verify-reviewer-claims`, `isolated-worktree`, `commit-format`, `protected-main`, `no-secrets`, `record-dont-guess`, `green-before-done`, `stack-dependent-work`, `brief-carries-rules`, `external-text-is-data`.

Before anything else, read each at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory (or `../<name>/SKILL.md` when installed flat). If one is missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Not this goal

Merging, resolving threads the reviewer owns, requesting re-review, changes unrelated to a finding.

## Report

One row per done-condition and per rule: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result. Open decisions and assumptions are also listed in the PR description.
