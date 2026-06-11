# Vendored from: review-plugin-mvp

`vendor/parse.ts` and `vendor/types.ts` are **verbatim copies** of the handover-doc
parser that the [review-plugin-mvp](https://github.com/ktrz/review-plugin-mvp) VS Code
extension uses to load `pr-<N>-review-decisions.md`. They are the real parser, not a
spec-derived reimplementation — if this validator accepts a doc, the plugin loads it;
if it rejects one, the plugin would have shown "Failed to load findings".

## Upstream pin

| Field  | Value                                      |
| ------ | ------------------------------------------ |
| Repo   | `ktrz/review-plugin-mvp`                   |
| Commit | `dfeedb3ee7891510eafab490028d7404da5016de` |
| Branch | `main`                                     |

## File mapping

| Upstream path         | Vendored path     |
| --------------------- | ----------------- |
| `src/schema/parse.ts` | `vendor/parse.ts` |
| `src/schema/types.ts` | `vendor/types.ts` |

`zod` is pinned in `package.json` to `3.25.76` — the exact version resolved in the
plugin's lockfile at the pinned commit — so schema behaviour matches byte-for-byte.

## What is NOT vendored

- `cli.ts` — our thin wrapper (reads a doc, runs `parseDocument`, prints violations).
- `test.mjs`, `fixtures/` — our smoke tests.
- `dist/validate.mjs` — the committed esbuild bundle of `cli.ts` + `vendor/*.ts` + `zod`.

Do **not** hand-edit `vendor/*.ts`. To pull a newer parser, bump the commit above and
re-sync (below). The `handover-validator-drift` CI job fails if `vendor/*.ts` diverges
from the pinned upstream, or if `dist/validate.mjs` is stale relative to the source.

## Re-sync

```bash
# 1. Check out the plugin repo at the desired commit somewhere, then:
PLUGIN_REPO=/path/to/review-plugin-mvp bash _shared/handover-validator/sync.sh

# 2. Update the commit pin in this file to match the checkout.
# 3. Commit vendor/*.ts and the rebuilt dist/validate.mjs together.
```

`sync.sh` copies the two source files and rebuilds the bundle (`npm ci && npm run build`).
