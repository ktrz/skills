#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

for ref in $(yq -r '.references | keys[]' _shared/manifest.yaml); do
  for consumer in $(yq -r ".references[\"$ref\"][]" _shared/manifest.yaml); do
    mkdir -p "$consumer/references"
    cp "_shared/references/$ref" "$consumer/references/$ref"
    git add -- "$consumer/references/$ref" 2>/dev/null || true
  done
done
