---
name: isolated-worktree
version: 0.1.0
disable-model-invocation: true
description: All changes happen in a dedicated worktree and branch; the primary checkout is never edited.
---

# Rule: isolated worktree

**Rule.** All changes happen in a dedicated worktree and branch; the primary checkout is never edited.

**Why.** The primary checkout holds the user's own work in progress and other sessions' state. An edit there can clobber it, and changes mixed across tasks cannot be reviewed or reverted separately.

**Applies.** Every task that modifies files in a git repository. Exempt: files outside any repository, and a worktree the user created or named for this task (use it as given).

**Check.** Show the working directory and branch from which every edit and commit was made: the path is a linked worktree, not the primary checkout, and the branch is not the default branch. The primary checkout's `git status` is unchanged from the start of the task.

**If it blocks you.** If no worktree can be created (no git, unsupported layout, create fails), do not edit the primary checkout instead. Record the failure as a `record-dont-guess` event and stop.
