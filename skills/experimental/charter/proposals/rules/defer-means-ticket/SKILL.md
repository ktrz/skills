---
name: defer-means-ticket
version: 0.1.0
disable-model-invocation: true
description: Work that is deferred or found out of scope ends as a linked tracker item, or as an entry the user declined, never as a chat mention only.
---

# Rule: defer means ticket

**Rule.** Work that is deferred or found out of scope ends as a linked tracker item, or as an entry the user declined, never as a chat mention only.

**Why.** Deferred findings vanish with the session, and the user is left to discover what was never filed.

**Applies.** Deferred review findings, discovered gaps, and follow-ups; the ticket goes in the list the user named, linked to the parent item. Filing is itself outward, so it falls under `outward-on-go`: show the draft first. Exempt: none.

**Check.** Every "deferred" row in the report has a ticket link or reads "declined by user".

**If it blocks you.** If no tracker or list is known, record the draft items in the decision log, list them at the top of the report, and ask where they go.
