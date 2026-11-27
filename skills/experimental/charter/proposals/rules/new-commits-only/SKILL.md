---
name: new-commits-only
version: 0.1.0
disable-model-invocation: true
description: A commit that has been pushed is never amended, squashed or dropped; changes arrive as new commits.
---

# Rule: new commits only

**Rule.** A commit that has been pushed is never amended, squashed or dropped; changes arrive as new commits.

**Why.** Rewrites break review anchors and can strip signatures.

**Applies.** All pushed commits. Exempt: a stack tool's own rebase, and an explicit user request.

**Check.** Every push in the session is a fast-forward (push output shows no forced update), except pushes made by the stack tool or on explicit user request.

**If it blocks you.** Treat it as `record-dont-guess`: record the decision needed and stop the affected part.
