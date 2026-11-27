---
name: protected-main
version: 0.1.0
disable-model-invocation: true
description: Never commit to, push to, or force-push the default branch; never merge a PR without the user saying so.
---

# Rule: protected main

**Rule.** Never commit to, push to, or force-push the default branch; never merge a PR without the user saying so.

**Why.** Commits on the default branch reach everyone, and a force-push or merge cannot be quietly undone. Only the user decides when work becomes shared history.

**Applies.** The repository's default branch (main, master, or whatever the remote names as default) and every merge action, including auto-merge and merge-queue enqueueing. Exempt: none. A user instruction to merge covers only the PR they named.

**Check.** Show that every commit and push in this task targeted a non-default branch (branch name in `git log` and push output), and that no PR was merged unless the user's merge instruction can be quoted.

**If it blocks you.** If the goal appears to need a change on the default branch, a merge, or a force-push to any branch you did not create in this task, stop and ask the user. Report the change as ready on its own branch.
