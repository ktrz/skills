# Changelog

## 1.3.0

- Worktree creation now works when the repository's default branch exists only on the remote: if `refs/heads/<default>` is absent but `refs/remotes/origin/<default>` exists, a local tracking branch is materialized before `nwt` is called. Previously `nwt`'s `git worktree add … -b <feature> <remote-only-base>` **silently ignored `-b`** with a single remote and left the worktree checked out on the default branch instead of the feature branch (and failed outright when two or more remotes carried the name). If the branch exists neither locally nor on `origin`, the step now errors with an explanatory message instead of proceeding.
- Plan-file lookup no longer selects the wrong ticket's plan. The ticket key is normalized first — leading `#` stripped and lowercased via a quoted `printf`, because a raw `#567` inside `$(echo …)` opened a shell comment and broke the command — and matching is now a token-anchored post-filter, so `PROJ-1` no longer selects `PROJ-10`. The search also runs relative to the repository root and re-absolutizes its results: matching against absolute paths meant a worktree directory whose own name contains the key (e.g. `worktrees/skl-1-move` for key `SKL-1`) matched every plan file in the tree.
- Sync `references/tracker.md` from `_shared/`.
