---
version: 1.3.0
name: plan-my-day-setup
description: >
  Interactive setup wizard for the plan-my-day skill. Walks users through
  configuring their repositories, branch naming conventions, issue
  tracker (jira, linear, github, or clickup), and output preferences,
  then generates the ~/.claude/plan-my-day.yaml file and optionally
  seeds ~/.claude/tracker.yaml.
  Use when the user asks to set up or configure plan-my-day, or says
  "set up my daily plan" or "configure plan-my-day".
model: sonnet
allowedTools:
  - Read
  - Write
  - Bash(git remote -v:*)
  - Bash(git -C *:*)
  - Bash(git branch:*)
  - Bash(ls:*)
  - Bash(gh auth status:*)
  - mcp__plugin_atlassian_atlassian__getAccessibleAtlassianResources
  - mcp__linear-server__list_teams
  - mcp__claude_ai_ClickUp__clickup_get_workspace_hierarchy
---

Interactive setup wizard for the `plan-my-day` skill. Generates
`~/.claude/plan-my-day.yaml` so the daily planning skill knows which
repos, branch conventions, and tracker to use.

If the user has no shared tracker config, also offers to seed
`~/.claude/tracker.yaml` from `_shared/tracker.example.yaml`.

See `references/tracker.md` for dispatch rules.

## Step 1 — Check for existing config

Read `~/.claude/plan-my-day.yaml`.

- If it exists, show the user its contents and ask: "You already have a
  config. Would you like to edit it, replace it, or cancel?"
  - If cancel, stop.
  - If edit/replace, continue to Step 2.
- If it doesn't exist, tell the user: "Let's set up your daily plan config."

Also check for `~/.claude/tracker.yaml`. Note whether it exists — used in
Step 3.

## Step 2 — Gather repository information

Ask the user: **"What repos do you work in? Give me their local paths."**
(e.g. `~/projects/my-app`, `~/projects/my-api`)

For each repo path provided:

1. Verify the path exists and is a git repo:
   ```bash
   ls <path>/.git
   ```
2. Auto-detect the GitHub remote:
   ```bash
   git -C <path> remote -v
   ```
   Parse the `origin` fetch URL to extract the `org/repo` value. Show it to
   the user for confirmation.
3. Detect branch naming convention by sampling recent branches:
   ```bash
   git -C <path> branch --sort=-committerdate --format='%(refname:short)' | head -20
   ```
   Look for patterns:
   - `prefix/key-NNN` (e.g. `jsmith/proj-123`) → suggest `branch_ticket_format: prefix/key-NNN`, extract the prefix.
   - `key-NNN` (e.g. `proj-123`) → suggest `branch_ticket_format: key-NNN`.
   - `prefix/NNN` (e.g. `jsmith/567`, numeric-only) → suggest `branch_ticket_format: prefix/NNN` (common for github-issues workflows).
   - `NNN` (e.g. `567`) → suggest `branch_ticket_format: NNN`.
   - Show the detected pattern and a few example branches to the user for confirmation.
4. Ask the user for a short name for this repo (suggest one based on the
   directory name, e.g. `my-app`).

## Step 3 — Gather tracker and output settings

### 3a — Pick a tracker

If `~/.claude/tracker.yaml` exists, read it and tell the user:
> "Your shared tracker config is `<TRACKER_TYPE>`. Use that for plan-my-day, or override?"

If the user overrides, or if no shared config exists, ask:

> "Which issue tracker do you use? (jira / linear / github / clickup)"

Then ask the type-specific questions:

- **jira**:
  - "What's your Atlassian cloud ID?" (hint: from `https://<org>.atlassian.net/_edge/tenant_info`)
  - "What project key(s) do you use?" (e.g. `PROJ`, `ENG`)
  - "What's your Jira browse base URL?" (e.g. `https://<org>.atlassian.net/browse`)
  - Validate by calling `getAccessibleAtlassianResources`. If it fails, warn but continue.
- **linear**:
  - "What's your Linear workspace slug?" (the `<ws>` in `linear.app/<ws>`)
  - "What team key(s) do you use?" (e.g. `ENG`)
  - Validate by calling `mcp__linear-server__list_teams`. If it fails, warn but continue.
- **github**: no extra fields beyond the repo list from Step 2; assigned
  issues are scanned per configured repo.
- **clickup**:
  - "What's your ClickUp team (workspace) id?"
  - "Which list ids should I scan for assigned tasks?"
  - Validate by calling `clickup_get_workspace_hierarchy`. If it fails, warn but continue.

Skip any field the user doesn't know — they can fill it in the config later.

### 3b — Output location

Ask:
1. **"Where should I save the daily plan file?"** (default: `~/Desktop/dayplan`)
2. **"Want to publish the daily plan as a GitHub issue instead of a local file? If so, which repo (owner/repo)?"** — optional.

### 3c — Branch prefix

If a branch prefix was detected in Step 2, confirm it:
> "Your branches seem to use the prefix 'jsmith'. Is that right?"

If the user has multiple repos with different prefixes, use the most
common one as the global `branch_prefix`.

## Step 4 — Validate GitHub access

For each repo, verify `gh` CLI access:
```bash
gh auth status
```

If not authenticated, warn the user:
> "GitHub CLI isn't authenticated. Run `gh auth login` before using
> `/plan-my-day`. PR lookups won't work without it."

## Step 5 — Generate and write configs

Assemble `~/.claude/plan-my-day.yaml`:

```yaml
branch_prefix: <detected or user-provided>
output_path: <user-provided or ~/Desktop/dayplan>
# day_plan_repo: owner/repo       # only if user opted in
repos:
  - name: <short-name>
    path: <path>
    github_repo: <org/repo>
    branch_ticket_format: <detected-format>
```

If the user chose to override the shared tracker (Step 3a) or no shared
tracker exists, append a `tracker:` block with the user's inputs from
Step 3a. Otherwise, leave `tracker:` out — plan-my-day will fall back to
`~/.claude/tracker.yaml`.

If there is no shared tracker file at all, also offer:
> "Save these tracker settings to `~/.claude/tracker.yaml` so other skills
> (create-pr, request-review, plan-feature) can reuse them?"

If yes, write a `~/.claude/tracker.yaml` with the same `tracker:` block (and
omit it from `plan-my-day.yaml`).

Show the generated config(s) to the user and confirm:
> "Config saved to `~/.claude/plan-my-day.yaml`. You can now
> run `/plan-my-day` to generate your daily plan."

If the user wants to make changes, edit the config accordingly.
