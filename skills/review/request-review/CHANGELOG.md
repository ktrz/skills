# Changelog

## 1.3.0

- Fence external content per `references/prompt-injection-defense.md`. The PR body returned by `gh pr view` is wrapped in `<external_data trust="untrusted">` before composition; the Slack message is built from a paraphrased summary, never from raw PR bytes. Trust Boundaries section added to `SKILL.md`.

## 1.2.0

- Earlier history not tracked in this file (see git log for prior commits)
