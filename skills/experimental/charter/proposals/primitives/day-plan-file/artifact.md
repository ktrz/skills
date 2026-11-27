# Artifact: day-plan file

## File name, body and shared rules
Source: skills/workflow/plan-my-day/SKILL.md:836-897

`````markdown
Save to `OUTPUT_PATH/YYYY-MM-DD-<short-description>.md` where
`<short-description>` is a 2-4 word kebab-case summary of the main themes
(e.g. `2026-03-13-v3-migration-and-reviews.md`). Create the directory first
with `mkdir -p OUTPUT_PATH`.

The file body uses the same section structure as the issue body above (with
a top-level heading added):

```markdown
# <Day of week>, <Month Day> — Daily Plan

## Do first (people are waiting)

Items where someone is blocked on you or expecting a response: pending PR
reviews from teammates, review requests on your own PRs, Slack messages
asking you for something, scheduled meetings to set up.

- [ ] **Item** — brief context

## Main focus (deep work)

The 2-4 most important implementation tasks for the day. Pick from Active
worktrees with the most recent activity or highest tracker priority.

- [ ] **TICKET-ID** — <summary> · <dirty/ahead/PR status>

## If you have time

Lower-priority tickets, orphan tickets not yet started, and
non-urgent follow-ups.

- [ ] **TICKET-ID** — <summary> (<status>) — context

## Not today (but don't forget)

Blocked tickets or items that aren't actionable yet but should stay visible.

- [ ] **TICKET-ID** — <reason it's parked>

## Cleanup (end of day)

Stale worktrees to close, branches to delete, Done-ish tickets to tidy up.
Good for low-energy time.

- [ ] Close worktree **branch-name** — <reason: ticket closed / no activity / superseded>
```

After writing the file, tell the user where it was saved.

### Shared rules (both outputs)

- Use the friendly date format in headers (e.g. "Friday, March 13").
- Omit any section that would be empty (except `## Standup — <date>` in
  issue mode — always keep it with its three subsections as headers).
- Do not show Done-ish worktrees in "Main focus" — move them to "Cleanup".
- Keep descriptions concise; one line per item plus sub-bullets for detail.
- Distribute Slack follow-ups into the appropriate urgency section rather than
  grouping them separately (e.g. a review request goes in "Do first", a casual
  discussion thread goes in "If you have time").
- Close mode (goal `day-closed`) and the monthly review only operate
  when `DAY_PLAN_REPO` is set. File-mode plans don't carry standup or a
  monthly review, so the posture hint is omitted there.
`````
