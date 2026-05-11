#!/usr/bin/env bash
# Warn (don't block) when a newly-added SKILL.md lacks the prompt-injection-defense
# doc. Edit ALLOWLIST to exempt skills that don't fetch external content.
#
# Two invocation modes:
#   1. Pre-commit hook: paths passed as "$@", staged-status checked via porcelain.
#   2. CI / standalone: no args, file list computed from
#      `git diff --diff-filter=A --name-only ${BASE_SHA:-HEAD~1}...HEAD -- '*/SKILL.md'`.
set -euo pipefail

ALLOWLIST="commit-message-format create-pr execute-phase implement-feature save-plan simplify caveman caveman-help caveman-commit caveman-review skill-creator"

missing=()

if [ "$#" -eq 0 ]; then
  base="${BASE_SHA:-HEAD~1}"
  files=()
  while IFS= read -r line; do
    files+=("$line")
  done < <(git diff --diff-filter=A --name-only "$base"...HEAD -- '*/SKILL.md' 2>/dev/null || true)
  check_status=0
else
  files=("$@")
  check_status=1
fi

for skill_file in "${files[@]:-}"; do
  [ -n "$skill_file" ] || continue

  if [ "$check_status" -eq 1 ]; then
    # Pre-commit mode: only files staged as new (index column = A)
    status=$(git status --porcelain -- "$skill_file" 2>/dev/null | cut -c1)
    if [ "$status" != "A" ]; then
      continue
    fi
  fi

  dir=$(dirname "$skill_file")
  name=$(basename "$dir")

  # Skip if skill is in the allowlist
  if echo " $ALLOWLIST " | grep -q " $name "; then
    continue
  fi

  # Warn if defense doc is missing
  if [ ! -f "$dir/references/prompt-injection-defense.md" ]; then
    missing+=("$skill_file")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "WARN: New skills missing references/prompt-injection-defense.md:"
  printf '  %s\n' "${missing[@]}"
  echo "  If the skill fetches external content, add the defense doc and register in _shared/manifest.yaml."
  echo "  If not, add the skill name to ALLOWLIST in _shared/check-new-skill-defense.sh and in .github/workflows/shared-refs-drift.yml."
fi

# Always exit 0 — warn only, never block
exit 0
