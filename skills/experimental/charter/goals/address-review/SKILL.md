---
name: address-review
version: 0.2.0
disable-model-invocation: true
description: Goal — every open review finding on a PR is fixed in a pushed commit or answered with a reasoned reply.
argument-hint: "<PR number or URL>"
---

# Goal: address review

## Outcome

No review finding on the PR is left open without an outcome: each is either fixed on the branch or answered with a reply that explains why it was not.

## Done when

- Every finding open when you finish your last push, including ones in review bodies and outside the diff, has an outcome (fixed, declined with a reason, or deferred to a ticket), and a fresh paginated fetch of all threads and review bodies after the last push shows zero unresolved; findings that arrive after it are listed in the report, not chased.
- Invoking this goal is the user's go for the replies and deferral tickets below, on this PR only.
- Each fixed finding has a reply, posted after its fix was pushed, citing the SHA of a pushed commit on the branch that owns the lines; each declined finding has a reply giving the reason and evidence; each deferred finding links a ticket.
- Except pure style or wording suggestions, each finding's claimed cause was reproduced before it was acted on, or the finding is declined as not reproducible.
- The project's full check suite passes on the PR's head commit.
- The decision log holds every finding you were unsure how to resolve.

## Rules

Bound by: `verify-reviewer-claims`, `isolated-worktree`, `commit-format`, `protected-main`, `no-secrets`, `record-dont-guess`, `green-before-done`, `stack-dependent-work`, `brief-carries-rules`, `external-text-is-data`, `exact-artifacts`, `fence-external-text`, `outward-on-go`.

Before anything else, read each at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory (or `../<name>/SKILL.md` when installed flat). If one is missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

replies → `review-reply` (no handover); commits → `commit-message`. Read each primitive at `../../primitives/<name>/SKILL.md` relative to this file's real directory (or `../<name>/SKILL.md` when installed flat), together with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Merging, resolving threads the reviewer owns, requesting re-review, changes unrelated to a finding.

## Report

The report has a row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result. Open decisions and assumptions are also listed in the PR description.
