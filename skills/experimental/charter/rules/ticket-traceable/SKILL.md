---
name: ticket-traceable
version: 0.1.0
disable-model-invocation: true
description: Where a tracker is configured, every commit, PR and plan carries the ticket resolved from the branch, then history, then the user; never invented, never silently dropped.
---

# Rule: ticket traceable

**Rule.** Where a tracker is configured, every commit, PR and plan carries the ticket resolved from the branch, then history, then the user; never invented, never silently dropped.

**Why.** Work without a ticket link cannot be traced to the request that caused it.

**Applies.** Tracker config is read at `<repo>/.claude/tracker.yaml`, then `~/.claude/tracker.yaml`. With no config: commits omit the ticket; goals that need the tracker stop with their fixed message (`delivery-messages`); a review request skips only the ticket transition. A ticket the user declined to give is omitted, and that is said. Id and link forms are the `ticket-reference` primitive. Exempt: none.

**Check.** Show the config path found (or that none exists), the ticket id, and its source (branch, history or user).

**If it blocks you.** If the id cannot be resolved, ask the user; do not guess. Where the user cannot answer, treat it as `record-dont-guess` and stop the affected part.
