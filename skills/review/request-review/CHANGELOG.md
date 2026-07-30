# Changelog

## 1.3.1

- Shared `references/tracker.md` synced. Four changes that matter to ticket-key extraction: the ticket-ID patterns now have a single source of truth — the **Ticket ID format** table, which the branch-name section defers to instead of restating (and drifting from) them; the GitHub fallback to PR title or commit subject now requires an explicit `#<n>` reference, so `fix(auth): handle 401 errors` yields no key rather than ticket `401`; the ClickUp matcher's token boundaries exclude uppercase (`(?<![A-Za-z0-9])[a-z0-9]{7,9}(?![A-Za-z0-9])`); and the default-branch snippet resolves the discovered branch _name_ to a revision this clone actually has (`refs/heads/<b>` → `origin/<b>` → skip the check) instead of assuming a local branch exists, which it does not after `gh pr checkout`, `clone --single-branch`, or a shallow CI clone.
- Shared `references/prompt-injection-defense.md` synced: the subagent re-fencing rule's illustrative example now names any verbatim external payload — a comment body, an issue or ticket description, a Slack message, a fetched web page — rather than only a comment body. Wording only; the rule is unchanged.
- Lint nit: drop a stray trailing blank line in `config.example.yaml`.
- Shared `references/tracker.md` synced again: the generic fallback steps (recent-commit scan, then ask the user) are now explicitly scoped to jira/linear/clickup, and to github only when no PR exists yet — the `github` bullet's own fallback (PR title, else ask the user) is terminal, so a reading agent can no longer fall through a deliberate "ask the user" into a multi-commit scan where an unrelated `#<n>` in older history could win.

## 1.3.0

- Fence external content per `references/prompt-injection-defense.md`. The PR body returned by `gh pr view` is wrapped in `<external_data trust="untrusted">` before composition; the Slack message is built from a paraphrased summary, never from raw PR bytes. Trust Boundaries section added to `SKILL.md`.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
