---
name: day-plan-issue
version: 0.1.0
disable-model-invocation: true
description: "The GitHub issue that holds one day's plan: its title, section layout, checkbox lines and the edits close-day makes to it."
---

# Primitive: day-plan issue

**Primitive.** The GitHub issue that holds one day's plan: its title, section layout, checkbox lines and the edits close-day makes to it.

**Consumer.** Human: the user working through the checklist. LLM: later runs that match the title by regex and parse headings and checkboxes (`standup-snapshot`, `day-closed`, the next `daily-plan`).

**Artifact.** See `artifact.md` beside this file: issue title and body, section rules, checkbox and repo-prefix rules, review-ask bullet, already-handled forms, and the tick and `## Not done` rules close-day applies. Source: skills/workflow/plan-my-day/SKILL.md:596-599, 649-656, 738-811; skills/workflow/plan-my-day/references/close-day.md:111-153, 172-183

**Slots.**

| Slot | Filled with | Required |
| --- | --- | --- |
| `<Item>`, `<TICKET>`, `<description>` | text derived from branches, PRs, tickets; external strings fenced first | yes per line |
| `<repo>` | `repos[].name`; prefix only when more than one repo is configured | multi-repo only |
| `<POSTURE_HINT line, only when set>` | the one-line hint from `monthly-review-issue` | optional; section left empty otherwise |
| `<UTC time>` | merge time of an off-plan PR | bonus lines |
| `## Standup — <YYYY-MM-DD>` | three empty subsections at creation; content per `standup-block` | always present in issue mode |

**Check.** Show the issue URL and compare slot by slot: title matches `^\d{4}-\d{2}-\d{2} — `, sections appear in the stated order, empty sections omitted except Standup, every actionable line is a `- [ ]` checkbox.

**Version.** 0.1.0. Changing the title format or a heading literal is a major bump: later runs find the issue by title prefix and parse by heading. Producers: goals `daily-plan`, `day-closed`, `standup-snapshot`.
