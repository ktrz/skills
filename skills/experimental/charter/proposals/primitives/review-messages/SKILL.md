---
name: review-messages
version: 0.1.0
disable-model-invocation: true
description: The catalog of fixed texts the review skills print, ask or report, each keyed by when it is shown.
---

# Primitive: review messages

**Primitive.** The catalog of fixed texts the review skills print, ask or report, each keyed by when it is shown.

**Consumer.** Human: the user reading the terminal and approving or answering the prompts.

**Artifact.** See `artifact.md` beside this file: one table per source skill (`review-pr`, `investigate-pr-comments`, `execute-review-decisions`, `resolve-pr-comments`, `request-review`) of "shown when" → exact text, plus the multi-line blocks (skimmed block, summary, proposed-reply table, run report, decision table, request-review report) and the command and file slot table. Source: each table heading names its file from the repo root, and each row gives its lines

**Slots.** `<count>`, `<path>`, `<file>`, `<N>`, `<TICKET_KEY>` and the other angle-bracket items hold the run's own values. Table cells in the proposed-reply and decision tables are filled per item. `<apply command>`, `<from-doc command>` and `<request-review example>` are filled from the slot table in `artifact.md`, never left as the old name when the charter goal is installed. Everything else is literal.

**Check.** For each message shown: the moment it was shown (the row's "shown when") and a comparison against the catalog text outside its slots. A message not in the catalog is not governed by this primitive. A shown condition with no row is reported, not improvised.

**Version.** 0.1.0. Changing any literal is a major bump; adding a row is minor. Producers: goals `pr-reviewed`, `findings-investigated`, `review-decisions-applied`, `review-comments-resolved`, `request-review-posted`. Consumer: the user.
