# Changelog

## 1.3.0

- Add Step 5a: automated review pipeline per PR — after PRs are opened, runs `review-pr` (with `PIPELINE=1` so it writes findings to a file without posting to GitHub) and then `investigate-pr-comments` to merge human reviewer comments and produce a `pr-<N>-review-decisions.md` handover doc the user can triage offline
- Pipeline runs once per PR opened in Step 4, in PR-number order, before the retrospective
- Opt-in: skipped silently when `.claude/review.yaml` is absent (logged as a retrospective note)
- Hand-off is async: the skill does not wait for the user to triage the doc before moving to the next PR or Step 6
- Updated frontmatter description to mention the review pipeline so it surfaces in skill triggers
- Document Step 4 PR-title rule: omit orchestration scaffolding like `(Plan N)` / `(Phase N)` from titles
- Step 4 now invokes `create-pr --draft` — PRs open as draft so the Step 5a review pipeline can run before reviewers engage. `execute-review-decisions` offers to promote the PR to ready once findings are resolved.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
