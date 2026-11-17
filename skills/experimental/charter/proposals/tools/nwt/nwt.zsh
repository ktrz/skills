# Git worktree helper function
# Usage: nwt <feature-name> [base-branch]
#
# Supported repo layouts (auto-detected):
#   umbrella — cwd has a main/ worktree sibling; new worktree at ./<feature>/
#   regular  — cwd is a repo root (working tree); new worktree at ./worktrees/<feature>/
#
# Branch name: <prefix><feature>. Prefix resolution order (first non-empty wins):
#   1. git config --get nwt.branchPrefix       (per-repo override)
#   2. $NWT_BRANCH_PREFIX                       (shell env)
#   3. auto: gh CLI handle → $USER fallback     (cached in git config --global nwt.githubUser)
#
# To reset the cached auto-detected handle:
#   git config --global --unset nwt.githubUser

_nwt_default_prefix() {
  local handle
  handle="$(git config --global --get nwt.githubUser 2>/dev/null)"
  if [ -z "$handle" ] && command -v gh >/dev/null 2>&1; then
    handle="$(gh api user --jq .login 2>/dev/null)"
    [ -n "$handle" ] && git config --global nwt.githubUser "$handle"
  fi
  [ -z "$handle" ] && handle="$USER"
  printf '%s/' "$handle"
}

_nwt_resolve_prefix() {
  local p
  # Use each source's own presence signal, not value-emptiness — `git config
  # --get`'s exit status (0 = key present, even if set to ""; 1 = absent) and
  # `${VAR+set}` for the env var — so an explicitly empty override ("no
  # prefix", per SKILL.md) is distinguishable from the source being unset and
  # doesn't fall through to the next source.
  if p="$(git config --get nwt.branchPrefix 2>/dev/null)"; then
    printf '%s' "$p"
    return
  fi
  if [ "${NWT_BRANCH_PREFIX+set}" = set ]; then
    printf '%s' "$NWT_BRANCH_PREFIX"
    return
  fi
  _nwt_default_prefix
}

# Echoes "<mode> <source_dir>" on success, prints error + non-zero on failure.
#   umbrella → source_dir = main
#   regular  → source_dir = .
_nwt_detect_mode() {
  # `git rev-parse --is-inside-work-tree` prints "true" or "false" with exit 0
  # when inside any git context (including a bare repo's parent dir with a .git
  # file pointing at the bare); it exits non-zero only when there's no git
  # context at all. We must inspect the output, not just the exit code.
  local in_wt top
  in_wt="$(git rev-parse --is-inside-work-tree 2>/dev/null)"
  if [ "$in_wt" = "true" ]; then
    # In a regular repo root, .git is a directory. In a linked worktree (umbrella
    # main/, or any worktree created by `git worktree add`), .git is a *file*
    # pointing into the common gitdir. We refuse the latter so nwt isn't run
    # from inside an existing worktree by mistake.
    if [ -d .git ]; then
      printf 'regular .\n'
      return 0
    fi
    top="$(git rev-parse --show-toplevel)"
    echo "nwt: refusing to run from inside a worktree ($top). cd to the repo root or umbrella dir." >&2
    return 1
  fi
  if [ -d main ] && [ "$(git -C main rev-parse --is-inside-work-tree 2>/dev/null)" = "true" ]; then
    printf 'umbrella main\n'
    return 0
  fi
  echo "nwt: cwd is neither an umbrella dir (with main/ worktree) nor a regular repo root." >&2
  return 1
}

nwt() {
  if [ -z "$1" ]; then
    echo "Usage: nwt <feature-name> [base-branch]"
    return 1
  fi

  local feature_name="$1"
  local base_branch="${2:-main}"

  local mode_line mode source_dir
  mode_line="$(_nwt_detect_mode)" || return 1
  mode="${mode_line%% *}"
  source_dir="${mode_line#* }"

  local worktree_path
  case "$mode" in
    umbrella)
      worktree_path="./$feature_name"
      ;;
    regular)
      worktree_path="./worktrees/$feature_name"
      mkdir -p ./worktrees
      if [ -f .gitignore ] && ! grep -qE '^worktrees/?$' .gitignore; then
        echo "Tip: add 'worktrees/' to .gitignore so new worktrees don't show as untracked."
      fi
      ;;
  esac

  local prefix branch_name
  prefix="$(_nwt_resolve_prefix)"
  branch_name="${prefix}${feature_name}"

  # Create worktree
  git worktree add "$worktree_path" -b "$branch_name" "$base_branch" || return 1
  mkdir -p "$worktree_path/.claude/plans"

  # Copy .env.local if it exists
  if [ -f "$source_dir/.env.local" ]; then
    cp "$source_dir/.env.local" "$worktree_path/"
    echo "Copied .env.local"
  else
    echo "No .env.local found"
  fi

  # Copy .npmrc if it exists
  if [ -f "$source_dir/.npmrc" ]; then
    cp "$source_dir/.npmrc" "$worktree_path/"
    echo "Copied .npmrc"
  else
    echo "No .npmrc found"
  fi

  # Copy .idea if it exists
  if [ -d "$source_dir/.idea" ]; then
    cp -r "$source_dir/.idea" "$worktree_path/.idea"
    echo "Copied .idea"
  else
    echo "No .idea found"
  fi

  # Copy .claude/settings.local.json if it exists
  if [ -f "$source_dir/.claude/settings.local.json" ]; then
    mkdir -p "$worktree_path/.claude"
    cp "$source_dir/.claude/settings.local.json" "$worktree_path/.claude/settings.local.json"
    echo "Copied settings.local.json"
  else
    echo "No settings.local.json found"
  fi

  # Copy .claude/plans/.local if it exists
  if [ -d "$source_dir/.claude/plans/.local" ]; then
    cp -r "$source_dir/.claude/plans/.local" "$worktree_path/.claude/plans/.local"
    echo "Copied .claude/plans/.local"
  else
    echo "No .claude/plans/.local found"
  fi

  # Symlink plans.local → ~/projects/plans (shared plans dir across worktrees)
  if [ -d "$HOME/projects/plans" ]; then
    ln -s "$HOME/projects/plans" "$worktree_path/plans.local"
    echo "Linked plans.local → ~/projects/plans"
  else
    echo "No ~/projects/plans found — skipping plans.local symlink"
  fi

  # Change to the new worktree directory
  cd "$worktree_path"
}
