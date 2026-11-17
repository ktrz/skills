---
name: named-targets-only
version: 0.1.0
disable-model-invocation: true
description: No worktree, branch, stash, PR, ticket or other session's file that this session did not create is deleted, reset, stashed, closed or modified unless the user named that exact target.
---

# Rule: named targets only

**Rule.** No worktree, branch, stash, PR, ticket or other session's file that this session did not create is deleted, reset, stashed, closed or modified unless the user named that exact target.

**Why.** A cleanup that removes more than was named leaves no backup; parallel sessions collide on shared worktrees, stashes and ports.

**Applies.** Worktrees, branches, stashes, PRs, tickets, and files belonging to sibling sessions. An existing file or issue is not overwritten or regenerated without the user choosing it. Exempt: none.

**Check.** The report lists each destructive command, its exact targets, and for each target either its creation in this session or the user message naming it.

**If it blocks you.** Treat it as `record-dont-guess`: record the decision needed and stop the affected part.
