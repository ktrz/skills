---
name: commit-message
version: 0.1.0
disable-model-invocation: true
description: The git commit message, as a Conventional Commits subject with the tracker's ticket id, an optional body and footer.
---

# Primitive: commit message

**Primitive.** The git commit message, as a Conventional Commits subject with the tracker's ticket id, an optional body and footer.

**Consumer.** Human (reviewers reading history) and LLM (later sessions reading `git log`). No parser.

**Artifact.** See `artifact.md` beside this file: skeleton, type list, per-field rules, valid and invalid examples, the five-item checklist and the two hard rules. Its `<ticket-reference path>` (old text: `references/tracker.md`) is filled with the absolute path of primitive `ticket-reference`'s `SKILL.md`. Source: skills/delivery/commit-message-format/SKILL.md:14-64, 77-88

**Slots.**

| Slot          | Filled with                                                                 | Required                          | When empty                                       |
| ------------- | --------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| `type`        | one of the eleven listed types                                              | yes                               | never empty                                      |
| `(scope)`     | lowercase noun                                                              | no                                | omit with its parentheses                        |
| `TICKET-ID`   | the id per `ticket-reference`                                               | yes when a tracker is configured  | no tracker config: omit the field                |
| `description` | imperative, lowercase, no trailing period                                   | yes                               | never empty                                      |
| body, footer  | the why; `BREAKING CHANGE: ...`, `Closes #n`                                | no                                | omit, with no blank line                         |
| `<ticket-reference path>` | as defined above (in the rules text, not the message)           | yes                               | never empty                                      |

**Check.** For each commit: `git log -1 --format=%B <sha>` shown, compared against the five checklist items in `artifact.md`, plus absence of a `Co-Authored-By:` line.

**Version.** 0.1.0. Adding a type is minor; changing the skeleton or the ticket position is major. Producers: goals `phase-executed`, `deliver-feature`, `fix-bug`, `address-review`, via rule `commit-format`. A project's own commit format outranks this primitive (rule `commit-format`).
