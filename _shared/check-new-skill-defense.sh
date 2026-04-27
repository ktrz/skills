#!/usr/bin/env bash
# Pre-commit hook: warn (don't block) when a newly-added SKILL.md lacks the
# prompt-injection-defense doc.  Edit ALLOWLIST to exempt skills that don't
# fetch external content.
set -euo pipefail

ALLOWLIST="commit-message-format create-pr execute-phase implement-feature save-plan simplify caveman caveman-help caveman-commit caveman-review skill-creator"

missing=()

for skill_file in "$@"; do
  # Only care about files that git considers newly added (status A)
  status=$(git status --porcelain -- "$skill_file" 2>/dev/null | cut -c1-2 | tr -d ' ')
  if [ "$status" != "A" ]; then
    continue
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
