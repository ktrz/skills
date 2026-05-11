# Changelog

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. GitHub PR comment bodies and reply chains are wrapped in `<external_data trust="untrusted">` before being forwarded to investigation subagents, and the handover document re-fences each `**Comment:**` block so downstream skills (`execute-review-decisions`, `resolve-pr-comments --from-doc`) preserve the boundary. Trust Boundaries section added to `SKILL.md`. Subagent prompt directive added to `SKILL.md` Step 3.

## 1.0.0

- Initial release — fetches review-pr findings + GitHub human comments, runs investigation subagents in batches over the merged queue, writes a single structured handover doc (`pr-NNN-review-decisions.md`) for offline triage. No GitHub side effects.
