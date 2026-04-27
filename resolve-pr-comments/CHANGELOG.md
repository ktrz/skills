# Changelog

## 1.9.0

- Add `--from-doc <file>` second entry point for the automated review pipeline: loads only `[d]` (discuss) items from a handover document produced by `investigate-pr-comments`, skips the GitHub fetch, runs investigation subagents on just those items, then writes resolutions back into the document instead of implementing
- Status marker rewriting on `--from-doc`: `[d]` → `[x]` for recommended option, `[d]` → `[~]` for custom instructions or edits, `[d]` → `[-]` for skip, `[d]` stays for further deferral
- Updated description and added an "Entry points" section at the top of `SKILL.md` clarifying the three usage paths (automated own PRs, discuss flagged items, manual interactive)
- No changes to existing flow A (`/resolve-pr-comments [PR]`) — backward compatible

## 1.8.0

- Phase 1 investigation now runs in parallel batches via subagents (default batch size 5, lookahead 1)
- First batch is synchronous so the user never waits on comment 1; subsequent batches launch in the background as the user starts answering the previous batch
- New `references/investigate.md` defines the subagent prompt template, structured report format, ordering, and concurrency caps
- Skips parallelisation for queues under 3 items; cancels background batches when the user issues a blanket decision (e.g. "skip the rest")
- Two-layer dedup: pre-batch pass collapses obvious duplicates (same file:line, review-body items covered by inline threads, multiple comments on same symbol) before subagent spend; present-time dedup catches non-obvious cases. Collapsed entries carry alias thread IDs so Phase 6 replies/resolves all of them with one decision

## 1.7.0

- Paginate both `reviewThreads` and `reviews` queries via `pageInfo.hasNextPage` + `endCursor`; raise page size from 50 to 100 (GraphQL max)
- Add a sanity-check print of total/unresolved thread counts after step 2 so the user can cross-check against the GitHub UI before Phase 1 starts
- Add a post-flight verification step after bulk reply/resolve: re-run the paginated fetch and assert zero unresolved (or match the user's skip set). Catches silent truncation bugs that would otherwise surface only when the user scrolls the PR themselves

## 1.6.0

- Move Phase 2 implementation rules into `references/execute.md` — loaded fresh at the Phase 1 → Phase 2 boundary so TDD and commit guidance stay front-of-context after long decision sessions
- SKILL.md Phase 2 section now requires reading the reference file before any code changes

## 1.5.0

- Split workflow into two phases: collect all decisions first (Phase 1), then implement in batch (Phase 2)
- Phase 1 accepts shorthand responses ("fix", "defer", "reply", "skip") for faster iteration
- Running progress counter after each decision
- Decision summary table presented before implementation begins
- Deferred items are organized into logical tickets at the end of Phase 1, with auto-detection of issue tracker (GitHub, Linear, Jira)
- Group related changes into logical commits instead of one commit per comment
- Recognize batch responses ("fix the next 3", "skip all low-priority nits")

## 1.4.0

- Fetch review-level comments (review body) in addition to inline threads
- Parse review bodies into individual action items
- Deduplicate review-body items against inline threads
- Present review-body items before inline threads (higher priority)

## 1.3.0

- Bug comments now use test-first approach: write a failing test that reproduces the bug, confirm it fails, apply the fix, confirm it passes
- Options presented to user mention the test that would be written for bug fixes
- Non-bug comments (style nits, design suggestions, etc.) continue to be handled as before

## 1.2.0

- Replace mixed REST/GraphQL approach with pure GraphQL — the REST reply endpoint expected numeric database IDs but the GraphQL query returns node IDs, causing mismatches
- Batch all replies and thread resolutions into a single GraphQL mutation using aliases
- Use `addPullRequestReviewThreadReply` mutation (takes thread ID directly) instead of REST `/comments/COMMENT_ID/replies`

## 1.1.0

- Investigate each comment before asking — read the relevant code, understand the reviewer's intent, and present concrete options with specific descriptions of what the fix would look like
- Defer all GitHub replies and thread resolution to the end of the session — show a summary, let the user confirm, then post everything in one batch
- Track progress with a running summary line after each comment

## 1.0.0

- Initial version
- Auto-detect PR from current branch or accept PR number as argument
- Fetch unresolved threads via GitHub GraphQL API
- Present comments one at a time, ask user for direction
- Implement fixes, auto-commit, reply, and resolve threads
