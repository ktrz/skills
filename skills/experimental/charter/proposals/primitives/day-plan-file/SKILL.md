---
name: day-plan-file
version: 0.1.0
disable-model-invocation: true
description: The markdown file that holds one day's plan when no day-plan repo is configured.
---

# Primitive: day-plan file

**Primitive.** The markdown file that holds one day's plan when no day-plan repo is configured.

**Consumer.** Human: the user reading the file. LLM: the next daily run, which finds the last plan by the `^\d{4}-\d{2}-\d{2}-.*\.md$` file-name pattern.

**Artifact.** See `artifact.md` beside this file: file name rule, body layout and the rules shared with the issue form. Source: skills/workflow/plan-my-day/SKILL.md:836-897

**Slots.**

| Slot | Filled with | Required |
| --- | --- | --- |
| `<short-description>` | 2-4 word kebab-case summary of the day's themes | yes |
| `<Day of week>, <Month Day>` | friendly date of the plan | yes |
| item lines | as `day-plan-issue` item lines | yes per kept section |

**Check.** Show the absolute file path and compare slot by slot: name pattern, heading order, empty sections omitted, no Standup or Bonus section in file mode.

**Version.** 0.1.0. Changing the name pattern is a major bump (last-plan lookup depends on it). Producer: goal `daily-plan`.
