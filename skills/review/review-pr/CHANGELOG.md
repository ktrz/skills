# Changelog

## 1.6.0

- **Validator now ships with the skill — works on installed copies.** The handover validator the Step 9 check runs is now distributed into this skill as `vendor/handover-validator.mjs` (a generated, byte-for-byte copy of `_shared/handover-validator/dist/validate.mjs`, synced by `_shared/sync.sh`). The invocation changed from the CWD-relative `node _shared/handover-validator/dist/validate.mjs validate <path>` to `node "<skill-base-dir>/vendor/handover-validator.mjs" validate <path>`, resolved from the harness-injected skill base directory. Previously the `_shared/` path was unreachable on any `npx skills add` install (only skill dirs are symlinked, not `_shared/`), so machine validation exited "module not found" and the skill misread that as a malformed doc → hard-fail. The exit-code contract is unchanged (0 → continue; non-zero → regenerate once → hard-fail)

## 1.5.0

- New **`--re-review` mode** for follow-up passes on an already-reviewed PR. Orthogonal to `--deep` / `--pipeline` (re-review changes _what extra is computed_, the existing flags keep deciding _where output goes_). Adds four pieces:
  - **Step 2b — prior review history.** Fetches all review threads (resolved + unresolved) via GraphQL `reviewThreads { isResolved, comments { author { login } body path line } }`, fences every body as `<external_data source="github_pr_comment" trust="untrusted">`, runs the detection-keyword scan, drops boilerplate per `_shared/references/comment-relevance.md`, and builds the prior-findings set. Prior-item identity = same `(file, line)` + substantively overlapping point (the overlap-skim LLM-judge rule, now shared)
  - **Step 5 — upstream injection.** Every agent prompt (specialists, custom, guidelines agent, single-pass fallback) gets a fenced "already raised — do not repeat unless still unaddressed" block, spec in new `references/rereview-agent.md`. Overlap-skim stays as the post-time safety net — layered defence, not duplication
  - **Step 6 — resolution verifier.** A dedicated agent (prompt in `rereview-agent.md`, registered in `references/agents.md` outside the `agents:` config resolution) audits each prior comment against the current diff and returns `{addressed | partial | not-addressed | cant-tell}` + evidence. Its output bypasses normalisation/aggregation
  - **Step 9 — numbered resolution report.** Verifier verdicts go to `<output_dir>/pr-<N>-rereview-<k>.md`, `k = (count of existing pr-<N>-rereview-*.md) + 1`; written in all three modes, deep included. **Deliberately not validated by `_shared/handover-validator/`** — the report is a verdict audit with its own schema, not a handover doc, and the plugin parser would reject it. `pr-<N>-auto-review.md` keeps its schema and its validator check unchanged
- `references/findings-schema.md` gains optional `resolution_status` (`addressed | partial | not-addressed | cant-tell`) — set only in `--re-review` on findings matching a prior item; the verifier reuses the enum as its verdict. Missing field means "not applicable"
- Trust table: prior PR comments upgraded to HIGH (fan-out) in `--re-review` — they are forwarded to N subagents + the verifier instead of only being LLM-compared at post time

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
