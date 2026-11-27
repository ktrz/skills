---
name: fix-where-written
version: 0.1.0
disable-model-invocation: true
description: A fix to lines introduced by a lower branch of a stack is committed on that branch, never on a branch above it.
---

# Rule: fix where written

**Rule.** A fix to lines introduced by a lower branch of a stack is committed on that branch, never on a branch above it.

**Why.** A fix placed higher leaves the lower PR wrong on its own and hides the change from that PR's reviewers.

**Applies.** Review fixes and bug fixes in stacked work. Branches above the fix are rebased onto the result. Exempt: unstacked branches.

**Check.** For each fix, the branch that introduced the fixed lines (blame or log) equals the branch holding the fix commit.

**If it blocks you.** Treat it as `record-dont-guess`: record the decision needed and stop the affected part.
