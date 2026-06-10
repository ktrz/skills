#!/usr/bin/env bash
# Re-vendor the handover-doc parser from review-plugin-mvp and rebuild the bundle.
#
#   PLUGIN_REPO=/path/to/review-plugin-mvp bash _shared/handover-validator/sync.sh
#
# Copies src/schema/{parse,types}.ts verbatim into vendor/, then runs
# `npm ci && npm run build` so dist/validate.mjs reflects the new source. The
# handover-validator-drift CI job runs this against the pinned commit and fails
# if anything changed — i.e. the vendored copy has drifted from the plugin, or
# the committed bundle is stale.
set -euo pipefail
cd "$(dirname "$0")"

PLUGIN_REPO="${PLUGIN_REPO:?set PLUGIN_REPO to a review-plugin-mvp checkout}"

for f in parse.ts types.ts; do
  src="$PLUGIN_REPO/src/schema/$f"
  if [[ ! -f "$src" ]]; then
    echo "::error::missing upstream file $src — is PLUGIN_REPO a review-plugin-mvp checkout?" >&2
    exit 1
  fi
  cp "$src" "vendor/$f"
done

# Reproducible install (uses the committed package-lock.json), then rebuild.
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
npm run build

echo "Synced vendor/{parse,types}.ts from $PLUGIN_REPO and rebuilt dist/validate.mjs."
