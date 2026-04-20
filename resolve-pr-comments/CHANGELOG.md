# Changelog

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
