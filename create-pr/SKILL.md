---
name: create-pr
version: 1.3.0
description: Create a GitHub pull request following the project's PR template. Use this whenever the user asks to create a PR, open a pull request, or submit their branch for review. Automatically detects stacked branches, fills in the ticket reference, description, and test scenario from context. Pass `--draft` to open the PR as a draft.
model: haiku
---

# Create PR

Create a GitHub pull request that follows the project's PR template — ticket link, description, and test scenario with checkboxes.

## Phase 0 — Load configuration

Read tracker config (see `references/tracker.md` for resolution rules):

1. `<repo_root>/.claude/tracker.yaml` — repo-local override, resolved from `git rev-parse --show-toplevel`.
2. `~/.claude/tracker.yaml` — shared default.

If neither exists, stop and output:

> No tracker config found. Create `<repo_root>/.claude/tracker.yaml` for a per-project tracker, or `~/.claude/tracker.yaml` for a shared default. Copy `_shared/tracker.example.yaml` as a starting point.

Also load from `~/.claude/create-pr.yaml` if it exists:

- any skill-specific PR template overrides (none required — defaults below work). This file no longer carries a `tracker:` block; tracker settings live in the two locations above.

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

## Step 2: Extract ticket reference

Dispatch by `tracker.type` per `references/tracker.md`:

- **jira / linear**: match `[A-Za-z][A-Za-z0-9]+-\d+` in the branch (case-insensitive). Uppercase the result. Prefer matches whose prefix appears in `project_keys` / `team_keys`.
- **github**: match `\b\d+\b` after stripping any user/feature prefix.
- **clickup**: match `[a-z0-9]{7,9}`.

If nothing matches, check recent commit messages, then ask the user.

Build the link using the URL template for the tracker (see `references/tracker.md` → Link format). Store as `<TICKET_LINK>` for the body.

## Step 3: Draft the PR body

Use this exact template:

```
### Ticket

<TICKET_LINK> — One-line summary of the ticket

### Description

- What changed and why (bullet points)
- Key technical decisions if non-obvious

### Test scenario

- [ ] Step 1: How to set up / navigate to the feature
- [ ] Step 2: What to do
- [ ] Step 3: What to verify / expected outcome
- [ ] Edge case or error state to test (if applicable)
```

`<TICKET_LINK>` is rendered per the link template for the tracker:

- jira: `[PROJ-123](https://org.atlassian.net/browse/PROJ-123)`
- linear: `[ENG-45](https://linear.app/acme/issue/ENG-45)`
- github: `[#567](https://github.com/owner/repo/issues/567)`
- clickup: `[8669abc12](https://app.clickup.com/t/8669abc12)`

Fill in based on the commit history and branch name. The test scenario should be concrete steps a reviewer can follow to manually verify the feature works — not abstract statements like "verify it works".

If no ticket could be determined (no tracker configured, or user declined to supply one), omit the `### Ticket` section entirely.

## Step 4: Determine PR title

Use the format: `<type>(<scope>): <short description>`

Common types: `feat`, `fix`, `refactor`, `chore`. Scope is the affected area (e.g., `systems`, `auth`, `ui`). Keep the title under 72 characters.

## Step 5: Create the PR

If the user passed `--draft` (or the invoking skill requested a draft PR), add `--draft` to the `gh pr create` command. Use draft for self-review-pending PRs so reviewers know not to look yet.

```bash
gh pr create \
  --title "<title>" \
  [--draft]  # if --draft requested \
  [--base <feature-branch>]  # only if stacked \
  --body "$(cat <<'EOF'
### Ticket

<TICKET_LINK> — Summary

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

If the PR was opened as draft, note: "Opened as draft. Mark ready with `gh pr ready <N>` when self-review is complete."

## Notes

- Do NOT push the branch yourself before running `gh pr create` — `gh` handles it or will prompt.
- If `gh pr create` fails because the branch isn't pushed, push it first: `git push -u origin <branch>`, then retry.
- Keep the test scenario steps short and imperative ("Open the system page", "Click the zip file", "Verify artifacts appear below").
