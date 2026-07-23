# Changelog

## 1.1.0

- Add Trust Boundaries section + carry a copy of `_shared/references/prompt-injection-defense.md` (synced via `_shared/manifest.yaml`). `nwt` only reads `gh api user --jq .login` from outside the trust boundary; the section documents that surface and the constraints that keep it safe.
- CodeRabbit review fix: `_nwt_resolve_prefix` now distinguishes an explicitly-empty `NWT_BRANCH_PREFIX`/`git config` override ("no prefix") from the source being unset entirely, using each source's own presence signal (`git config --get` exit status, `${VAR+set}`) instead of value-emptiness, so an intentional empty override no longer falls through to the next source in the resolution order.

## 1.0.0

- Initial release. Bundles the canonical `nwt()` zsh function and an idempotent installer (`scripts/install.sh`) that appends a `source` line — plus a commented `NWT_BRANCH_PREFIX` hint — to `~/.zshrc`.
- Auto-detects repo layout: **umbrella** (cwd has `main/` sibling → worktree at `./<feature>/`, copies from `main/`) vs **regular** (cwd is repo root → worktree at `./worktrees/<feature>/`, copies from `.`). Refuses cleanly when run from inside an existing worktree or a non-git dir.
- Configurable branch prefix. Resolution order: `git config nwt.branchPrefix` (per-repo) → `$NWT_BRANCH_PREFIX` (env) → auto (`gh api user --jq .login`, cached in `git config --global nwt.githubUser`) → `$USER` fallback.
- Seeded copies (`.env.local`, `.npmrc`, `.idea/`, `.claude/settings.local.json`, `.claude/plans/.local/`) follow the detected source dir. Regular mode auto-creates `./worktrees/` and prints a hint if it's missing from `.gitignore` (no auto-edit of user files).
- SKILL.md documents agent-invocation quirks (zsh-only function, `cd` doesn't persist, no `--help` flag), feature-name rules, post-create verification via `git -C … rev-parse`, and cleanup commands.
