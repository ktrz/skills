# Changelog

## 1.7.0

- **Review history is no longer ignored.** Step 1 Source B now fetches **resolved** review threads too (the existing paginated `reviewThreads` query already returns `isResolved` — partition on it instead of filtering). Resolved threads are tagged `prior-handled` with resolution state preserved (`resolvedBy` login + last-activity timestamp as the `<when>` proxy, since the API exposes no resolution timestamp), bodies fenced as untrusted at fetch time. They never become queue items — context only, so the empty-queue fast path and always-write invariant are untouched
- Step 2 grew a **prior-handled downgrade pass**: each new auto-review or human item matching a prior-handled thread — identity = same `(file, line)` + substantively overlapping point per a per-finding LLM judge (overlap-skim shape from `review-pr/references/aggregation.md`, fenced bodies, boolean output, 50-call cap failing open to "fresh") — is **downgraded and annotated, never dropped**: `**Note:** already handled in a prior review (thread resolved <when> by @<login>)`, keeping its `[?]` marker, severity, and queue position so the user can skip it in seconds without losing the signal that it resurfaced. Full rules in new `references/prior-handled.md`
- Trust boundaries table — resolved thread bodies listed as untrusted, same handling as unresolved (fenced on fetch; read only by the construction-time relevance pre-filter + keyword scan and the boolean downgrade judge; never forwarded to investigators; never copied into the handover)
- **Fence hardening (shared).** `_shared/references/prompt-injection-defense.md` fence-syntax section now requires neutralizing any inner `</external_data>` (and forged opening tags) in an untrusted payload before wrapping, so a hostile body cannot terminate its own fence and cross the trust boundary. Synced to all 10 consumer skills; called out explicitly at the resolved-body fence sites in `SKILL.md` and `references/prior-handled.md`

## 1.6.0

- **Validator now ships with the skill — works on installed copies.** The handover validator the Step 4 check runs is now distributed into this skill as `vendor/handover-validator.mjs` (a generated, byte-for-byte copy of `_shared/handover-validator/dist/validate.mjs`, synced by `_shared/sync.sh`). The invocation changed from the CWD-relative `node _shared/handover-validator/dist/validate.mjs validate <path>` to `node "<skill-base-dir>/vendor/handover-validator.mjs" validate <path>`, resolved from the harness-injected skill base directory. Previously the `_shared/` path was unreachable on any `npx skills add` install (only skill dirs are symlinked, not `_shared/`), so machine validation exited "module not found" and the skill misread that as a malformed doc → hard-fail. The exit-code contract is unchanged (0 → proceed; non-zero → regenerate once → hard-fail)

## 1.5.0

- Step 4 now **validates the written handover doc against the real plugin parser** before exit. The `review-plugin-mvp` parser is vendored byte-for-byte into `_shared/handover-validator/`; the skill runs `node _shared/handover-validator/dist/validate.mjs validate <path>` after writing. On a validation failure the doc is **regenerated once** (fixing the reported violations), then re-validated; a second failure **hard-fails** the skill rather than emitting a doc the plugin cannot load. Closes the gap where a subtly-malformed doc (e.g. a `Source counts:` line disagreeing with the items, or an unfenced `**Comment:**`) would ship and then fail to open in the plugin with an opaque "Failed to load findings"

## 1.4.0

- **Fresh-PR fix: the handover doc is now ALWAYS written.** Previously a just-opened PR with no human reviewer comments could read as "nothing to investigate" and exit without writing `pr-<N>-review-decisions.md`, leaving the downstream plugin with a missing file indistinguishable from a crash. Added an explicit Workflow invariant (and reinforced it in Step 5): a fresh PR carrying only auto-review findings — or none — is the normal case, not a skip. "0 items to investigate" routes straight to the write step
- Step 1 Source A now **auto-detects** the default `plans.local/<repo>/pr-<N>-auto-review.md` when `--auto-review-file` is not passed, before concluding there is no auto-review source. A missing auto-review file is a non-fatal warning, not a fatal condition
- Step 3 grew a zero-item fast path (empty queue → straight to Step 4; auto-review items with 0 human items → no subagents, carry forward to Step 4). Step 4 documents the empty-everything output (valid header, `Status: PENDING REVIEW`, `Source counts: 0 … 0 total`, no item sections). Step 5 prints its summary unconditionally with a clean-review trailing line when the total is 0

## 1.2.0

- Step 3 split by source: auto-review items (`source: "auto-review"`) pass through unchanged because the upstream `review-pr` specialists already produced Comment/Analysis/Recommendation/Options with codebase access; investigation subagents now run only on the human-comment subset. Auto-review-heavy queues no longer pay for redundant re-investigation
- Batching reference's "< 3 items skip subagents entirely" threshold rebound to the human-comment subset (was previously evaluated against the merged queue, which masked the small-human-comment case behind a large auto-review tail)
- Step 1 source-B filter rewritten to classify by **content relevance**, not author identity. Every fetched comment is run through `_shared/references/comment-relevance.md` (new): substantive line-anchored content is kept regardless of author, boilerplate (`Review skipped`, `Draft detected`, coverage summaries, marketing wrappers, `:+1:` reactions) is dropped regardless of author. The `[bot]`-suffix heuristic admitted bot status pings while suppressing real bot review findings (CodeRabbit, Greptile, Sourcery authenticate as plain user accounts) — replaced wholesale

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. GitHub PR comment bodies and reply chains are wrapped in `<external_data trust="untrusted">` before being forwarded to investigation subagents, and the handover document re-fences each `**Comment:**` block so downstream skills (`execute-review-decisions`, `resolve-pr-comments --from-doc`) preserve the boundary. Trust Boundaries section added to `SKILL.md`. Subagent prompt directive added to `SKILL.md` Step 3.

## 1.0.0

- Initial release — fetches review-pr findings + GitHub human comments, runs investigation subagents in batches over the merged queue, writes a single structured handover doc (`pr-NNN-review-decisions.md`) for offline triage. No GitHub side effects.
