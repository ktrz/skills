#!/usr/bin/env bash
# Install nwt() into ~/.zshrc by appending a sourced reference to scripts/nwt.zsh.
# Idempotent: re-running does nothing if the marker line is already present.
#
# Usage:
#   ./install.sh                 # append `source` line (recommended)
#   ./install.sh --inline        # append the function body directly instead

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NWT_PATH="$SCRIPT_DIR/nwt.zsh"
ZSHRC="${ZDOTDIR:-$HOME}/.zshrc"
MARKER="# >>> nwt skill"

if [ ! -f "$NWT_PATH" ]; then
  echo "error: $NWT_PATH not found" >&2
  exit 1
fi

if [ ! -f "$ZSHRC" ]; then
  echo "error: $ZSHRC not found — create it first or set ZDOTDIR" >&2
  exit 1
fi

if grep -qF "$MARKER" "$ZSHRC"; then
  echo "nwt already installed in $ZSHRC — nothing to do"
  exit 0
fi

mode="${1:-source}"

case "$mode" in
  --inline)
    {
      printf '\n%s (inline)\n' "$MARKER"
      printf '# Optional: pin branch prefix. Otherwise auto: gh handle (cached) → $USER.\n'
      printf '# export NWT_BRANCH_PREFIX="myteam/"\n'
      cat "$NWT_PATH"
      printf '# <<< nwt skill\n'
    } >> "$ZSHRC"
    echo "Appended nwt function body to $ZSHRC"
    ;;
  *)
    {
      printf '\n%s\n' "$MARKER"
      printf '# Optional: pin branch prefix. Otherwise auto: gh handle (cached) → $USER.\n'
      printf '# export NWT_BRANCH_PREFIX="myteam/"\n'
      printf '[ -f "%s" ] && source "%s"\n' "$NWT_PATH" "$NWT_PATH"
      printf '# <<< nwt skill\n'
    } >> "$ZSHRC"
    echo "Appended source line for $NWT_PATH to $ZSHRC"
    ;;
esac

echo "Run: source $ZSHRC   # to load nwt in the current shell"
