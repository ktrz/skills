---
name: prior-handled
version: 0.1.0
disable-model-invocation: true
description: How a queue item is matched against a resolved thread, and the note, judge question and invariants that follow from a match.
---

# Primitive: prior-handled

**Primitive.** How a queue item is matched against a resolved thread, and the note, judge question and invariants that follow from a match.

**Consumer.** LLM: the judge that answers `same` or `distinct`, and the agent writing the note into a handover item. Human: the user reading the `**Note:**` line when triaging.

**Artifact.** See `artifact.md` beside this file: the context-set fence rules, the matching rule, the judge question, the downgrade note, and the invariants. Source: skills/review/investigate-pr-comments/references/prior-handled.md:68-148. The range starts inside a bullet list in the source; the lines before it (fencing the resolved bodies) are covered by primitive `external-data-fence`.

**Slots.**

| Slot      | Filled with                                                        | Required | When empty                                    |
| --------- | ------------------------------------------------------------------ | -------- | --------------------------------------------- |
| `<when>`  | the prior thread's last-activity timestamp (ISO-8601 date is enough) | yes    | never empty                                   |
| `<login>` | the login that resolved the thread                                 | no       | omit the `by @<login>` clause, never guess    |

**Check.** For each downgraded item: the `**Note:**` line matches the artifact byte for byte outside its slots, the item still carries its `[?]` marker, severity and position, and no resolved body is quoted anywhere. Report the count of judge calls (cap 50) and any cap warning.

**Version.** 0.1.0. Changing the note literal or the judge question is a major bump. Producers: goal `findings-investigated`. Consumers: primitive `review-handover` (the `**Note:**` field); the user.
