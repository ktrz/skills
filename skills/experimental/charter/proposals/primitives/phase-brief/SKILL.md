---
name: phase-brief
version: 0.1.0
disable-model-invocation: true
description: The prompt a phase agent receives so it can execute one plan phase in its worktree without any session context.
---

# Primitive: phase brief

**Primitive.** The prompt a phase agent receives so it can execute one plan phase in its worktree without any session context.

**Consumer.** LLM: the child agent that builds the phase. It starts blank and reads only this.

**Artifact.** See `artifact.md` beside this file. The brief pastes full text, never references: context, visual spec, the phase section. The commit instruction is the one from the delivering skill (decision D4), replacing the phase skill's "Do NOT commit"; `<commit format>` (old text: `/commit-message-format`) is the project's own commit format source (rule `commit-format`), else the absolute path of primitive `commit-message`. The progress path is exempt in rule `plans-stay-local`. Source: skills/delivery/execute-phase/SKILL.md:244-281; skills/delivery/implement-feature/SKILL.md:84-87 (commit lines)

**Slots.**

| Slot                           | Filled with                                  | Required | When empty                            |
| ------------------------------ | -------------------------------------------- | -------- | ------------------------------------- |
| `<worktree-absolute-path>`     | absolute path of the phase worktree          | yes      | never empty                           |
| `<N>`, `<plan-name>`           | phase number; plan name per `phase-progress` | yes      | never empty                           |
| `<paste context section>`      | the plan's `## Context` section in full      | no       | drop the whole `## Context` block     |
| `<paste visual spec section>`  | the plan's `## Visual Spec` section in full  | no       | drop the whole `## Visual Spec` block |
| `<paste full phase section …>` | the plan's `## Phase <N>` section in full    | yes      | never empty                           |
| `<commit format>`              | as defined above                             | yes      | never empty                           |

Plan text pasted into the brief travels fenced (rule `fence-external-text`). The brief also carries the active rules (rule `brief-carries-rules`).

**Check.** The brief as sent, compared block by block against the artifact; each pasted section matched against the plan file.

**Version.** 0.1.0. Producers: goal `plan-delivered` (dispatch), goal `phase-executed`. Consumer: phase agents.
