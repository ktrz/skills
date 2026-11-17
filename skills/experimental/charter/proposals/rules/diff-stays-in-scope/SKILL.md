---
name: diff-stays-in-scope
version: 0.1.0
disable-model-invocation: true
description: Every changed file and line in the diff traces to the request; no drive-by formatting, unrelated fixes, unrequested helpers or shims, generated files or logs.
---

# Rule: diff stays in scope

**Rule.** Every changed file and line in the diff traces to the request; no drive-by formatting, unrelated fixes, unrequested helpers or shims, generated files or logs.

**Why.** Oversized diffs are found only at review, and pointless extras then have to be removed.

**Applies.** Every commit and PR. Exempt: changes a failing check forces, noted as such. An unrelated fix is listed in the report (ticketed per `defer-means-ticket`), not made.

**Check.** The diff stat against the base shows each file mapped to an acceptance criterion or finding; no untracked or generated files are staged.

**If it blocks you.** Treat it as `record-dont-guess`: record the decision needed and stop the affected part.
