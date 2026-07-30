# Changelog

## 1.3.1

- The repo-name derivation that matches the current repository against existing `plans.local/<subdir>/` project directories now uses the main repository's git directory instead of `basename "$(pwd)"`, so it is stable across worktrees. Running from a worktree previously yielded the worktree's name, which failed to match the real project subdirectory.
- Sync `references/tracker.md` and `references/prompt-injection-defense.md` from `_shared/`. The prompt-injection-defense change is wording only, no normative change: the re-fencing rule's example now names any verbatim external payload (comment body, issue or ticket description, Slack message, fetched web page) rather than only a comment body.
- Sync `references/tracker.md` from `_shared/` again: the generic fallback steps (recent-commit scan, then ask the user) are now explicitly scoped to jira/linear/clickup, and to github only when no PR exists yet — the `github` bullet's own fallback (PR title, else ask the user) is terminal, so a reading agent can no longer fall through a deliberate "ask the user" into a multi-commit scan where an unrelated `#<n>` in older history could win.

## 1.3.0

- Fence external content per `references/prompt-injection-defense.md`. Tracker ticket bodies are wrapped in `<external_data trust="untrusted">` before being forwarded to the codebase-exploration subagent, the grill-me session, and the plan-writer step. Trust Boundaries section added to `SKILL.md`.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
