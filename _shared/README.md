# \_shared

Canonical sources for content copied into multiple skills.

## Contents

- `references/tracker.md` — issue-tracker dispatch table (jira / linear / github / clickup). Copied into each consumer skill at `<skill>/references/tracker.md`. Edit the canonical file, then run the sync step below.
- `tracker.example.yaml` — tracker config template. Users copy it to either `~/.claude/tracker.yaml` (shared default) or `<repo>/.claude/tracker.yaml` (per-project override).

## Consumers of `tracker.md`

- commit-message-format
- create-pr
- execute-phase
- implement-feature
- plan-feature
- plan-my-day
- plan-my-day-setup
- request-review

## Sync

After editing `_shared/references/tracker.md`, copy to every consumer:

```bash
for d in commit-message-format create-pr execute-phase implement-feature plan-feature plan-my-day plan-my-day-setup request-review; do
  mkdir -p "$d/references"
  cp _shared/references/tracker.md "$d/references/tracker.md"
done
```

Commit the canonical + copies together so they never drift.
