---
name: plan-file
version: 0.1.0
disable-model-invocation: true
description: The phased plan file for one ticket, which phase agents read to execute without the chat.
---

# Primitive: plan file

**Primitive.** The phased plan file for one ticket, which phase agents read to execute without the chat.

**Consumer.** LLM: the phase agent (reads its own `## Phase <N>`, `## Context` and `## Visual Spec`) and the delivery agent (reads every phase and `## Execution Order`). Human: edits it and approves it. No parser, so no validator.

**Artifact.** See `format.md` (document shape, sections, conformance rules) and `skeleton.md` (filename slot, skeleton, vertical-slice and parallelism rules) beside this file. Source: skills/delivery/plan-feature/references/plan-file-format.md:1-144; skills/delivery/plan-feature/SKILL.md:169-205

**Slots.**

| Slot                                    | Filled with                                                           | Required                          |
| --------------------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| `<TICKET-KEY>`, `<Feature Name>`        | the ticket key and name as fetched this session                       | yes                               |
| `<resolved-dir>/<ticket-slug>.md`       | file name carrying the lowercased ticket key                          | yes                               |
| `## Context`                            | problem, ticket ref, key decisions, architecture constraints          | yes                               |
| `## Execution Order`                    | phase DAG plus a plain-English parallel-vs-sequential readout         | yes from two phases, else omitted |
| `## Phase <N> (PR <N>): <Title>`        | vertical slice: files to touch, tests-first note, reviewer deliverable | yes, at least one                 |
| `## Visual Spec`, `## Open Questions`   | UI phases; deviations and unresolved requirements                     | optional                          |

**Check.** Compare the written file with `format.md`, counting headings outside fenced code only: one H1, `## Context`, `## Execution Order` once there are two or more phases, unique contiguous phase numbers from 0 or 1, no empty phase body. Show the plan's path and the result of each of the seven conformance rules.

**Version.** 0.1.0. Renaming a heading literal or removing a section is a major bump; a new optional section is minor. Producer: goal `plan-ticket`. Consumers: goals `phase-executed`, `plan-delivered`.
