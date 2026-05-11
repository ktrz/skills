# \_shared

Canonical sources for content copied into multiple skills.

## Contents

- `references/tracker.md` — issue-tracker dispatch table (jira / linear / github / clickup). Copied into each consumer skill at `<skill>/references/tracker.md`. Edit the canonical file, then run the sync step below.
- `references/prompt-injection-defense.md` — canonical playbook every external-fetching skill cites. Copied into each consumer skill at `<skill>/references/prompt-injection-defense.md`. Edit the canonical file, then run the sync step below.
- `tracker.example.yaml` — tracker config template. Users copy it to either `~/.claude/tracker.yaml` (shared default) or `<repo>/.claude/tracker.yaml` (per-project override).

## Consumers

Consumers and copies are managed by [`manifest.yaml`](manifest.yaml) + [`sync.sh`](sync.sh).
To see which skills consume a given reference, read `manifest.yaml` directly.

## Sync

Edit the canonical file in `_shared/references/`, then commit — the `sync-shared-refs` pre-commit hook
runs `sync.sh` automatically and stages the updated consumer copies.

To sync manually (e.g. after adding a new consumer to `manifest.yaml`):

```bash
bash _shared/sync.sh
```

The CI drift check (`shared-refs-drift.yml`) enforces that consumer copies never diverge from canonical on any PR or push.

See the top-level [`README.md`](../README.md) for one-time setup (`brew bundle` on Mac, apt equivalent on Linux).
