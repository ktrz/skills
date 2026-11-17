---
name: phase-progress
version: 0.1.0
disable-model-invocation: true
description: The per-phase progress checklist file, one checkbox per deliverable, whose all-ticked state means the phase is complete.
---

# Primitive: phase progress

**Primitive.** The per-phase progress checklist file, one checkbox per deliverable, whose all-ticked state means the phase is complete.

**Consumer.** LLM (the phase agent ticking boxes; the delivering goal deciding a dependent phase is ready) and human (tracking phases from the main checkout).

**Artifact.** See `artifact.md` beside this file: the example checklist (sections Tests, Implementation, Verification) and the completion rule. File name: `<plan-name>-phase-<N>-progress.md`. Worktree copy at `.claude/plans/<plan-name>-phase-<N>-progress.md` (exempt in rule `plans-stay-local`); the finished file is copied next to the plan as `<plan-dir>/<plan-name>-phase-<N>-progress.md`. `<plan-name>` is the plan file's name without extension (flat plans) or the topic directory's name (topic-directory plans). Source: skills/delivery/execute-phase/SKILL.md:66-68, 72-100, 102; skills/delivery/plan-feature/references/plan-file-format.md:118-120

**Slots.**

| Slot                 | Filled with                                           | Required | When empty                 |
| -------------------- | ----------------------------------------------------- | -------- | -------------------------- |
| `<N>`                | the phase number                                      | yes      | never empty                |
| `<plan-name>`        | as defined above                                      | yes      | never empty                |
| one box per item     | each deliverable of the plan's phase section          | yes      | never empty                |
| `# Phase 1 Progress` | `# Phase <N> Progress`                                | yes      | never empty                |

The example's items are illustrative; the sections and the box syntax `- [ ]` / `- [x]` are the contract.

**Check.** The file path, a count of ticked against total boxes, and the sibling copy's path beside the plan.

**Version.** 0.1.0. Renaming a section or the file pattern is major. Producers: goal `phase-executed`. Consumers: goal `plan-delivered` (readiness, unticked flags).
