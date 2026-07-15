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
#   REPO_ROOT   default: /Users/chris/projects/skills
#   SKILLS_DIR  default: ~/.claude/skills
set -euo pipefail

REPO=${1:-/Users/chris/projects/skills}
SKILLS_DIR=${2:-"$HOME/.claude/skills"}

# Normalise REPO to an absolute, symlink-resolved path for prefix matching.
REPO=$(cd "$REPO" && pwd -P)

repointed=0
skipped_worktree=0
skipped_foreign=0
skipped_missing=0
already=0

for link in "$SKILLS_DIR"/*; do
  [ -L "$link" ] || continue
  name=$(basename "$link")
  target=$(readlink "$link")

  # Only consider targets that live inside this repo checkout.
  case "$target" in
    "$REPO"/*) ;;
    *) continue ;;
  esac

  # Leave parallel-test installs (targets under worktrees/) untouched.
  case "$target" in
    "$REPO"/worktrees/*)
      echo "leave  $name -> $target (worktree parallel-test install)"
      skipped_worktree=$((skipped_worktree + 1))
      continue
      ;;
  esac

  # Already migrated into skills/<group>/ — nothing to do.
  case "$target" in
    "$REPO"/skills/*)
      already=$((already + 1))
      continue
      ;;
  esac

  # At this point the target is a top-level "<repo>/<something>". Only re-point
  # if it names a skill that now lives under skills/<group>/<name>.
  new=""
  if [ -d "$REPO/skills" ]; then
    new=$(find "$REPO/skills" -mindepth 2 -maxdepth 2 -type d -name "$name" 2>/dev/null | head -1 || true)
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
echo "repointed=$repointed already-migrated=$already leave-worktree=$skipped_worktree not-found=$skipped_missing"
