#!/usr/bin/env bash
# Re-point installed skill symlinks (~/.claude/skills/<name>) after skills move
# between directories — the skills/<group>/ restructure (Phase 0) and, later,
# graduations that git-mv a skill from one bucket to another.
#
# The symlink NAME never changes (installed skill name, triggers, and context
# footprint stay identical) — only the target re-points to the skill's new
# location inside the repo checkout.
#
# Safe + idempotent by design:
#   - Only touches symlinks whose target currently resolves to "<repo>/<name>"
#     (a top-level skill dir) — i.e. installs that predate the restructure.
#   - Leaves alone: targets under "<repo>/worktrees/..." (deliberate
#     parallel-test installs), targets outside <repo>, and targets that already
#     point into "<repo>/skills/..." (already migrated).
#   - Re-points ONLY when the skill is found at its new "<repo>/skills/<group>/<name>"
#     home. If the grouped tree is not present yet (e.g. run before the
#     restructure PR has merged into the checkout), it skips and reports — it
#     never creates a dangling link, so a live install is never broken.
#
# Usage: repoint-skill-symlinks.sh [REPO_ROOT] [SKILLS_DIR]
#   REPO_ROOT   default: the repo this script ships in, derived from the
#               script's own location (it lives in _shared/, so its parent is
#               the repo root). Override with the REPO_ROOT env var or the
#               first positional argument.
#   SKILLS_DIR  default: ~/.claude/skills
set -euo pipefail

# Derive the default repo root from the script's own location so no personal
# path is baked into this published script. Precedence: positional arg, then
# the REPO_ROOT env var, then the script-relative default (_shared/..).
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
REPO=${1:-${REPO_ROOT:-"$script_dir/.."}}
SKILLS_DIR=${2:-"$HOME/.claude/skills"}

# Normalise REPO to an absolute, symlink-resolved path for prefix matching.
# Guard the cd so a bad REPO_ROOT yields a framed error naming the argument,
# not set -e's terse, context-free cd abort. Resolve into a temp var first so
# the original value survives for the error message (a failed cd substitution
# would otherwise blank REPO out).
if ! repo_resolved=$(cd "$REPO" 2>/dev/null && pwd -P); then
  echo "repoint: REPO_ROOT '$REPO' is not a directory — pass it as the first argument or set \$REPO_ROOT" >&2
  exit 1
fi
REPO=$repo_resolved

repointed=0
skipped_worktree=0
skipped_foreign=0
skipped_missing=0
already=0
failed=0

for link in "$SKILLS_DIR"/*; do
  [ -L "$link" ] || continue
  name=$(basename "$link")
  target=$(readlink "$link")

  # readlink returns the raw target as recorded in the symlink. A relative
  # target is relative to the symlink's own directory, not to $PWD — resolve
  # it to an absolute path before the "$REPO"/* prefix check below, or a
  # perfectly in-repo relative symlink gets misclassified as foreign.
  case "$target" in
    /*) abs_target=$target ;;
    *)
      if dir_resolved=$(cd "$(dirname "$link")" && cd "$(dirname "$target")" 2>/dev/null && pwd -P); then
        abs_target="$dir_resolved/$(basename "$target")"
        # The directory portion is now canonical, but if the final path
        # component is itself a symlink to a directory, it can still point
        # outside the repo while its own unresolved name makes the "$REPO"/*
        # prefix check below pass. Resolve it too: cd into it and take
        # pwd -P. This only fires for a directory symlink that itself
        # resolves (via -d, which follows the link) — a dangling link or a
        # symlink-to-file falls through untouched, so a dangling target
        # still yields today's directory-only resolution and the "never
        # create a dangling link" guarantee is unaffected.
        if [ -L "$abs_target" ] && [ -d "$abs_target" ]; then
          if final_resolved=$(cd "$abs_target" 2>/dev/null && pwd -P); then
            abs_target=$final_resolved
          fi
        fi
      else
        abs_target=$target
      fi
      ;;
  esac

  # Only consider targets that live inside this repo checkout.
  case "$abs_target" in
    "$REPO"/*) ;;
    *)
      skipped_foreign=$((skipped_foreign + 1))
      continue
      ;;
  esac

  # Leave parallel-test installs (targets under worktrees/) untouched.
  case "$abs_target" in
    "$REPO"/worktrees/*)
      echo "leave  $name -> $target (worktree parallel-test install)"
      skipped_worktree=$((skipped_worktree + 1))
      continue
      ;;
  esac

  # Already migrated into skills/<group>/ — nothing to do.
  case "$abs_target" in
    "$REPO"/skills/*)
      already=$((already + 1))
      continue
      ;;
  esac

  # Require an exact top-level legacy target: "$REPO/<name>" only. Without
  # this, a nested or non-canonical path like "$REPO/docs/$name" would fall
  # through to the lookup below and could be misclassified as a pre-restructure
  # install and repointed onto an unrelated skills/<group>/$name.
  if [ "$(dirname "$abs_target")" != "$REPO" ] || [ "$(basename "$abs_target")" != "$name" ]; then
    skipped_foreign=$((skipped_foreign + 1))
    continue
  fi

  # At this point the target is a top-level "<repo>/<something>". Only re-point
  # if it names a skill that now lives under skills/<group>/<name>. Exclude
  # skills/wip/: a bare-name install must never be re-pointed onto a wip
  # variant, whose directory basename equals the stable skill's name.
  new=""
  if [ -d "$REPO/skills" ]; then
    matches=$(find "$REPO/skills" -mindepth 2 -maxdepth 2 -type d -name "$name" \
      -not -path "$REPO/skills/wip/*" 2>/dev/null)
    match_count=$(printf '%s' "$matches" | grep -c . || true)
    if [ "$match_count" -gt 1 ]; then
      echo "error  $name -> $target: multiple skills/<group>/$name candidates, refusing to guess:" >&2
      printf '         %s\n' "$matches" >&2
      failed=$((failed + 1))
      continue
    fi
    new=$matches
  fi
  if [ -z "$new" ]; then
    echo "skip   $name -> $target (no skills/<group>/$name found under $REPO/skills — grouped tree not present yet?)"
    skipped_missing=$((skipped_missing + 1))
    continue
  fi

  ln -sfn "$new" "$link"
  echo "repoint $name -> $new"
  repointed=$((repointed + 1))
done

echo "---"
echo "repointed=$repointed already-migrated=$already leave-worktree=$skipped_worktree not-found=$skipped_missing foreign=$skipped_foreign failed=$failed"

if [ "$failed" -gt 0 ]; then
  exit 1
fi
