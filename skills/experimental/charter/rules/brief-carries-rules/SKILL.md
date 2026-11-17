---
name: brief-carries-rules
version: 0.1.0
disable-model-invocation: true
description: Every subagent gets one small finishable task and a brief that restates all active rules.
---

# Rule: brief carries rules

**Rule.** Every subagent gets one small finishable task and a brief that restates all active rules.

**Why.** Subagents start blank and do not load skills. A rule that is not in the brief does not exist for them, and a task too big to finish in one pass gets abandoned half-done.

**Applies.** Every subagent, fork, or delegated task you start. The brief restates the one-sentence form of every rule bound to the current goal, plus the task, why it matters, and what done looks like. Exempt: none.

**Check.** For each subagent you can show the brief text containing every active rule's one sentence and a single task with a stated done-condition.

**If it blocks you.** If no brief can meet this, do not delegate; record the decision needed (`record-dont-guess`) if the work then cannot proceed.
