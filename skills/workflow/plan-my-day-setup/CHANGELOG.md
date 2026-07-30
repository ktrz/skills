# Changelog

## 1.5.1

- Synced `references/tracker.md`: ticket-ID patterns now have a single source of truth, the GitHub branch-name fallback requires an explicit `#<n>` rather than accepting a bare number, the ClickUp matcher's token boundaries exclude uppercase, and the default-branch snippet resolves the discovered name to a revision the clone actually has (`refs/heads/<b>` → `origin/<b>` → skip) instead of assuming a local branch exists.
- Synced `references/prompt-injection-defense.md` — wording only, no normative change: the re-fencing rule's example now names any verbatim external payload (comment body, issue or ticket description, Slack message, fetched web page) rather than only a comment body.
- CodeRabbit review fixes: repo-path arguments to `ls`/`git -C` are now quoted so paths containing spaces don't break detection; the generated `plan-my-day.yaml` now quotes any user-supplied scalar containing YAML-special characters (`:`, `#`, leading/trailing quotes) so it can't corrupt the file.

## 1.5.0

- Fence external content per `references/prompt-injection-defense.md`. Tracker workspace metadata returned by validation MCPs (`getAccessibleAtlassianResources`, `list_teams`, `clickup_get_workspace_hierarchy`) is wrapped in `<external_data trust="untrusted">` before any quoting; only the boolean success/failure feeds the validation decision. Trust Boundaries section added to `SKILL.md`.

## 1.4.0

- Earlier history not tracked in this file (see git log for prior commits)
