---
name: implement-feature
version: 1.3.0
model: sonnet
description: >
  Execute a multi-phase feature plan using parallel worktree agents, then open PRs. Use when you
  want to go from ticket to code — dispatches parallel execute-phase agents for independent phases
  and chains cohorts with user confirmation between them. Triggers on "implement feature",
  "implement ticket", "/implement-feature PROJ-XXX", "execute the plan", or "run the phases".
  Invokes plan-feature automatically if no plan file exists yet. After PRs are opened, runs the
  automated review pipeline (`review-pr` → `investigate-pr-comments`) per PR to produce a handover
  doc the user can triage offline. Works with jira, linear, github, or clickup tickets via
  references/tracker.md.
---

# Implement Feature

Pure execution orchestrator: read a multi-phase plan → dispatch parallel worktree agents → open PRs.
Planning (ticket fetch, grill-me, phase design) is handled by `plan-feature`.

## Arguments

`/implement-feature [TICKET-KEY | plan-file-path]`

- `PROJ-123`, `ENG-45`, `#567`, clickup id — find or create a plan for this ticket, then execute
- `plans.local/<project>/proj-123-example-feature.md` — execute this specific plan
- (none) — ask what to implement

## Step 1: Resolve the plan

Use the first match:

1. Arg looks like a file path (contains `/` or ends in `.md`) → use it directly; verify it exists
2. Arg looks like a ticket key (matches any tracker's id regex — see `references/tracker.md` → Ticket ID format) → search in this order:
   1. `./plans.local/**/*<lowercased-key>*.md` (preferred — new location, subdirectory per project)
   2. `./plans/*<lowercased-key>*.md` (legacy)

   First hit wins. If multiple hits at the same precedence level, ask the user which to use.

3. No arg → ask: "Which ticket or plan should I implement?"

**If no plan file is found:** invoke `plan-feature` with the ticket key. After `plan-feature` completes and the plan file exists, continue from Step 2 — do not stop.

## Step 2: Parse the plan

Read the plan file. Extract:

- All `## Phase N` sections (title and content)
- The `## Execution Order` section — which phases are parallel, which are sequential
- Dependencies: "Phases 2 and 3 can run in parallel after Phase 1 lands" → Phase 2 and 3 depend on Phase 1

A phase is **ready** when it has no dependencies, or all its dependencies are complete (a progress file exists at `<plan-dir>/<plan-name>-phase-<N>-progress.md` — same directory as the plan — with all checkboxes checked).

## Friction log

Throughout execution, keep a running mental note of anything that required manual intervention,
retries, workarounds, or unexpected failures — things like a missing permission, an agent that
stalled and you had to take over, a plan step that turned out wrong, or a tool that wasn't
available. Normal execution steps don't count; only things that slowed you down or broke the
flow. You'll surface this in Step 6.

## Step 3: Dispatch ready phases

### Step 3a: Confirm the cohort before dispatch

Before spawning any agents, state the cohort explicitly and confirm with the user — even if they asked you to "implement the plan" or "run phase 1". Users frequently miss parallelism in the plan and default to thinking of phases sequentially; asking at the dispatch point catches this.

Phrasing template:

> Cohort ready: **Phase X and Phase Y** (parallel — disjoint files). Dispatch both now, or only one?

Three outcomes to handle:

- **Dispatch all** → proceed to Step 3b with every ready phase in this cohort.
- **Dispatch a subset** (e.g. user says "just phase 1") → proceed with only those; the remaining parallel phases stay queued. Remind the user at the end of Step 4 that the siblings are still waiting.
- **Skip / defer** → tell the user the branch and phase are untouched; exit the skill cleanly.

If there is only one ready phase (no parallelism available), the confirmation collapses to "Dispatching Phase X now." — you still announce it, but no decision is needed.

### Step 3b: Spawn the agents

Dispatch the confirmed phases simultaneously with parallel Agent calls, `run_in_background: true`:

```
Invoke the execute-phase skill for <plan-path> Phase <N>.
Base branch: <base-branch>.
IMPORTANT: Commit your work incrementally as you complete logical units
(e.g., after tests pass for a component, after implementing a feature).
Use /commit-message-format for each commit. Do NOT leave everything
uncommitted until the end.
```

Base branch:

- Phase depends only on `main` → `main`
- Phase depends on a completed prior phase → that phase's worktree branch (stacked PR)

Tell the user which phases are now running and their expected worktree paths (`worktrees/<branch>`).

## Step 4: On each phase completion — PR and chain

When a background agent completes (notified automatically):

1. Invoke `create-pr` with `--draft` for that worktree branch. The branch already has incremental commits from the agent. Report the PR URL immediately.
   - **Draft is mandatory here.** The automated review pipeline runs in Step 5a — the PR should not be visible-for-review until self-review findings are triaged. `execute-review-decisions` will offer to mark the PR ready once findings are resolved.
   - **PR titles describe the change, not the orchestration.** Do not include `(Plan N)`, `(Phase N)`, or similar scaffolding in the title — reviewers don't have that context. Reference the plan path inside the PR body if useful. Example: ✅ `feat(skills): decouple PR review pipeline` / ❌ `feat(skills): decouple PR review pipeline (Plan 1)`.
2. Report: files changed, test status, any unchecked items in the progress file.
3. Identify which blocked phases are now unblocked.
4. Ask: "Phase N complete — PR at <url>. Ready to dispatch Phase M (and Phase P in parallel)?"
5. On yes: go back to Step 3 for the next cohort.

Pausing between cohorts gives the user a review checkpoint before the next wave.

## Step 5: Summary

When all phases are done:

| Phase   | Branch                   | PR                     |
| ------- | ------------------------ | ---------------------- |
| Phase 1 | `<username>/...-phase-1` | https://github.com/... |
| Phase 2 | `<username>/...-phase-2` | https://github.com/... |

Flag any phases with unchecked progress items that need manual attention.

## Step 5a: Automated review pipeline (per PR)

After the summary table and before the retrospective, run the automated review pipeline once per PR opened in Step 4. For multi-PR runs, complete the full pipeline for one PR before moving to the next, and complete all PRs before the retrospective.

**Skip condition.** If `.claude/review.yaml` does not exist (in the repo root or `~/.claude/`), skip Step 5a entirely and note in the retrospective: "review-pr not configured — create `.claude/review.yaml` to enable the automated review pipeline." This makes the pipeline opt-in: existing users without config see no behaviour change.

For each PR `<N>` from Step 5's table, in PR-number order:

1. **Invoke `review-pr` in pipeline mode.** Set the `PIPELINE=1` env so the skill runs in auto mode (writes findings to a file, does not post to GitHub). Pass the PR number explicitly. Wait for completion. Capture the auto-review file path it prints (default: `plans.local/<repo>/pr-<N>-auto-review.md`).

2. **Invoke `investigate-pr-comments`.** Pass the PR number and `--auto-review-file <path>` from step 1. The skill fetches human reviewer comments from GitHub, merges them with the auto-review findings, runs investigation subagents in parallel, and writes the handover document to `plans.local/<repo>/pr-<N>-review-decisions.md`. Wait for completion.

3. **Report.** One line per PR:

   > Review pipeline complete for PR `<N>` (draft). Decisions file: `<path>`. Edit and run `/execute-review-decisions <path>` when ready — that step will offer to mark PR `<N>` ready for review once findings are resolved. For flagged items: `/resolve-pr-comments --from-doc <path>`.

Do **not** wait for the user to triage the file before proceeding to the next PR or to Step 6. The handover doc is the async hand-off — the user reads it on their own time. The pipeline's job is to land the findings file, not to drive triage.

If `review-pr` reports that it skipped silently (pipeline mode without config), surface that as a Step 5a friction note and continue.

## Step 6: Retrospective

After Step 5a completes (or is skipped), present the friction log:

- If empty: "No friction noted — everything ran cleanly."
- If non-empty: list each friction point, which skill it implicates, and what the likely fix is.
  Then ask: "Want to open a skill-creator session to improve any of these?"
  If yes, invoke `skill-creator` with the affected skill names and the friction points as context.

The goal is to capture improvements while the run is fresh, not to force a reflection session
when there's nothing to improve.

## Error handling

- `plan-feature` fails or is skipped → ask user to point to an existing plan file or paste requirements
- Phase section not found in plan → list available phases and ask which to run
- Background agent fails → report last known progress state, ask whether to retry or continue with other phases
- Dependency phase fails → do not dispatch dependents; surface the failure and ask for direction

## Known simplification

Parallel phases all branch from `main` for now. If a prior sequential phase hasn't merged yet, the user may need to pass `--base <feature-branch>` when `create-pr` runs. Stacked base-branch auto-detection is future work.
