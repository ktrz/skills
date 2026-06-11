# \_shared

Canonical sources for content copied into multiple skills.

## Contents

- `references/tracker.md` — issue-tracker dispatch table (jira / linear / github / clickup). Copied into each consumer skill at `<skill>/references/tracker.md`. Edit the canonical file, then run the sync step below.
- `references/prompt-injection-defense.md` — canonical playbook every external-fetching skill cites. Copied into each consumer skill at `<skill>/references/prompt-injection-defense.md`. Edit the canonical file, then run the sync step below.
- `tracker.example.yaml` — tracker config template. Users copy it to either `~/.claude/tracker.yaml` (shared default) or `<repo>/.claude/tracker.yaml` (per-project override).
- `handover-validator/` — vendored copy of the `review-plugin-mvp` handover-doc parser, wrapped in a CLI that gates the `pr-<N>-review-decisions.md` / `pr-<N>-auto-review.md` files before `investigate-pr-comments` and `review-pr` emit them. Unlike the references above (synced _within_ this repo via `sync.sh`), this is vendored from another repo — see [`handover-validator/SOURCE.md`](handover-validator/SOURCE.md) for the pin and the `handover-validator-drift` CI job that keeps it honest. The built bundle (`handover-validator/dist/validate.mjs`) is **also distributed into consumer skills** — see the `bundles` category below.

## Distributed categories

`manifest.yaml` registers two kinds of distributable asset, both copied into consumer skills by `sync.sh`:

- **`references:`** — markdown docs copied to `<skill>/references/<name>`.
- **`bundles:`** — built JS bundles copied to a per-skill `<skill>/<dest>` path (e.g. `vendor/handover-validator.mjs`). The validator bundle ships this way so `review-pr` and `investigate-pr-comments` can run it from their own directory on an installed copy, where `_shared/` is never present. The committed bundle is a self-contained esbuild output (zod inlined); the only runtime requirement is `node`. `sync.sh` only _distributes_ the already-built `dist/validate.mjs` — rebuilding it stays the job of `handover-validator/` (`npm run build`), enforced by `handover-validator-drift.yml`.

## Consumers

Consumers and copies are managed by [`manifest.yaml`](manifest.yaml) + [`sync.sh`](sync.sh).
To see which skills consume a given reference, read `manifest.yaml` directly.

## Sync

Edit the canonical file in `_shared/references/` (or rebuild a registered bundle, e.g.
`handover-validator/dist/validate.mjs`), then commit — the `sync-shared-refs` pre-commit hook
runs `sync.sh` automatically and stages the updated consumer copies.

To sync manually (e.g. after adding a new consumer to `manifest.yaml`):

```bash
bash _shared/sync.sh
```

The CI drift check (`shared-refs-drift.yml`) enforces that consumer copies never diverge from canonical on any PR or push.

See the top-level [`README.md`](../README.md) for one-time setup (`brew bundle` on Mac, apt equivalent on Linux).
