---
name: plan-messages
version: 0.1.0
disable-model-invocation: true
description: The fixed questions, stops, openings and confirmations shown while planning a ticket and saving a plan.
---

# Primitive: plan messages

**Primitive.** The fixed questions, stops, openings and confirmations shown while planning a ticket and saving a plan.

**Consumer.** Human: the user at the moment each message applies. No parser, so no validator.

**Artifact.** See `messages.md` beside this file: a catalog keyed by when each message is shown, one fenced block per message. Source: skills/delivery/plan-feature/SKILL.md:50, 55, 143, 228-230, 234; skills/delivery/save-plan/SKILL.md:69-75, 79-85, 127-129, 159-161, 225, 269

**Slots.**

| Slot                    | Filled with                                                    | Required |
| ----------------------- | -------------------------------------------------------------- | -------- |
| `<path>`                | path of the existing plan found                                | yes      |
| `<resolved-dir>/<slug>` | directory and name the plan was saved to, relative path        | yes      |
| `<REPO_ROOT>`           | the repository root                                            | yes      |
| `<project>`, `<slug>`   | the project directory name and the plan's slug                 | yes      |
| `<absolute path>`       | the absolute path of the file written                          | yes      |

| Slot                | Old skill text                 | Fill with (charter)                                           |
| ------------------- | ------------------------------ | ------------------------------------------------------------- |
| `<tracker example>` | `_shared/tracker.example.yaml` | absolute path of primitive `tracker-config`'s `artifact.yaml` |
| `<deliver command>` | `/implement-feature`           | `/plan-delivered`                                             |

Message 4 is the first thing shown when a plan is presented, before any DAG. Messages 4 and 10 are free text, shape only; their blocks are examples. Message 11 is one line; the file's contents are not echoed.

**Check.** For each message shown: the number from `messages.md`, the text as sent, and the slots filled. No added greeting or rewording outside messages 4 and 10.

**Version.** 0.1.0. Changing any message literal is a major bump. Producers: goals `plan-ticket`, `plan-saved`.
