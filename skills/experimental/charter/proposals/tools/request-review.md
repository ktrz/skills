# Review request channel — notes

Facts about the Slack review-request channel and the ticket transition, copied from the old `request-review` skill. Referenced by the toolchain map; read before first use. Each block carries its `Source:` line; the text under it is verbatim.

## Configuration

Source: skills/review/request-review/SKILL.md:26-42

Read `~/.claude/request-review.yaml`.

If the file does not exist, stop and output:

> No config found. Copy `~/.claude/skills/request-review/config.example.yaml` to `~/.claude/request-review.yaml` and fill in your values.

Load from this file:

- `slack_channel_id` — channel to post in
- `reviewers` — list of Slack user IDs to @mention

Resolve tracker config (see `references/tracker.md`):

1. `<repo_root>/.claude/tracker.yaml` (repo-local), else
2. `~/.claude/tracker.yaml` (shared default).

If neither exists, the transition step is skipped (Slack post still happens). Warn the user: "No tracker configured — skipping status transition." This deliberately diverges from the no-tracker default in `references/tracker.md` (stop entirely): a review request is still worth posting even without a ticket to transition, so the Slack post proceeds and only the transition is dropped.

## Config file shape

Source: skills/review/request-review/config.example.yaml:1-21

```yaml
# request-review configuration
# ──────────────────────────────
# Copy to ~/.claude/request-review.yaml and fill in the Slack fields.
# Tracker settings are no longer configured here — they're resolved from
# <repo>/.claude/tracker.yaml (repo-local, optional) or ~/.claude/tracker.yaml
# (shared default). See _shared/tracker.example.yaml for the schema.
#
#   cp ~/.claude/skills/request-review/config.example.yaml ~/.claude/request-review.yaml

# ── Slack ──────────────────────────────────────────────────────────

# Channel ID to post review requests in
# Find it by right-clicking the channel → "Copy link" — the last segment is the ID
slack_channel_id: "CXXXXXXXXXX"

# Slack user IDs to @mention as reviewers
# Find by opening a DM with the person and copying the URL — last segment is the ID
reviewers:
  - "UXXXXXXXXXX"  # Reviewer 1
  - "UXXXXXXXXXX"  # Reviewer 2
  - "UXXXXXXXXXX"  # Reviewer 3
```

## Gather context

Source: skills/review/request-review/SKILL.md:44-56

## Step 1: Gather context

Run in parallel:

```bash
# Get PR URL and title
gh pr view --json url,title,body

# Get current branch for ticket key extraction
git branch --show-current
```

Extract the ticket key from the branch name or PR title using the regex for the configured `tracker.type` (see `references/tracker.md` → Extract a ticket key from a git branch name).

## Send the message

Source: skills/review/request-review/SKILL.md:93-98

## Step 3: Send the Slack message

Use `mcp__plugin_slack_slack__slack_send_message` with:

- `channel_id`: value from config `slack_channel_id`
- `text`: the drafted message above

## Transition the ticket

Source: skills/review/request-review/SKILL.md:100-109

## Step 4: Transition the ticket to "In Review"

Dispatch by `tracker.type` per `references/tracker.md` → Transition a ticket to "In Review":

- **jira**: `mcp__plugin_atlassian_atlassian__transitionJiraIssue` with `cloudId`, `issueIdOrKey = <TICKET_KEY>`, `transitionId = tracker.jira.in_review_transition_id`.
- **linear**: resolve the state id for `tracker.linear.in_review_state_name` via `mcp__linear-server__list_issue_statuses`, then `mcp__linear-server__save_issue` with `id = <TICKET_KEY>`, `stateId`.
- **github**: `gh issue edit <N> --repo <tracker.github.repo> --add-label <tracker.github.in_review_label>`.
- **clickup**: `mcp__claude_ai_ClickUp__clickup_update_task` with `taskId = <TICKET_KEY>`, `status = tracker.clickup.in_review_status_name`.

If the ticket key could not be extracted, skip this step and warn the user.
