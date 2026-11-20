---
name: saved-plan
version: 0.1.0
disable-model-invocation: true
description: One saved plan, session or notes file in the plans tree, placed and named by the layout and shaped by the template.
---

# Primitive: saved plan

**Primitive.** One saved plan, session or notes file in the plans tree, placed and named by the layout and shaped by the template.

**Consumer.** Human: the user, reading it later. LLM: a later session resuming from it. No parser, so no validator.

**Artifact.** See `artifact.md` beside this file: the layout and file kinds, flat file versus topic directory, the `SESSION-*` pattern, the promotion mapping, kind and file-name rules, and the `PLAN-*.md` template. Source: skills/delivery/save-plan/SKILL.md:34-45, 109-123, 135-147, 149-181, 192-215, 229-263

**Slots.**

| Slot                       | Filled with                                                                           | Required              |
| -------------------------- | ------------------------------------------------------------------------------------- | --------------------- |
| `<project>`                | the repository's stable name (see the `plans-stay-local` rule)                        | yes                   |
| kind                       | `PLAN` by default; `SESSION`, `NOTES` or a plain slug per the user's wording          | yes                   |
| `<slug>`                   | 2-5 kebab-case words for the topic                                                    | PLAN, NOTES, plain    |
| `YYYY-MM-DD`               | today's date                                                                          | SESSION only          |
| flat or topic directory    | by the signals in `artifact.md`; undecided means the topic question in `plan-messages` | yes                   |
| template sections          | the user's own wording; a section with nothing to say is dropped, not left empty      | per section           |

**Check.** Show the absolute path, the layout branch used (flat, topic directory, promoted), and a comparison of the file's headings with the template for its kind. No empty template section.

**Version.** 0.1.0. Changing a file-name pattern or a template heading is a major bump. Producer: goal `plan-saved`. Consumers: later sessions, goals `phase-executed` and `plan-delivered` (which match plan files by ticket key).
