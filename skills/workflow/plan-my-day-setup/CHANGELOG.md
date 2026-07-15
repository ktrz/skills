# Changelog

## 1.5.0

- Fence external content per `references/prompt-injection-defense.md`. Tracker workspace metadata returned by validation MCPs (`getAccessibleAtlassianResources`, `list_teams`, `clickup_get_workspace_hierarchy`) is wrapped in `<external_data trust="untrusted">` before any quoting; only the boolean success/failure feeds the validation decision. Trust Boundaries section added to `SKILL.md`.

## 1.4.0

- Earlier history not tracked in this file (see git log for prior commits)
