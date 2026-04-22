---
name: create-pr
version: 1.0.0
description: Create a GitHub pull request following the project's PR template. Use this whenever the user asks to create a PR, open a pull request, or submit their branch for review. Automatically detects stacked branches, fills in the JIRA ticket, description, and test scenario from context.
model: haiku
---

# Create PR

Create a GitHub pull request that follows the project's PR template — JIRA link, description, and test scenario with checkboxes.

## Phase 0 — Load configuration

Read `~/.claude/create-pr.yaml`.

If the file does not exist, stop and output:

> No config found. Copy the example and fill in your values:
> `cp ~/.claude/skills/create-pr/config.example.yaml ~/.claude/create-pr.yaml`

Load:
- `jira_base_url` — e.g. `https://your-org.atlassian.net/browse`
- `jira_project_key` — e.g. `PROJ`

## Step 1: Gather context

Run these in parallel:

```bash
# Current branch
git branch --show-current

# Recent commits on this branch vs main
git log --oneline main..HEAD

# Check if stacked (branched off something other than main)
git merge-base --fork-point main HEAD || git log --oneline origin/main..HEAD | tail -1
```

Also run:
```bash
# Detect base branch (stacked PR detection)
git log --oneline --decorate | head -20
```

**Detecting a stacked branch:** If the branch diverged from another feature branch (not main/master), that feature branch is the base. Check with:
```bash
git log --oneline $(git merge-base HEAD main)..HEAD
# If commits are few and tightly scoped, confirm base branch by checking what the branch was created from
```

A reliable way to detect stacking:
```bash
# List branches that contain the fork point commit (other than main)
FORK=$(git merge-base HEAD main)
git branch --contains $FORK | grep -v "main\|master\|\*"
```

If the fork point is reachable from a feature branch (not just main), the PR is stacked on that branch. Use `--base <feature-branch>` when creating.

## Step 2: Extract JIRA ticket

Look for a ticket key in the branch name using `jira_project_key` from config (e.g. if key is `PROJ`, match `proj-340` → `PROJ-340`). If not in the branch, check commit messages.

Format the JIRA link using `jira_base_url`:
```
[PROJ-XXX](<jira_base_url>/PROJ-XXX) — One-line summary
```

## Step 3: Draft the PR body

Use this exact template:

```
### JIRA

[PROJ-XXX](<jira_base_url>/PROJ-XXX) — One-line summary of the ticket

### Description

- What changed and why (bullet points)
- Key technical decisions if non-obvious

### Test scenario

- [ ] Step 1: How to set up / navigate to the feature
- [ ] Step 2: What to do
- [ ] Step 3: What to verify / expected outcome
- [ ] Edge case or error state to test (if applicable)
```

Fill in based on the commit history and branch name. The test scenario should be concrete steps a reviewer can follow to manually verify the feature works — not abstract statements like "verify it works".

## Step 4: Determine PR title

Use the format: `<type>(<scope>): <short description>`

Common types: `feat`, `fix`, `refactor`, `chore`. Scope is the affected area (e.g., `systems`, `auth`, `ui`). Keep the title under 72 characters.

## Step 5: Create the PR

```bash
gh pr create \
  --title "<title>" \
  [--base <feature-branch>]  # only if stacked \
  --body "$(cat <<'EOF'
### JIRA

[PROJ-XXX](<jira_base_url>/PROJ-XXX) — Summary

### Description

- Bullet 1
- Bullet 2

### Test scenario

- [ ] Step 1
- [ ] Step 2
EOF
)"
```

## Step 6: Report

Print the PR URL so the user can open it.

If the PR is stacked, note: "This PR is stacked on `<base-branch>`. Merge that one first."

## Notes

- Do NOT push the branch yourself before running `gh pr create` — `gh` handles it or will prompt.
- If `gh pr create` fails because the branch isn't pushed, push it first: `git push -u origin <branch>`, then retry.
- Keep the test scenario steps short and imperative ("Open the system page", "Click the zip file", "Verify artifacts appear below").
