# Changelog

## 1.5.0

- Fence external content per `references/prompt-injection-defense.md`. Tracker workspace metadata returned by validation MCPs (`getAccessibleAtlassianResources`, `list_teams`, `clickup_get_workspace_hierarchy`) is wrapped in `<external_data trust="untrusted">` before any quoting; only the boolean success/failure feeds the validation decision. Trust Boundaries section added to `SKILL.md`.
- CodeRabbit review fixes: repo-path arguments to `ls`/`git -C` are now quoted so paths containing spaces don't break detection; the generated `plan-my-day.yaml` now quotes any user-supplied scalar containing YAML-special characters (`:`, `#`, leading/trailing quotes) so it can't corrupt the file.

## 1.4.0

- Earlier history not tracked in this file (see git log for prior commits)
