---
name: plan-my-day-setup
description: >
  Interactive setup wizard for the plan-my-day skill. Walks users through
  configuring their repositories, branch naming conventions, Jira project
  keys, and output preferences, then generates a config.yaml file.
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
---

Interactive setup wizard for the `plan-my-day` skill. This generates a
`config.yaml` file so the daily planning skill knows which repos, Jira
keys, and branch conventions to use.

## Step 1 — Check for existing config

Read `~/.claude/skills/plan-my-day/config.yaml`.

- If it exists, show the user its contents and ask: "You already have a
  config. Would you like to edit it, replace it, or cancel?"
  - If cancel, stop.
  - If edit/replace, continue to Step 2.
- If it doesn't exist, tell the user: "Let's set up your daily plan config."

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
   - If branches follow `prefix/key-NNN` pattern (e.g. `jsmith/cpd-123`),
     suggest `branch_ticket_format: prefix/key-NNN` and extract the prefix.
   - If branches follow `key-NNN` pattern (e.g. `cpd-123`),
     suggest `branch_ticket_format: key-NNN`.
   - Show the detected pattern and a few example branches to the user for
     confirmation.
4. Ask the user for a short name for this repo (suggest one based on the
   directory name, e.g. `my-app`).

## Step 3 — Gather Jira and output settings

Ask the user:

1. **"What Jira project key(s) do you use?"** (e.g. `CPD`, `PROJ`)
   - Validate by calling `getAccessibleAtlassianResources` to confirm the
     Jira MCP connection works. If it fails, warn the user but continue
     (they may set up Jira later).

2. **"Where should I save the daily plan file?"** (default: `~/Desktop/dayplan`)

3. If a branch prefix was detected in Step 2, confirm it:
   **"Your branches seem to use the prefix 'jsmith'. Is that right?"**
   - If the user has multiple repos with different prefixes, use the most
     common one as the global `branch_prefix`.

## Step 4 — Validate GitHub access

For each repo, verify `gh` CLI access:
```bash
gh auth status
```

If not authenticated, warn the user:
> "GitHub CLI isn't authenticated. Run `gh auth login` before using
> `/plan-my-day`. PR lookups won't work without it."

## Step 5 — Generate and write config

Assemble the `config.yaml` from all gathered values:

```yaml
branch_prefix: <detected or user-provided>
jira_keys:
  - <KEY1>
  - <KEY2>
output_path: <user-provided or ~/Desktop/dayplan>
repos:
  - name: <short-name>
    path: <path>
    github_repo: <org/repo>
    branch_ticket_format: <detected-format>
```

Write the file to `~/.claude/skills/plan-my-day/config.yaml`.

Show the generated config to the user and confirm:
> "Config saved to `~/.claude/skills/plan-my-day/config.yaml`. You can now
> run `/plan-my-day` to generate your daily plan."

If the user wants to make changes, edit the config accordingly.
