# Standup mode

Triggered by `/plan-my-day standup`. Fills (or refreshes) the
`## Standup — <date>` section of today's open day-plan issue and echoes
the same content to the conversation for copy-paste.

Designed for an async, off-timezone flow where standups are written
twice a day (mid-morning + late afternoon) before closing the day.
Idempotent — every run recomputes from live data, so the AM run and the
PM run both produce the right snapshot for the time they're invoked.

Requires `DAY_PLAN_REPO`. If unset, stop and tell the user standup mode
needs a GitHub-issue-backed day plan.

## Phase S0 — Find today's issue

```bash
date +%Y-%m-%d
```

→ `TODAY`.

```bash
gh issue list --repo <DAY_PLAN_REPO> --state open --limit 10 \
  --json number,title,body
```

Find the issue whose title starts with `<TODAY> — `. If none, stop:

> No open day-plan issue for `<TODAY>` in `<DAY_PLAN_REPO>`. Run
> `/plan-my-day` first.

Save `ISSUE_NUMBER` and `ISSUE_BODY`.

## Phase S1 — Gather data

Re-use the data-collection logic the daily flow already runs. Scope:

- **PRs merged today** — `mergedPRs_repoI` GraphQL search with
  `merged:>=<TODAY>` (Phase 2.4 of `SKILL.md`).
- **Open PRs authored by me** — `openPRs_repoI` (same source).
- **Worktree status** — dirty/ahead per worktree path (Phase 3
  per-path `git -C` calls).
- **Tracker tickets** — assigned-to-me list (Phase 3 dispatch via
  `references/tracker.md`).

Skip Slack — standup snapshot is about engineering state, not chatter.

## Phase S2 — Build the three subsections

**`### Done`** — for the period since the last standup snapshot today
(or since midnight `TODAY` if no prior snapshot exists):

- Every PR from `mergedPRs_repoI` whose `mergedAt` is in range. Format:
  `- **<TICKET or PR#NNN>** — <title> (<repo>)`.
- Every Plan-section checkbox already flipped to `[x]` in `ISSUE_BODY`.
  Dedupe against the merged-PR list (a merged PR usually maps to a
  ticket already counted).

If both lists are empty, the AM run leaves `### Done` as a header with
no bullets. Don't insert a placeholder.

**`### In Progress`** — derived from live state, not from Plan
checkboxes:

- Every open PR from `openPRs_repoI`. Annotate with `(in review)` when
  `reviewRequests` is non-empty.
- Every dirty-or-ahead worktree whose ticket key isn't already covered
  by an open PR above. Format: `- **<TICKET>** — <branch> (<dirty/ahead>)`.

**`### Blockers`** — explicit signals only:

- Tickets returned by the tracker query whose status maps to a blocked
  state (tracker-specific — jira "Blocked", linear `state.type` of
  `started` with a Blocked label, github label `blocked`, clickup status
  containing "block").
- Items currently under `## Not today (but don't forget)` in
  `ISSUE_BODY`, with their parked reason carried through.

If empty, leave the header with no bullets. Don't fabricate blockers.

## Phase S3 — Splice into the issue

Locate the existing `## Standup — <TODAY>` heading in `ISSUE_BODY`. If
present, replace its body (everything from the heading down to the next
`## ` heading or end-of-document) with the freshly computed three
subsections. If absent, append a new `## Standup — <TODAY>` block at
end-of-document, after `## Bonus (off-plan, shipped today)` if that
section exists.

Section ordering inside Standup is fixed: Done → In Progress →
Blockers. Don't reorder based on which subsections have content.

```bash
gh issue edit <ISSUE_NUMBER> --repo <DAY_PLAN_REPO> --body "<NEW_BODY>"
```

## Phase S4 — Echo for copy-paste

Print the new Standup block (everything from `## Standup — <TODAY>`
down through Blockers) verbatim in a fenced markdown block at the end
of the conversation. Above the fence, one line:

> Standup updated on `<DAY_PLAN_REPO>#<ISSUE_NUMBER>`. Copy below to
> post.

Do not auto-post to Slack or any other surface. If the user wants
posting, they pipe the output themselves; a `--post` flag is a future
addition, not part of this mode today.

## Notes

- Mode is purely additive on top of the issue's existing body. Other
  sections (Plan, Do first, Cleanup, Bonus, Not done) are untouched.
- Re-running standup mode multiple times in a day is the expected
  pattern. Each run replaces the Standup block in place — no diff
  history kept inside the issue.
- Close-day Phase C1 calls this same flow (Phases S1–S3 only, no echo)
  to ensure the final Standup snapshot is fresh before closing.
