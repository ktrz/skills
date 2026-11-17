---
name: exploration-brief
version: 0.1.0
disable-model-invocation: true
description: The brief handed to a read-only codebase-exploration child, and the five-section report it must return.
---

# Primitive: exploration brief

**Primitive.** The brief handed to a read-only codebase-exploration child, and the five-section report it must return.

**Consumer.** LLM: the exploration child reads the brief; the planning parent reads the five returned sections by heading. No parser, so no validator.

**Artifact.** See `artifact.md` beside this file. Source: skills/delivery/plan-feature/SKILL.md:94-128

**Slots.**

| Slot                                  | Filled with                                                         | Required |
| ------------------------------------- | ------------------------------------------------------------------- | -------- |
| `<tracker_type>`                      | the tracker type from the tracker config                            | yes      |
| `<ticket summary from Step A>`        | the fetched ticket's summary, inside the fence                      | yes      |
| `<full ticket description from Step A>` | the fetched ticket's full description, inside the fence           | yes      |

The fence is the one defined by the `external-data-fence` primitive; the brief never reaches the child with the fence stripped or the text paraphrased.

**Check.** Show the brief as sent: every literal of `artifact.md` present, the fence intact with `trust="untrusted"`. Show the child's reply: the five headings `## Related files`, `## Patterns to follow`, `## Types and interfaces to reuse`, `## Test patterns`, `## Potential conflicts`, in that order, none missing.

**Version.** 0.1.0. Changing a literal or a returned heading is a major bump. Producer and consumer: goal `plan-ticket`.
