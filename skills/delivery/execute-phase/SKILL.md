---
name: execute-phase
version: 1.3.0
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

Resolve the repo root first so every later step works regardless of the current working directory — this matters once Step 5 changes into the new worktree: `REPO_ROOT=$(git rev-parse --show-toplevel)`

**If source looks like a file path** (contains `/` or ends in `.md`):

- Resolve it to an absolute path under `$REPO_ROOT` if it isn't already absolute. Verify the file exists. Store as `PLAN_FILE`.

**If source looks like a ticket key** (matches any tracker's id regex — see `references/tracker.md` → Ticket ID format):

- Search for a matching plan file, including the `plans.local/` tree that `save-plan` writes to. `save-plan` may store a plan as a flat file (`plans.local/<project>/PLAN-<ticket-key>.md`) or, for topic-directory plans, drop the identifying slug from the filename entirely and carry it only in the directory name (`plans.local/<project>/<ticket-key>/PLAN.md`) — so match the ticket key against the full candidate path, not just the filename. `plans.local` is typically a symlink, so pass `-L` to traverse into it:

  ```bash
  KEY=$(printf '%s' "<TICKET-KEY>" | tr -d '#' | tr '[:upper:]' '[:lower:]')
  (cd "$REPO_ROOT" && find -L plans .claude/plans plans.local -name "*.md" 2>/dev/null) \
    | grep -Ei "(^|[^a-z0-9])$KEY([^a-z0-9]|$)" \
    | awk -v root="$REPO_ROOT" '{ print root "/" $0 }'
  ```

  Three details that snippet depends on — don't simplify them away:

  - **Normalise the key first.** Strip a leading `#`: GitHub ids are written `#567` but nothing on
    disk carries the `#` (`references/tracker.md` → Ticket ID format). Substitute the key through
    `printf`, never `echo` — a raw `#567` inside `$(echo …)` opens a shell comment, so the command
    substitution is never closed and the whole command fails to parse.
  - **Match the key as a whole token.** The `(^|[^a-z0-9])` / `([^a-z0-9]|$)` guards require the key
    to be bounded by non-alphanumeric characters or the ends of the path, so `PROJ-1` selects
    `PROJ-1` but not `PROJ-10`. A plain substring test — `find … -ipath "*proj-1*"` — does not.
  - **Search relative to `$REPO_ROOT`, then re-absolutise with `awk`.** The repo root's own path must
    stay out of the matched text: this repo checks phases out under `worktrees/<feature>/`, so with
    absolute paths a worktree named `skl-1-move` would make key `SKL-1` match _every_ plan file.
    `plans.local` usually symlinks to a central tree covering every project, so an over-broad pattern
    has a very large blast radius.

- If exactly one match, use it.
- If multiple matches, list them and ask the user to pick.
- If no match, tell the user no plan file was found for that ticket and stop.
- Store the absolute match as `PLAN_FILE`.

## Step 2: Validate phase

1. Read the plan file and extract the section for the requested phase (look for `## Phase <N>` heading).
2. If the phase section is not found, list available phases and ask the user to pick one.

## Step 3: Draft progress file content

The worktree doesn't exist yet (it's created in Step 5), so this step only drafts the content — the actual file write happens in Step 6, at `.claude/plans/<plan-name>-phase-<N>-progress.md` inside the worktree. This file is the agent's step-by-step checklist — it converts the plan's phase section into actionable checkboxes.

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

## Step 4: Derive feature name

From `PLAN_FILE` and the phase number:

- **Flat-file plans** (`plans/proj-123-example-feature.md`, `plans.local/<project>/PLAN-<slug>.md`): strip path and extension: `proj-123-example-feature.md` → `proj-123-example-feature`.
- **Topic-directory plans** (`plans.local/<project>/<topic>/PLAN.md` — `save-plan` drops the topic from the filename since the directory already carries it): the filename alone (`PLAN`) isn't a usable feature stem — use the topic directory name instead, e.g. `plans.local/skills/nwt-cli/PLAN.md` → `nwt-cli`.
- Append phase: `<feature-stem>-phase-1`

**Do NOT include a username prefix** (e.g. `<username>/`) — `nwt` typically adds one automatically.
Passing `<username>/proj-123-...` to `nwt` would double the prefix.

This is the _feature name_ you'll pass to `nwt`. The actual branch name and worktree path produced
by `nwt` may differ from the feature name (different installations of `nwt` use different conventions
for prefix and path layout — e.g. `ktrz/<feature>` branch and `./<feature>/` path, vs `<feature>`
branch and `worktrees/<feature>/` path). Step 5 detects what `nwt` actually produced.

Confirm the feature name with the user before proceeding.

## Step 5: Create worktree

`nwt` may be a binary or a shell function. **Do not probe with `nwt --help`** — if it's a shell
function, `--help` becomes the feature-name argument and creates an unwanted worktree.
Use `type nwt` or `declare -f nwt` to inspect if needed.

`nwt` may default its `base-branch` to `main`. If the repo uses `master` (or another default
branch), pass it explicitly as the second argument.

Determine the default branch first. If the command was invoked with the optional third
`[base-branch]` argument (e.g. for stacked phases), that supplied value wins outright and skips
autodetection entirely:

