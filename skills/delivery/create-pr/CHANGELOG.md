# Changelog

## 1.3.0

- Add `--draft` flag — passes `--draft` to `gh pr create` and surfaces a "mark ready" reminder in the final report. Used by `implement-feature` Step 4 so the automated review pipeline can land findings before the PR is visible-for-review.
- CodeRabbit review fixes: the `github` ticket rule now names the prefix-stripping examples and prefers the first 3+ digit run when multiple numbers appear in the branch, falling back to the PR title rather than guessing; Step 5's `gh pr create` example is a valid copy-paste command (draft/base flags moved to an "adjust before running" note instead of inline bracket placeholders); the ticket-template fence gets a `markdown` language tag.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
