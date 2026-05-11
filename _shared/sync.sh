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
