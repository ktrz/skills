---
name: foreground-below-root
version: 0.1.0
disable-model-invocation: true
description: Only the root session dispatches in the background; every agent below it runs helpers in the foreground and waits for them.
---

# Rule: foreground below root

**Rule.** Only the root session dispatches in the background; every agent below it runs helpers in the foreground and waits for them.

**Why.** A background grandchild outlives the child that started it, so its result is lost and its work is left running with no one to read it.

**Applies.** All delegation. A child waits for every grandchild to finish and never returns while work it started is still running: no background agents, no background shells, no waiting across turns. Grandchildren are dispatched with `run_in_background: false` stated explicitly. Every brief states this, because children do not load this rule. Exempt: none.

**Check.** Show `run_in_background` for each dispatch. Below the root it is false, and no child's report arrived while it still had work running.

**If it blocks you.** If the agent tool can only start background agents, the child does that step itself instead of delegating it.
