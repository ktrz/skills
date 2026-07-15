#!/usr/bin/env bash
# UserPromptSubmit hook: sticky one-line reminder while orchestrate mode is on.
#
# Reads the hook payload JSON from stdin, toggles a session-keyed flag file on
# "/orchestrate ..." / "orchestrate: ..." (on) and "/orchestrate off" /
# "stop orchestrat..." (off), and prints the ACTIVE reminder line whenever the
# flag exists. Empty stdout = nothing injected into the prompt.
#
# MUST NEVER BLOCK THE PROMPT: UserPromptSubmit exit code 2 blocks submission,
# so every failure path (missing jq, malformed stdin, missing session_id)
# exits 0 with empty stdout.
set -uo pipefail

command -v jq >/dev/null 2>&1 || exit 0

payload=$(cat 2>/dev/null) || exit 0

prompt=$(printf '%s' "$payload" | jq -r '.prompt // empty' 2>/dev/null) || exit 0
session_id=$(printf '%s' "$payload" | jq -r '.session_id // empty' 2>/dev/null) || exit 0

# Reject empty or path-unsafe session ids (the id names a file under state_dir).
[[ "$session_id" =~ ^[A-Za-z0-9._-]+$ ]] || exit 0

state_dir="${ORCHESTRATE_STATE_DIR:-${TMPDIR:-/tmp}}"
flag="${state_dir%/}/orchestrate-${session_id}"

case "$prompt" in
  "/orchestrate off"* | "stop orchestrat"*)
    rm -f "$flag" 2>/dev/null
    exit 0
    ;;
  "/orchestrate"* | "orchestrate:"*)
    mkdir -p "$state_dir" 2>/dev/null || exit 0
    touch "$flag" 2>/dev/null || exit 0
    ;;
esac

if [[ -f "$flag" ]]; then
  echo 'ORCHESTRATE ACTIVE — delegate per tier: haiku bulk(low) / sonnet research(med) / opus multi-step(xhigh) / fable judgment(med). Parent only decomposes, briefs, judges, synthesizes. "/orchestrate off" to stop.'
fi

exit 0
