---
name: tracker-config
version: 0.1.0
disable-model-invocation: true
description: The tracker configuration file, `tracker.yaml`, read by every goal that touches an issue tracker.
---

# Primitive: tracker config

**Primitive.** The tracker configuration file, `tracker.yaml`, read by every goal that touches an issue tracker.

**Consumer.** LLM: the agent reads the `tracker:` block to dispatch ticket calls. Human: writes and edits the file. No non-LLM parser, so no validator.

**Artifact.** See `artifact.yaml` (annotated example, byte copy) and `schema.md` (the `tracker:` block schema) beside this file. Source: _shared/tracker.example.yaml:1-64; _shared/references/tracker.md:40-67

**Slots.**

| Slot                                   | Filled with                                              | Required                     |
| -------------------------------------- | -------------------------------------------------------- | ---------------------------- |
| `tracker.type`                         | one of `jira`, `linear`, `github`, `clickup`             | yes                          |
| block named by `type`                  | the backend's fields as in `schema.md`                   | yes; other blocks may be absent |
| every field in that block              | values from the user's own tracker, never guessed        | yes                          |

Location: `<repo_root>/.claude/tracker.yaml` first, then `~/.claude/tracker.yaml`; the first hit wins, no merging (see the `ticket-traceable` rule and tool note `tracker`, `~/.claude/charter/tools/tracker.md`).

**Check.** Show the file path and compare it with `artifact.yaml`: `tracker.type` present, the matching block present with every field of `schema.md`. Placeholder values from the example are not conformance.

**Version.** 0.1.0. Renaming or removing a key is a major bump; a new optional key is minor. Consumers: the `ticket-reference` primitive's templates, goals `plan-ticket`, `pr-opened`, `request-review-posted`, `daily-plan`.
