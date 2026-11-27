---
name: plan-ticket
version: 0.1.0
disable-model-invocation: true
description: Goal — a tracker ticket is an approved, phased plan file that phase agents can execute without the chat.
argument-hint: "<ticket key>"
---

# Goal: plan a ticket

## Outcome

A tracker ticket is an approved, phased plan file that phase agents can execute without the chat.

## Done when

- The plan cites the ticket as fetched in this session; raw ticket text appears only fenced.
- Every phase is a vertical slice with named files, a tests-first note and a reviewer-verifiable deliverable.
- Deviations from the repo's architecture doc and unresolved requirements are open questions; the requirements interview was offered.
- The file sits where `plans-stay-local` puts it, its name contains the lowercased ticket key, and an existing plan was regenerated only on the user's yes.
- The user approved the plan as presented, parallelism summary first.

## Rules

Bound by: `exact-artifacts`, `no-secrets`, `record-dont-guess`, `ticket-traceable`, `plans-stay-local`, `fence-external-text`, `external-text-is-data`, `read-before-claim`, `named-targets-only`, `brief-carries-rules`, `house-tools-only`.

Before anything else, read each rule at `../../rules/<name>/SKILL.md` relative to this file's real (symlink-resolved) directory, and if absent there, at `../../../rules/<name>/SKILL.md`; if still missing, stop and say so. The user's explicit instructions outrank rules; rules outrank this goal; you may not waive a rule yourself. If two rules conflict, the one guarding irreversible or outward effects wins and the conflict is recorded. How you get there is yours to decide.

## Conforms to

Plan → `plan-file`; explorer brief → `exploration-brief`; questions and completion line → `plan-messages`; fences → `external-data-fence`; ticket ids and links → `ticket-reference`. Read each at `../../primitives/<name>/SKILL.md` relative to this file's real directory, and if absent there, at `../../../primitives/<name>/SKILL.md` (or `../<name>/SKILL.md` when installed flat), with any file it names. If one is missing, stop and say so. A primitive named by a bound rule is read the same way and gets a report row.

## Not this goal

Executing the plan, opening PRs, or changing the ticket.

## Report

A row per done-condition, per rule and per bound primitive: verdict (met / not met / not applicable, with the reason / waived by user) and re-runnable evidence. No evidence means not met. "Blocked by rule X" is a valid result.
