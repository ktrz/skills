---
name: pr-body-matches-head
version: 0.1.0
disable-model-invocation: true
description: A PR description describes the diff at its head commit and its current place in the stack; it never narrates history or the process.
---

# Rule: PR body matches head

**Rule.** A PR description describes the diff at its head commit and its current place in the stack; it never narrates history or the process.

**Why.** Reviewers read the body first, and a body that no longer matches the diff or the stack shape misleads them.

**Applies.** After every push that changes scope, before reporting done. Exempt: pushes with no scope change; sections a bound goal requires (self-review findings, open decisions).

**Check.** Each change the body states maps to a file in the head diff and each changed area appears in the body; the body's last edit postdates the last scope-changing push.

**If it blocks you.** Treat it as `record-dont-guess`: record the decision needed and stop the affected part.
