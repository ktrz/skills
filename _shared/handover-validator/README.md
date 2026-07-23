# handover-validator

Validates a `pr-<N>-review-decisions.md` handover doc against the **real** parser the
`review-plugin-mvp` VS Code extension uses to load it. Both writers — `investigate-pr-comments`
(Step 4) and `review-pr` auto-mode (Step 9) — run this before emitting a doc, so a doc
the plugin can't load never ships.

## Usage

```bash
node _shared/handover-validator/dist/validate.mjs validate <doc-path>
```

`dist/validate.mjs` is the **canonical** bundle. It is also distributed into each consumer
skill's `vendor/` dir (`skills/review/review-pr/vendor/handover-validator.mjs`,
`skills/review/investigate-pr-comments/vendor/handover-validator.mjs`) by `_shared/sync.sh`, so the skills can
run it from their own directory on an installed copy — where `_shared/` is never present. The
consumer copies are generated; never hand-edit them. Edit the source here, run `npm run build`,
then `bash _shared/sync.sh` (the pre-commit hook runs `sync.sh` on commit; run `npm run build` yourself first). At runtime the skills call:

```bash
node "<skill-base-dir>/vendor/handover-validator.mjs" validate <doc-path>
```

- Exit `0` — the doc parses; the plugin would load it. Prints `OK: … (N item(s))`.
- Exit `1` — the doc is malformed. Prints `INVALID:` plus the violation list (the parser's
  own `ParseError` messages, with any wrapped zod schema issues expanded).
- Exit `2` — usage error or the doc path could not be read.

The bundle in `dist/validate.mjs` is self-contained (esbuild bundle of `cli.ts` +
`vendor/*.ts` + `zod`), so the only runtime requirement is `node` — no `npm install` at
validation time.

## Layout

| Path                | What                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `vendor/parse.ts`   | Verbatim copy of the plugin's parser (do not edit — see `SOURCE.md`).          |
| `vendor/types.ts`   | Verbatim copy of the plugin's schema types.                                    |
| `cli.ts`            | Thin CLI wrapper (the only hand-edited code file).                             |
| `dist/validate.mjs` | Committed esbuild bundle — the runtime entry point.                            |
| `fixtures/`         | Synthetic handover docs the smoke test checks.                                 |
| `test.mjs`          | `npm test` — asserts the bundle accepts valid + empty docs, rejects malformed. |
| `SOURCE.md`         | Upstream repo + pinned commit + re-sync instructions.                          |
| `sync.sh`           | Re-vendors from a plugin checkout and rebuilds the bundle.                     |

## Maintenance

Editing the vendored parser by hand will fail the `handover-validator-drift` CI job. To
update it, follow the re-sync steps in [`SOURCE.md`](SOURCE.md). After any change to
`cli.ts` or `vendor/*.ts`, rebuild and commit the bundle:

```bash
cd _shared/handover-validator && npm ci && npm run build && npm test
```
