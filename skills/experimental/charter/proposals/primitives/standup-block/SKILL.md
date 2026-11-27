---
name: standup-block
version: 0.1.0
disable-model-invocation: true
description: The `## Standup — <date>` section of a day-plan issue, with its Done, In Progress and Blockers subsections.
---

# Primitive: standup block

**Primitive.** The `## Standup — <date>` section of a day-plan issue, with its Done, In Progress and Blockers subsections.

**Consumer.** Human: the user copying the block into a standup. LLM: `day-closed`, which reads the `### Done` bullets by regex.

**Artifact.** See `artifact.md` beside this file: bullet formats per subsection, fixed order, replace-in-place rule and the echo. Source: skills/workflow/plan-my-day/references/standup.md:91-145, 153-161. The empty block seeded at plan creation is in `day-plan-issue`.

**Slots.**

| Slot | Filled with | Required |
| --- | --- | --- |
| `<TODAY>` | `YYYY-MM-DD` of the current day | yes |
| `<TICKET or PR#NNN>`, `<title>`, `<repo>` | merged PRs and checked Plan items, deduped | per bullet |
| `<TICKET>`, `<branch>`, `<dirty/ahead>` | dirty-or-ahead worktrees not covered by an open PR | per bullet |
| Blockers bullets | tracker blocked states and parked items with reason | none when empty: header only |

**Check.** Show the issue URL and the echoed block; compare against the three subsection formats and the fixed order Done, In Progress, Blockers. No placeholder bullets.

**Version.** 0.1.0. Changing a heading literal or the `### Done` bullet shape is a major bump. Producers: goals `standup-snapshot`, `day-closed`.
