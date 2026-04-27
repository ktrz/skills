# Monthly review

A separate GitHub issue per calendar month, kept distinct from daily-plan
issues. Acts as a slow-moving log of patterns and levers that the daily
flow can read to colour today's posture.

This phase only runs when `DAY_PLAN_REPO` is set.

## Phase M0 — Resolve the current month

```bash
date +%Y-%m
```

→ `CURRENT_MONTH` (e.g. `2026-05`).

```bash
date +"%B %Y"
```

→ `MONTH_LABEL` (e.g. `May 2026`).

`MONTHLY_TITLE` = `<CURRENT_MONTH> — Monthly review` (e.g.
`2026-05 — Monthly review`).

## Phase M1 — Find or create

Search the day-plan repo for a matching issue. Check both `open` and
`closed` so a manually-closed review isn't recreated:

```bash
gh issue list --repo <DAY_PLAN_REPO> --state all --limit 20 \
  --search "<MONTHLY_TITLE> in:title" \
  --json number,title,state,url
```

Pick the result whose title equals `MONTHLY_TITLE` exactly. If found, save
`MONTHLY_REVIEW_NUMBER`, `MONTHLY_REVIEW_URL`, `MONTHLY_REVIEW_STATE`, and
return — never edit the body during creation, never reopen a closed one.

If not found, create with the seed body below:

```bash
gh issue create --repo <DAY_PLAN_REPO> --title "<MONTHLY_TITLE>" \
  --body "<seed body>"
```

Seed body:

```markdown
## <MONTH_LABEL> review

### Highlights

### Shipped

### Stalled or blocked

### Patterns observed

### Levers to try next month
```

Save the new issue number and URL into `MONTHLY_REVIEW_NUMBER` /
`MONTHLY_REVIEW_URL` and set `MONTHLY_REVIEW_STATE = OPEN`.

Mention the URL in the conversation only when the issue was just created
("Seeded monthly review: …"). For an existing issue, stay quiet — daily
runs shouldn't spam this once per morning.

## Phase M2 — Posture hint extraction (daily mode only)

Only run when generating a fresh daily plan. The close-day flow skips this.

If `MONTHLY_REVIEW_NUMBER` is unset (DAY_PLAN_REPO not configured) or
`MONTHLY_REVIEW_STATE` is `CLOSED`, skip — no hint.

Fetch the body:

```bash
gh issue view <MONTHLY_REVIEW_NUMBER> --repo <DAY_PLAN_REPO> \
  --json body --jq .body
```

Parse two sections:

- `### Patterns observed`
- `### Levers to try next month`

Strip leading `-` / whitespace, drop empty bullets. If both sections have
zero usable bullets, skip the hint.

Otherwise synthesise a single "Today's posture" line. Style guide:

- One sentence, no preamble.
- Reference at most two items (one pattern + one lever, or two of one
  kind).
- Tilt towards what to _do_ today, not what was observed last month.
- Match the day of week to any pattern that mentions a weekday (e.g. if
  Patterns says "Wednesdays drift on reviews" and today is Wednesday,
  bias the hint towards reviews).

Examples:

- `Today's posture: deep work over reviews — Wednesdays drift, lean on the morning block.`
- `Today's posture: cap WIP at 2 tickets and resist new pickups — last month flagged scattering.`

Pass the resulting string back to the synthesis phase as
`POSTURE_HINT`. Synthesis inserts it directly under the `## Plan` header in
the issue body (or the top-level title in file-mode output, though
file-mode never has a monthly review so this is moot).

## Notes

- Hardcoding day-of-week postures (e.g. "Wed = deep work") is explicitly
  out of scope. The hint stays current only because the user updates the
  monthly review through the month.
- The skill never edits the monthly review body. Updates are user-driven.
- If a calendar month has no daily runs at all, no review issue exists for
  that month — that's fine and intentional. The first run of the next
  month creates the next review and ignores the gap.
