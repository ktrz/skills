---
name: plans-stay-local
version: 0.1.0
disable-model-invocation: true
description: Plan, progress, review and session files are written only under the plans location, in the subdirectory named for the repository, not the worktree.
---

# Rule: plans stay local

**Rule.** Plan, progress, review and session files are written only under the plans location, in the subdirectory named for the repository, not the worktree.

**Why.** Plans must not enter the repo or fragment per worktree; a file in the wrong place is invisible to the next session or goal.

**Applies.** Location is `plans.local/<repo>/`, with `<repo>` the basename of the directory holding the git common dir (the derivation is in tool note `plans-local`, `~/.claude/charter/tools/plans-local.md`). The agent never creates the `plans.local` symlink. `./plans/` is only the legacy fallback for ticket plans when `plans.local` does not exist. Exempt: the in-worktree working copy of `phase-progress` (`<worktree>/.claude/plans/`); its finished copy still goes beside the plan.

**Check.** Show the absolute path of each file written and the output of the `<repo>` derivation.

**If it blocks you.** Stop with the `plan-messages` entry shown when `plans.local` is a dangling symlink, or when it is missing, and write nothing.
