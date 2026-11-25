#!/usr/bin/env bash
# Wait for one hc child to finish: its report's last line is END.
#
# Usage: hc-wait-child.sh <child> <report-path> [max-seconds]
#
# Run it in the background (Claude Code: run_in_background); its exit is the
# "child finished" signal. Child status is never taken as completion:
#   - a fresh child shows `idle` (turn 0) before its first turn,
#   - a child that backgrounds work ends its turn `done` before the report exists,
#   - some harnesses (opencode) never report status (`null`).
# Only the report, child exit, or a blocked/error status end the wait.
#
# stdout: one line `hc-wait-child: <child> <result> ...`
# exit: 0 done (report ends in END) | 2 child exited, no END | 3 child unknown
#       | 4 blocked (dialog: tell the user, `hc attach <child>`) | 5 error status
#       | 124 max-seconds passed | 64 usage or jq missing
set -uo pipefail

child=${1:-}
report=${2:-}
max=${3:-0}
poll=${HC_WAIT_POLL:-10}

if [[ -z "$child" || -z "$report" || ! "$max" =~ ^[0-9]+$ ]]; then
  echo "usage: hc-wait-child.sh <child> <report-path> [max-seconds]" >&2
  exit 64
fi
command -v jq >/dev/null 2>&1 || { echo "hc-wait-child: jq not found" >&2; exit 64; }

start=$SECONDS
finish() { echo "hc-wait-child: $child $1"; exit "$2"; }
has_end() { [[ -f "$report" ]] && [[ "$(tail -n 1 "$report" | tr -d '[:space:]')" == END ]]; }

while :; do
  has_end && finish "done report=$report" 0

  if ! json=$(hc get "$child" --json 2>/dev/null); then
    finish "unknown (hc get failed)" 3
  fi
  # Top-level .state is the terminal lifecycle (live, exited, ...);
  # .status.state is the agent's own status. Never grep: records.<id>.state also exists.
  life=$(jq -r '.state // empty' <<<"$json")
  status=$(jq -r '.status.state // "null"' <<<"$json")
  turn=$(jq -r '.turn // 0' <<<"$json")

  if [[ "$life" != live ]]; then
    has_end && finish "done report=$report" 0
    finish "exited without END (state=$life turn=$turn); hc read $child --lines 80" 2
  fi
  case "$status" in
    blocked) finish "blocked (turn=$turn); tell the user: hc attach $child" 4 ;;
    error) finish "error status (turn=$turn); hc read $child --lines 80" 5 ;;
  esac

  if (( max > 0 && SECONDS - start >= max )); then
    finish "still running after ${max}s (status=$status turn=$turn)" 124
  fi

  if [[ "$status" == working ]]; then
    # Returns when the child stops working; the loop then re-checks the report.
    hc wait "$child" --timeout 180 >/dev/null 2>&1 || sleep "$poll"
  else
    # idle/done/null: hc wait would return at once (or, for null, only on exit).
    sleep "$poll"
  fi
done
