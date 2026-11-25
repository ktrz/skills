#!/usr/bin/env bash
# UserPromptSubmit hook: sticky one-line reminder while orchestrate mode is on.
#
# Reads the hook payload JSON from stdin and keeps a session-keyed flag file:
#   on  — exactly "/orchestrate" or "/orchestrate <args>" (case-sensitive and
#         boundary-anchored: slash commands are lowercase and whole-word, so
#         "/Orchestrate" or "/orchestratefoo" never load the skill and must
#         not arm)
#   off — "/orchestrate off", "/orchestrate off <anything>", or a prompt
#         starting with "stop orchestrat" (all case-INsensitive; fail-open off)
# Prints the ACTIVE reminder line whenever the flag exists. Empty stdout =
# nothing injected into the prompt.
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

# Lowercase copy for the DISARM match only (bash 3.2 has no ${var,,}): off-forms
# are case-insensitive (fail-open to off). The ARM match stays case-sensitive
# against the original prompt — slash commands are lowercase by construction, so
# "/Orchestrate task" never loads the skill and must not arm the reminder.
prompt_lc=$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')

case "$prompt_lc" in
  "/orchestrate off" | "/orchestrate off "* | "stop orchestrat"*)
    # Disarm: exact "/orchestrate off", "/orchestrate off <anything>", or any
    # prompt starting with "stop orchestrat". Evaluated before the arm branch so
    # "/orchestrate off" cannot also match the arm glob.
    rm -f "$flag" 2>/dev/null
    if [[ -e "$flag" ]]; then
      printf 'orchestrate-reminder: failed to remove flag %s\n' "$flag" >&2
    fi
    exit 0
    ;;
  *)
    case "$prompt" in
      "/orchestrate" | "/orchestrate "*)
        # Arm: only the exact slash command arms (with disable-model-invocation
        # the skill loads solely via /orchestrate; anything else arming would be
        # reminder-without-protocol). "/orchestrate offload ..." reaches here,
        # not the disarm branch above.
        if ! mkdir -p "$state_dir" 2>/dev/null || ! touch "$flag" 2>/dev/null; then
          printf 'orchestrate-reminder: could not persist flag %s; reminder is per-invocation only\n' "$flag" >&2
          active_now=1
        fi
        ;;
    esac
    ;;
esac

if [[ -f "$flag" || "${active_now:-}" == 1 ]]; then
  # Effective top-level `runner:` from orchestrate.yaml: repo file beats user file.
  # Long sessions drift back to native subagents unless every prompt names hc.
  runner_of() {
    [[ -f "$1" ]] || return 0
    sed -n "s/^runner:[[:space:]]*[\"']\{0,1\}\([a-z]*\).*/\1/p" "$1" 2>/dev/null | tail -n 1
  }
  cwd=$(printf '%s' "$payload" | jq -r '.cwd // empty' 2>/dev/null)
  repo=""
  [[ -n "$cwd" ]] && repo=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)
  runner=""
  [[ -n "$repo" ]] && runner=$(runner_of "$repo/.claude/orchestrate.yaml")
  [[ -z "$runner" && -n "${HOME:-}" ]] && runner=$(runner_of "$HOME/.claude/orchestrate.yaml")
  hc_clause=""
  if [[ "$runner" == hc ]]; then
    hc_clause=' Runner hc: every child via hc, never the Agent tool — bare `hc run --bg`, brief as one `hc send`, scripts/hc-wait-child.sh in the background; mid-task correction = one `hc send`, not a restart.'
  fi
  echo 'ORCHESTRATE ACTIVE — delegate per tier: bulk(low) / scoped(med) / multi-step(med) / judgment(med), xhigh only for hardest calls, models per the skill tier table and orchestrate.yaml. Size by inputs: unmapped code → scout + implementer; briefs inline conventions with line ranges, never "read in full". Parent only decomposes, briefs, judges, synthesizes.'"$hc_clause"' "/orchestrate off" to stop.'
fi

exit 0
