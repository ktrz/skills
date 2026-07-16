# Live eval spec — `plan-my-day`

- **Target:** `plan-my-day`
- **Stable path:** `skills/workflow/plan-my-day`
- **Wip path:** `skills/wip/plan-my-day`
- **Trigger set:** [`plan-my-day.trigger.json`](./plan-my-day.trigger.json)

Phase-5 loosening target (the largest and most prescriptive of the three). Each
scenario pins one observable behaviour — trigger coverage, the day-plan output
shape, the three-way worktree classification, and the degraded-signal +
posture-hint invariants. These are **model-in-the-loop** runs; see
[`../README.md`](../README.md) for how to run them.

## Scenarios

### `plan-my-day-trigger` — does the description fire?

- **Prompt:** what should I work on today?
- **Should trigger:** yes
- **Expect:** `plan-my-day` triggers for a bare "what to work on today" request
  without an explicit `/plan-my-day` command.

### `plan-my-day-output-sections` — is the plan grouped by urgency?

- **Prompt:** build my daily plan
- **Should trigger:** yes
- **Expect:**
  - The plan groups items by urgency (Do first / Main focus / If you have time /
    Not today / Cleanup) rather than by data source.
  - Actionable items use `- [ ]` checkboxes; a `## Standup` section with
    Done / In Progress / Blockers is present.

### `plan-my-day-worktree-classification` — three-way classification

- **Prompt:** plan my day across my worktrees
- **Should trigger:** yes
- **Expect:** each worktree is classified Active (dirty / ahead / open PR) vs
  Stale (no activity + last commit > 7 days); orphan tickets with no matching
  branch land under "Tickets to pick up".

### `plan-my-day-degraded-signal-invariant` — warn, don't fabricate

- **Prompt:** plan my day (Slack is currently unreachable)
- **Should trigger:** yes
- **Expect:** when a data source fails, the skill emits a ⚠ warning line and
  continues with what is available rather than fabricating or silently dropping
  data.

### `plan-my-day-posture-hint-invariant` — retro-derived, never hardcoded

- **Prompt:** give me today's plan
- **Should trigger:** yes
- **Expect:** any posture/scheduling tilt in the plan is derived from the
  monthly retro issue's own sections, not hardcoded day-of-week rules in the
  skill.

### `plan-my-day-modes` — mode dispatch

- **Prompt:** close out my day
- **Should trigger:** yes
- **Expect:** the `close` argument routes to the close-day flow (not the default
  daily plan); `standup` routes to the standup flow.
