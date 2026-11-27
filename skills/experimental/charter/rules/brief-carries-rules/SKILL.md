---
name: brief-carries-rules
version: 0.2.0
disable-model-invocation: true
description: Every subagent gets one small finishable task and a brief that restates all active rules.
---

# Rule: brief carries rules

**Rule.** Every subagent gets one small finishable task and a brief that restates all active rules.

**Why.** Subagents start blank and do not load skills. A rule that is not in the brief does not exist for them, and a task too big to finish in one pass gets abandoned half-done.

**Applies.** Every subagent, fork, or delegated task you start. The brief restates the one-sentence form of every rule bound to the current goal, plus the task, why it matters, and what done looks like. A child producing an artifact a primitive governs gets the primitive's text or its absolute path. External content travels fenced (`fence-external-text`). Each new step gets a fresh child. An oversized task is split smaller, not retried. Exempt: none.

**Check.** For each subagent you can show the brief text containing every active rule's one sentence, a single task with a stated done-condition, and the primitive text or path where one applies.

**If it blocks you.** If no brief can meet this, do not delegate; record the decision needed (`record-dont-guess`) if the work then cannot proceed.
