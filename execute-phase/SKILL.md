---
name: execute-phase
version: 1.2.0
model: sonnet
description: Execute a phase from an implementation plan in an isolated git worktree. Use when the user says "execute phase", "run phase N", "start phase", or wants to kick off implementation of a plan phase in a worktree. Accepts plan paths or ticket keys from any supported tracker (jira, linear, github, clickup) via references/tracker.md.
---

# Execute Phase in Worktree

Spin up an isolated worktree and spawn an agent to execute a specific phase from an implementation plan.

## Arguments

`/execute-phase <source> <phase-number> [base-branch]`

- `source` — either a path to a plan file (e.g. `plans/proj-123-example-feature.md`) or a ticket key from the configured tracker (e.g. `PROJ-123`, `ENG-45`, `#567`, clickup id)
- `phase-number` — which phase to execute (1, 2, 3, etc.)
- `base-branch` — optional, defaults to `main`. Use a feature branch when phases are stacked.

## Step 1: Resolve plan file

**If source looks like a file path** (contains `/` or ends in `.md`):
- Use it directly. Verify the file exists.

**If source looks like a ticket key** (matches any tracker's id regex — see `references/tracker.md` → Ticket ID format):
- Search for a matching plan file:
  ```bash
  find plans/ .claude/plans/ -name "*$(echo <TICKET-KEY> | tr '[:upper:]' '[:lower:]')*" -name "*.md" 2>/dev/null
  ```
- If exactly one match, use it.
- If multiple matches, list them and ask the user to pick.
- If no match, tell the user no plan file was found for that ticket and stop.

## Step 2: Validate phase

1. Read the plan file and extract the section for the requested phase (look for `## Phase <N>` heading).
2. If the phase section is not found, list available phases and ask the user to pick one.

## Step 3: Create progress file

Create a progress file inside the worktree at `.claude/plans/<plan-name>-phase-<N>-progress.md`. This file is the agent's step-by-step checklist — it converts the plan's phase section into actionable checkboxes.

Parse the phase section from the plan and generate checkboxes for each deliverable:

Example for a data layer phase:
```markdown
# Phase 1 Progress

## Tests (write first)
- [ ] Service tests: filter by status, sort order, unread count, state transitions
- [ ] Hook tests: useNotifications — loading state, data shape, query key
- [ ] Hook tests: useUnreadCount — returns number, query key
- [ ] Hook tests: useMarkNotificationRead — mutation, invalidation
- [ ] Hook tests: useMarkNotificationArchived — mutation, invalidation, toast
- [ ] Hook tests: useMarkAllRead — mutation, invalidation, toast

## Implementation
- [ ] notification-types.ts — discriminated union types
- [ ] notification-query-keys.ts — query key factory
- [ ] notification-mock-data.ts — fixtures
- [ ] notification-service.ts — mock service with async functions
- [ ] use-notifications.ts — useQuery hook
- [ ] use-unread-count.ts — useQuery hook (staleTime 30s)
- [ ] use-mark-notification-read.ts — useMutation hook
- [ ] use-mark-notification-archived.ts — useMutation hook
- [ ] use-mark-all-read.ts — useMutation hook

## Verification
- [ ] npm run typecheck passes
- [ ] npm test passes (all new tests green, no regressions)
```

The agent must update this file as it works — checking off items as they are completed.

## Step 4: Derive branch name

From the plan filename and phase number:
- Strip path and extension: `plans/proj-123-example-feature.md` → `proj-123-example-feature`
- Append phase: `proj-123-example-feature-phase-1`

**Do NOT include a username prefix** (e.g. `<username>/`) — `nwt` adds that automatically. Passing
`<username>/proj-123-...` to `nwt` would produce a `<username>/<username>/proj-123-...` branch and a
`worktrees/<username>/proj-123-...` path, both wrong.

Confirm the branch name with the user before proceeding.

## Step 5: Create worktree

Run from the **repo root** (not from inside a worktree):

```bash
nwt <branch-name> <base-branch>
```

This creates `./worktrees/<branch-name>/` with the branch `<username>/<branch-name>`.

Then install dependencies in the worktree:

```bash
cd ./worktrees/<branch-name> && npm install
```

## Step 6: Copy plan + progress into worktree

```bash
cp <plan-file> ./worktrees/<branch-name>/.claude/plans/
```

Write the progress file generated in Step 3 to `./worktrees/<branch-name>/.claude/plans/<plan-name>-phase-<N>-progress.md`.

## Step 7: Spawn agent in background

Use the Agent tool with `run_in_background: true` to spawn the agent. This lets the user continue working while the phase executes.

The agent prompt must include:

1. The **full text of the phase section** from the plan (not just a reference — the agent has no context)
2. The **full visual spec section** if the plan has one (look for `## Visual Spec`)
3. The **full context section** if the plan has one (look for `## Context`)
4. The **repo root path** of the worktree
5. The **progress file path** and instruction to check off items as completed
6. Instruction to follow TDD: write tests first, then implementation
7. Instruction to run `npm run typecheck && npm test` after implementation and fix any failures
8. Instruction to NOT commit — leave changes unstaged for the user to review

Example agent prompt structure:

```
You are working in a git worktree at <worktree-absolute-path>.
Execute Phase <N> of the implementation plan.

## Context
<paste context section>

## Visual Spec
<paste visual spec section>

## Phase <N> Details
<paste full phase section from plan>

## Progress Tracking
Track your progress in <worktree-path>/.claude/plans/<plan-name>-phase-<N>-progress.md
Check off each item as you complete it. Follow the order: tests first, then implementation, then verification.

## Instructions
- Follow TDD: write failing tests first, then implement to make them pass
- Follow all patterns from CLAUDE.md
- Check off items in the progress file as you complete them
- Run `npm run typecheck && npm test` when done and fix any failures
- Do NOT commit. Leave all changes unstaged for review.
- Working directory is <worktree-absolute-path>
```

After spawning, tell the user:
- The agent is running in the background
- The worktree path: `cd worktrees/<branch-name>`
- That you'll report results when it completes

## Step 8: Report and sync progress

When the background agent completes, you'll be notified automatically. At that point:

1. **Copy the progress file back** to the main repo, next to the original plan file:
   ```bash
   cp ./worktrees/<branch-name>/.claude/plans/<plan-name>-phase-<N>-progress.md <plan-dir>/
   ```
   This lets the user track progress across all phases from the main branch without entering each worktree.

2. **Summarize** for the user:
   - Files created/modified
   - Test results
   - Any unchecked items remaining in the progress file
   - Worktree path for review: `cd worktrees/<branch-name>`
