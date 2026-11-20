---
name: one-worktree-per-stack
version: 0.1.0
disable-model-invocation: true
description: A stack lives in exactly one worktree; no branch of it is checked out in a second one, and no extra worktree is created per phase or per PR.
---

# Rule: one worktree per stack

**Rule.** A stack lives in exactly one worktree; no branch of it is checked out in a second one, and no extra worktree is created per phase or per PR.

**Why.** A second worktree holding a stack branch breaks rebases and stalls unattended runs.

**Applies.** All stacked work. Exempt: a separate PR off the default branch for an unrelated fix.

**Check.** `git worktree list` shows at most one worktree whose checked-out branch belongs to the stack.

**If it blocks you.** If a stack branch is already checked out elsewhere, stop and report where. Do not remove that worktree unless the user names it.
