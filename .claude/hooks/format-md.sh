#!/usr/bin/env bash
# PostToolUse hook: run prettier --write on markdown files touched by Edit/Write/MultiEdit.
# Stays silent on success; surfaces prettier diagnostics only when prettier fails.
set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')

[[ -z "$file" ]] && exit 0
[[ "$file" != *.md && "$file" != *.markdown ]] && exit 0
[[ ! -f "$file" ]] && exit 0

cd "$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null || dirname "$file")"

export npm_config_update_notifier=false
export npm_config_fund=false
export npm_config_audit=false

output=$(npx --yes --quiet prettier@3 --write --log-level=warn "$file" 2>&1)
status=$?
if [[ $status -ne 0 ]]; then
  echo "$output" >&2
  echo "prettier failed on $file" >&2
  exit 1
fi
