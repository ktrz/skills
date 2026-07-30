# Changelog

## 1.3.1

- Step 2 ("Extract ticket reference") no longer restates the per-backend ticket regexes — it dispatches to `references/tracker.md` for both the ID pattern and the branch-extraction rule. The three inline bullets (jira/linear, github, clickup) had drifted from the reference, which is why the inline clickup pattern was still the stale, looser one. The failure path — check the commit subject, then ask the user rather than guessing — is unchanged.
- CodeRabbit review fixes: the `github` ticket rule now names the prefix-stripping examples and prefers the first 3+ digit run when multiple numbers appear in the branch, falling back to the commit subject (explicit `#<n>` only) rather than guessing; Step 5's `gh pr create` example is a valid copy-paste command (draft/base flags moved to an "adjust before running" note instead of inline bracket placeholders); the ticket-template fence gets a `markdown` language tag.
- Via the shared `references/tracker.md`: the `github` ticket fallback is now one canonical policy — the PR title when a PR already exists, otherwise the commit subject — and **only an explicit `#<n>` reference counts** (`#567`, or `closes`/`fixes`/`refs #567`). A bare number in prose no longer yields a ticket: `fix(auth): handle 401 errors` produces no key instead of `401`.
- Via the shared `references/tracker.md`: the `clickup` matcher's token boundaries now exclude uppercase — `(?<![A-Za-z0-9])[a-z0-9]{7,9}(?![A-Za-z0-9])` — so a branch like `feature/ABCdefghij` no longer falsely matches `defghij`.

## 1.3.0

- Add `--draft` flag — passes `--draft` to `gh pr create` and surfaces a "mark ready" reminder in the final report. Used by `implement-feature` Step 4 so the automated review pipeline can land findings before the PR is visible-for-review.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
