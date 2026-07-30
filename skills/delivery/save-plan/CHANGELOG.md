# Changelog

## 1.0.1

- The project subdirectory under `plans.local/` is now derived from the **main** repository's git directory (`git rev-parse --git-common-dir`, canonicalized) instead of the basename of the worktree toplevel, so it is stable across worktrees. Saving from a worktree previously wrote to `plans.local/<worktree-name>/` rather than `plans.local/<repo>/`, fragmenting the plan tree. `allowedTools` gained the `dirname`/`cd`/`pwd` primitives the new derivation needs. Pre-existing worktree-named directories are **not** migrated.
- Step 2b no longer treats every session file as a match for the current slug: slug matching covers only `PLAN-<slug>.md`, `NOTES-<slug>.md` and plain `<slug>.md`, while `SESSION-<date>.md` files are listed separately. Session files carry a date and not a slug, so an unrelated session no longer triggers a spurious topic-promotion prompt, and folding a session file into a topic directory is explicitly confirmation-gated.
