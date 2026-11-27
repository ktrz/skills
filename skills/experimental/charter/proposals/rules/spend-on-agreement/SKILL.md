---
name: spend-on-agreement
version: 0.1.0
disable-model-invocation: true
description: No run that spends real money (paid model calls, eval suites) starts before the user agreed its call count and cost.
---

# Rule: spend on agreement

**Rule.** No run that spends real money (paid model calls, eval suites) starts before the user agreed its call count and cost.

**Why.** Spend is irreversible, and an unneeded rerun cannot be taken back.

**Applies.** Metered runs beyond the session's own model usage: scripted API calls, eval suites, paid third-party services. Exempt: runs inside a budget the user already set for the task.

**Check.** The estimate and the user's agreement both precede the run, and the actual count is reported against the estimate.

**If it blocks you.** Treat it as `record-dont-guess`: record the decision needed and stop the affected part.
