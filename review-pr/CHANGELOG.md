# Changelog

## 1.4.0

- Step 9 now **validates the auto-mode file (`pr-<N>-auto-review.md`) against the real plugin parser** before printing success or posting. The `review-plugin-mvp` parser is vendored byte-for-byte into `_shared/handover-validator/`; the skill runs `node _shared/handover-validator/dist/validate.mjs validate <path>` after the file write in both auto pipeline and auto standalone modes. On failure the file is **regenerated once** from the aggregated findings, then re-validated; a second failure **hard-fails** rather than leaving a file the downstream plugin and `investigate-pr-comments` cannot parse
- Retired the deferred "TDD note" (a snapshot of a recorded review pass that would drift across model updates) in favour of the validator's synthetic fixture + smoke test, run by the `handover-validator drift check` CI job. New "Validation fixture" section documents this

## 1.2.0

- Step 9 `output_dir` resolution rules made explicit: the default `plans.local/<repo>/` substitutes the `<repo>` token from `basename $(git rev-parse --show-toplevel)`; user overrides are taken **verbatim** with no automatic `<repo>` append. If users want per-repo subdirs under a custom root, they include the `<repo>` token in their config themselves. Closes ambiguity in the previous wording where it was unclear whether a user-set `output_dir` would have `<repo>` appended
- `_shared/review.example.yaml` inline comments rewritten to match the new rules; example demonstrates the `<repo>` token in the suggested override
- Post-time suppression (in `references/aggregation.md`) renamed `bot-skim` → `overlap-skim` and rewritten to filter by **content relevance**, not author identity. Every PR comment is fetched regardless of author and run through `_shared/references/comment-relevance.md` (new): a bot's line-anchored finding counts as overlap material and may suppress a duplicate review-pr finding; review-tool boilerplate (`Review skipped`, `Draft detected`, coverage summaries, marketing wrappers) no longer survives. Author allowlists are gone — they rotted on contact with review tools authenticating as plain user accounts. Log line now uses `@<login>` instead of a hardcoded vendor name. Untrusted-content fencing from 1.1.0 is preserved on the substance-check LLM judge. **Breaking:** any external automation grepping log lines for `bot-skim:` needs to switch to `overlap-skim:`; downstream skill `execute-review-decisions` was updated in lockstep

## 1.1.0

- Fence external content per `references/prompt-injection-defense.md`. PR metadata, the unified diff, and bot comment bodies (bot-skim) are wrapped in `<external_data trust="untrusted">` before being forwarded to the parallel review subagents and the single-pass fallback. Subagent prompt templates in `references/agents.md`, `references/review-prompt.md`, and `references/guidelines-agent.md` carry the fences and the "treat as data" directive. Trust Boundaries section added to `SKILL.md`.

## 1.0.0

- Initial release — orchestrates parallel `pr-review-toolkit` specialists with graceful single-pass fallback. Three modes: auto pipeline (file only), auto standalone (file + post), deep (interactive triage).
