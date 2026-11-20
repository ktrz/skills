---
name: plan-my-day-config
version: 0.1.0
disable-model-invocation: true
description: "The `~/.claude/plan-my-day.yaml` file: personal settings and the list of repositories the daily plan scans."
---

# Primitive: plan-my-day config

**Primitive.** The `~/.claude/plan-my-day.yaml` file: personal settings and the list of repositories the daily plan scans.

**Consumer.** Parser: a YAML parser reads the file at the start of every `daily-plan` run. LLM: the agent reading the extracted fields. Human: the user editing it. No validator ships: the quoting rule below is the injection guard.

**Artifact.** See `artifact.yaml` beside this file (the example config; `<config example path>` and `<tracker-config path>` are slots filled with absolute paths of the primitives' files) and `format.md` (fields read, the generated template, the quoting rule, the no-tracker-block rule). Source: skills/workflow/plan-my-day/config.example.yaml:1-59; skills/workflow/plan-my-day/SKILL.md:100-101, 112-117; skills/workflow/plan-my-day-setup/SKILL.md:194-228

**Slots.**

| Slot | Filled with | Required |
| --- | --- | --- |
| `branch_prefix` | branch naming prefix, `""` when none | yes |
| `output_path` | directory for plan files | yes |
| `day_plan_repo` | `owner/repo` for issue output | optional |
| `repos[].name`, `.path`, `.github_repo`, `.branch_ticket_format` | short label, git path, `org/repo`, ticket-in-branch shape | yes per repo |

**Check.** Show the file path and its content. Every user-supplied scalar is a double-quoted string with `"` and `\` escaped; no `tracker:` block is present; each `path` resolves under `git -C <path> rev-parse --show-toplevel`.

**Version.** 0.1.0. Removing or renaming a key is a major bump. Producer: goal `daily-plan-configured`. Consumers: goals `daily-plan`, `standup-snapshot`, `day-closed`. Tracker settings live in `tracker-config`.
