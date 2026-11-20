---
name: monthly-review-issue
version: 0.1.0
disable-model-invocation: true
description: The retrospective issue for one just-ended month, and the one-sentence posture hint derived from it.
---

# Primitive: monthly review issue

**Primitive.** The retrospective issue for one just-ended month, and the one-sentence posture hint derived from it.

**Consumer.** Human: the user, who owns and edits the body after creation. LLM: later daily runs, which read only `### Patterns observed` and `### Levers to try next month` to derive the hint.

**Artifact.** See `artifact.md` beside this file: title, body shape, what feeds each section, the hint prompt, style guide and examples. Source: skills/workflow/plan-my-day/references/monthly-review.md:37-39, 98-102, 104-120, 122-146, 196-201, 217-263

**Slots.**

| Slot | Filled with | Required |
| --- | --- | --- |
| `<PREVIOUS_MONTH>` | `YYYY-MM` of the month that just ended | yes |
| `<PREVIOUS_LABEL>` | that month as `Month YYYY` | yes |
| `<synthesised bullet>` | drawn only from that month's daily-plan issues | at least one section non-empty |
| posture sentence | one paraphrased sentence, at most two items, never a verbatim bullet | optional |

**Check.** Show the issue URL (created) or the number found; compare slot by slot: exact title, five headings in order. For the hint, show the one sentence and the two sections it came from.

**Version.** 0.1.0. Renaming `### Patterns observed` or `### Levers to try next month` is a major bump (the hint reads them). Producer and consumer: goal `daily-plan`.
