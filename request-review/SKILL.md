---
name: request-review
version: 1.0.0
description: Request a code review by posting to Slack and transitioning the Jira ticket to "In Review". Use this whenever the user asks to request a review, send an LFR, post to Slack for review, or mark a ticket as in review. Posts in the "LFR please" format to the configured Slack channel and transitions the Jira issue automatically.
model: haiku
---

# Request Review

Post a review request to Slack in the standard "LFR please" format, and transition the Jira issue to "In Review".

## Phase 0 — Load configuration

Read `config.yaml` from this skill's directory (`~/.claude/skills/request-review/config.yaml`).

If the file does not exist, stop and output:

> No `config.yaml` found. Copy `config.example.yaml` to `config.yaml` and fill in your values:
> `cp ~/.claude/skills/request-review/config.example.yaml ~/.claude/skills/request-review/config.yaml`

Load:
- `slack_channel_id` — channel to post in
- `reviewers` — list of Slack user IDs to @mention
- `jira_cloud_id` — Atlassian cloud UUID
- `jira_in_review_transition_id` — transition ID for "In Review"

## Step 1: Gather context

Run in parallel:

```bash
# Get PR URL and title
gh pr view --json url,title,body

# Get current branch for JIRA key extraction
git branch --show-current
```

Extract the JIRA issue key from the branch name or PR title (e.g., `ktrz/cpd-340-...` → `CPD-340`).

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

## Step 4: Transition the Jira issue to "In Review"

Use `mcp__plugin_atlassian_atlassian__transitionJiraIssue` with:
- `cloudId`: value from config `jira_cloud_id`
- `issueKey`: the extracted key (e.g., `CPD-340`)
- `transitionId`: value from config `jira_in_review_transition_id`

## Step 5: Confirm

Report back:
- Slack message sent to the configured channel
- Jira `PROJ-XXX` transitioned to "In Review"
