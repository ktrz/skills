---
name: request-review
version: 1.2.0
description: Request a code review by posting to Slack and transitioning the ticket to "In Review". Use this whenever the user asks to request a review, send an LFR, post to Slack for review, or mark a ticket as in review. Posts in the "LFR please" format to the configured Slack channel and transitions the tracker issue automatically.
model: haiku
---

# Request Review

Post a review request to Slack in the standard "LFR please" format, and transition the tracker ticket to "In Review".

## Phase 0 — Load configuration

Read `~/.claude/request-review.yaml`.

If the file does not exist, stop and output:

> No config found. Copy `~/.claude/skills/request-review/config.example.yaml` to `~/.claude/request-review.yaml` and fill in your values.

Load from this file:
- `slack_channel_id` — channel to post in
- `reviewers` — list of Slack user IDs to @mention

Resolve tracker config (see `references/tracker.md`):
1. `<repo_root>/.claude/tracker.yaml` (repo-local), else
2. `~/.claude/tracker.yaml` (shared default).

If neither exists, the transition step is skipped (Slack post still happens). Warn the user: "No tracker configured — skipping status transition."

## Step 1: Gather context

Run in parallel:

```bash
# Get PR URL and title
gh pr view --json url,title,body

# Get current branch for ticket key extraction
git branch --show-current
```

Extract the ticket key from the branch name or PR title using the regex for the configured `tracker.type` (see `references/tracker.md` → Extract a ticket key from a git branch name).

## Step 2: Draft the Slack message

Use this exact format:

```
LFR please, <brief description of what the PR does> -> <PR URL>
• <bullet: key change or area affected>
• <bullet: what reviewers should focus on or look for>

+ <@reviewer1> <@reviewer2> ...
```

Build the `+` mentions line from the `reviewers` list in config, each formatted as `<@USER_ID>`.

Guidelines:
- The description after "LFR please," should be short (under 10 words) — just enough to say what it does
- Bullets should highlight what changed and any areas needing attention; 2 bullets is typical, 3 is the max
- The `+` line with mentions always goes at the end, exactly as shown

**Example:**
```
LFR please, migrate snapshot nested items to V3 relationships API -> https://github.com/org/repo/pull/623
• Refactors zip + artifact expansion to use a single unified state
• New discriminated union types for NestedGroup; inaccessible items now shown

+ <@U057H6PA30U> <@U09E3BSLX0S> <@U08PXU81XKP>
```

## Step 3: Send the Slack message

Use `mcp__plugin_slack_slack__slack_send_message` with:
- `channel_id`: value from config `slack_channel_id`
- `text`: the drafted message above

## Step 4: Transition the ticket to "In Review"

Dispatch by `tracker.type` per `references/tracker.md` → Transition a ticket to "In Review":

- **jira**: `mcp__plugin_atlassian_atlassian__transitionJiraIssue` with `cloudId`, `issueIdOrKey = <TICKET_KEY>`, `transitionId = tracker.jira.in_review_transition_id`.
- **linear**: resolve the state id for `tracker.linear.in_review_state_name` via `mcp__linear-server__list_issue_statuses`, then `mcp__linear-server__save_issue` with `id = <TICKET_KEY>`, `stateId`.
- **github**: `gh issue edit <N> --repo <tracker.github.repo> --add-label <tracker.github.in_review_label>`.
- **clickup**: `mcp__claude_ai_ClickUp__clickup_update_task` with `taskId = <TICKET_KEY>`, `status = tracker.clickup.in_review_status_name`.

If the ticket key could not be extracted, skip this step and warn the user.

## Step 5: Confirm

Report back:
- Slack message sent to the configured channel
- Ticket `<TICKET_KEY>` transitioned to "In Review" (or skipped, with reason)
