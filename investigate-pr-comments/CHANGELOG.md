# Changelog

## 1.2.0

- Step 3 split by source: auto-review items (`source: "auto-review"`) pass through unchanged because the upstream `review-pr` specialists already produced Comment/Analysis/Recommendation/Options with codebase access; investigation subagents now run only on the human-comment subset. Auto-review-heavy queues no longer pay for redundant re-investigation
- Batching reference's "< 3 items skip subagents entirely" threshold rebound to the human-comment subset (was previously evaluated against the merged queue, which masked the small-human-comment case behind a large auto-review tail)
- Step 1 source-B filter rewritten to classify by **content relevance**, not author identity. Every fetched comment is run through `_shared/references/comment-relevance.md` (new): substantive line-anchored content is kept regardless of author, boilerplate (`Review skipped`, `Draft detected`, coverage summaries, marketing wrappers, `:+1:` reactions) is dropped regardless of author. The `[bot]`-suffix heuristic admitted bot status pings while suppressing real bot review findings (CodeRabbit, Greptile, Sourcery authenticate as plain user accounts) — replaced wholesale

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. GitHub PR comment bodies and reply chains are wrapped in `<external_data trust="untrusted">` before being forwarded to investigation subagents, and the handover document re-fences each `**Comment:**` block so downstream skills (`execute-review-decisions`, `resolve-pr-comments --from-doc`) preserve the boundary. Trust Boundaries section added to `SKILL.md`. Subagent prompt directive added to `SKILL.md` Step 3.

## 1.0.0

- Initial release — fetches review-pr findings + GitHub human comments, runs investigation subagents in batches over the merged queue, writes a single structured handover doc (`pr-NNN-review-decisions.md`) for offline triage. No GitHub side effects.
