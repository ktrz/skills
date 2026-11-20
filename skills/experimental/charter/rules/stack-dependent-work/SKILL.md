---
name: stack-dependent-work
version: 0.1.0
disable-model-invocation: true
description: Work that depends on an unmerged branch is based on that branch, never on a copy of its changes.
---

# Rule: stack dependent work

**Rule.** Work that depends on an unmerged branch is based on that branch, never on a copy of its changes.

**Why.** Copied changes create duplicate commits and conflicts when the original branch lands, and the reviewer cannot tell which lines belong to this change.

**Applies.** Any change that needs code from a branch or PR not yet merged into the default branch. Exempt: work that needs nothing from unmerged branches.

**Check.** You can show the branch's base (the parent branch name and the merge-base SHA) and that `git log <parent>..HEAD` lists only this change's commits. The PR targets the parent branch.

**If it blocks you.** If the parent branch is itself in flux or its owner is unclear, stop and record the decision needed (`record-dont-guess`). Do not copy its changes in as a shortcut.