```bash
DEFAULT_BRANCH="<base-branch argument, if supplied>"
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH=$(git -C <repo-root> symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
fi
if [ -z "$DEFAULT_BRANCH" ]; then
  # origin/HEAD isn't set locally (e.g. a fresh clone without `git remote set-head`) —
  # ask the remote directly.
  DEFAULT_BRANCH=$(git -C <repo-root> remote show origin 2>/dev/null | sed -n 's/^ *HEAD branch: //p')
fi
if [ -z "$DEFAULT_BRANCH" ]; then
  # No network / no origin — fall back to whichever conventional branch
  # actually exists locally, rather than assuming "main".
  if git -C <repo-root> show-ref --verify --quiet refs/heads/main; then
    DEFAULT_BRANCH=main
  elif git -C <repo-root> show-ref --verify --quiet refs/heads/master; then
    DEFAULT_BRANCH=master
  else
    echo "execute-phase: could not determine the default branch — no origin/HEAD, no reachable remote, and neither 'main' nor 'master' exists locally. Pass it explicitly as the third argument." >&2
    exit 1
  fi
fi

# `nwt` hands this straight to `git worktree add <path> -b <feature> <base-branch>`, which
# resolves <base-branch> as a *local* branch. The first two probes above read the branch name
# off the remote, so it may well have no local ref — and a remote-only name misbehaves in two
# different ways, neither of them useful:
#   - exactly one remote carries it → git silently ignores `-b <feature>` and instead creates
#     and checks out a local branch named after the *base*, so the phase worktree ends up
#     sitting on the default branch and Step 5's branch match below finds nothing;
#   - two or more remotes carry it  → `fatal: invalid reference: <base-branch>`.
# Materialise a local tracking branch first so `-b <feature>` is honoured.
if ! git -C <repo-root> show-ref --verify --quiet "refs/heads/$DEFAULT_BRANCH"; then
  if git -C <repo-root> show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH"; then
    git -C <repo-root> branch --track "$DEFAULT_BRANCH" "origin/$DEFAULT_BRANCH" || exit 1
  else
    echo "execute-phase: base branch '$DEFAULT_BRANCH' exists neither locally nor as 'origin/$DEFAULT_BRANCH' — nwt needs a local branch. Create it first, or pass an existing local branch as the third argument." >&2
    exit 1
  fi
fi
```

`DEFAULT_BRANCH` now names a branch that exists locally, which is what `nwt` requires (see
`../nwt/SKILL.md` → "When to use vs. raw `git worktree add`"). The block is a no-op whenever the
branch is already local — including every case where the third argument was supplied explicitly for
a stacked phase, so that value still wins outright.

Run from the **repo root** (not from inside a worktree):

```bash
nwt <feature-name> <default-branch>
```

After it succeeds, detect the actual worktree path and branch name from git rather than assuming a
convention:

```bash
# Path (worktrees may be at ./<feature>/, ./worktrees/<feature>/, etc.)
# Use --porcelain and take the full remainder of each "worktree "/"branch " line
# (not a whitespace-split field) so paths containing spaces survive intact.
# Require an exact match on the branch suffix (equal to <feature-name>, or
# ending in "/<feature-name>" for a prefixed branch like "ktrz/<feature-name>")
# rather than an unanchored substring match — "foo-phase-1" must not also
# match "foo-phase-10". Collect every match instead of stopping at the first.
WORKTREE_PATH=$(git -C <repo-root> worktree list --porcelain | awk -v feat='<feature-name>' '
  /^worktree / { path = substr($0, 10) }
  /^branch /   {
    br = substr($0, 8)
    sub(/^refs\/heads\//, "", br)
    n = length(feat)
    if (br == feat || (length(br) > n && substr(br, length(br) - n) == "/" feat)) { print path }
  }
')

WORKTREE_COUNT=$(printf '%s\n' "$WORKTREE_PATH" | grep -c . || true)
if [ "$WORKTREE_COUNT" -eq 0 ]; then
  echo "execute-phase: no worktree found matching '<feature-name>' — check \`git worktree list\` and re-run Step 5" >&2
  exit 1
elif [ "$WORKTREE_COUNT" -gt 1 ]; then
  echo "execute-phase: multiple worktrees match '<feature-name>' — resolve the ambiguity manually:" >&2
  printf '  %s\n' "$WORKTREE_PATH" >&2
  exit 1
fi

# Branch
BRANCH_NAME=$(git -C "$WORKTREE_PATH" branch --show-current)
```

Use `WORKTREE_PATH` and `BRANCH_NAME` for all subsequent steps.

Then install dependencies in the worktree:

```bash
(cd "$WORKTREE_PATH" && npm install)
```

## Step 6: Copy plan + progress into worktree

```bash
mkdir -p "$WORKTREE_PATH/.claude/plans"
cp "$PLAN_FILE" "$WORKTREE_PATH/.claude/plans/"
```

Write the progress file generated in Step 3 to `"$WORKTREE_PATH/.claude/plans/<plan-name>-phase-<N>-progress.md"`.

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
- The worktree path (from `WORKTREE_PATH` detected in Step 5)
- That you'll report results when it completes

## Step 8: Report and sync progress

When the background agent completes, you'll be notified automatically. At that point:

1. **Copy the progress file back** to the main repo, next to the original plan file. Use `$PLAN_FILE` (resolved to an absolute path in Step 1) to derive the destination — Step 5 changed the shell's working directory into the new worktree, so a relative plan-dir path would otherwise resolve inside the worktree instead of the original repo:

   ```bash
   cp "$WORKTREE_PATH/.claude/plans/<plan-name>-phase-<N>-progress.md" "$(dirname "$PLAN_FILE")/"
   ```

   This lets the user track progress across all phases from the main branch without entering each worktree.

2. **Summarize** for the user:
   - Files created/modified
   - Test results
   - Any unchecked items remaining in the progress file
   - Worktree path for review: `cd "$WORKTREE_PATH"`
