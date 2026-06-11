#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

while IFS= read -r ref; do
  while IFS= read -r consumer; do
    mkdir -p "$consumer/references"
    cp "_shared/references/$ref" "$consumer/references/$ref"
    git add -- "$consumer/references/$ref" 2>/dev/null || true
  done < <(yq -r ".references[\"$ref\"][]" _shared/manifest.yaml)
done < <(yq -r '.references | keys[]' _shared/manifest.yaml)

if yq -e '.bundles' _shared/manifest.yaml >/dev/null 2>&1; then
  while IFS= read -r src; do
    dest=$(yq -r ".bundles[\"$src\"].dest" _shared/manifest.yaml)
    if [ -z "$dest" ] || [ "$dest" = "null" ]; then
      echo "sync.sh: bundle '$src' has no .dest in _shared/manifest.yaml" >&2
      exit 1
    fi
    while IFS= read -r consumer; do
      mkdir -p "$consumer/$(dirname "$dest")"
      cp "_shared/$src" "$consumer/$dest"
      git add -- "$consumer/$dest" 2>/dev/null || true
    done < <(yq -r ".bundles[\"$src\"].consumers[]" _shared/manifest.yaml)
  done < <(yq -r '.bundles | keys[]' _shared/manifest.yaml)
fi
