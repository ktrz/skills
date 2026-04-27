---
name: resolve-pr-comments
version: 1.9.0
model: sonnet
description: Walk through unresolved PR review comments one at a time, investigating each one and presenting options before asking the user what to do. Replies and thread resolution happen in bulk at the end. Also supports `--from-doc <file>` mode for processing only `[d]`-flagged items from a review handover document produced by `investigate-pr-comments`. Use this skill when the user says "resolve PR comments", "address review feedback", "handle PR review", "go through review comments", "fix PR comments", or references review feedback on a pull request. Also trigger when the user mentions a PR number with review-related intent.
---

# Resolve PR Review Comments

Walk through unresolved review comments on a GitHub PR in two phases: first collect the user's decisions on every comment (fast, interactive), then implement all changes in a batch (autonomous). Replies and thread resolution happen in bulk at the end.

The two-phase approach lets the user give rapid-fire decisions ("fix", "defer", "skip") without waiting for implementation between each one. This is much faster than alternating between deciding and implementing.

## Entry points

This skill has two entry points. They share the same Phase 1 interactive loop but differ on where the queue comes from and what happens after each decision.

**A) `/resolve-pr-comments [PR]`** — the original flow. Fetch unresolved threads + review-body items from GitHub, investigate each, present options, collect decisions, implement, then bulk-post replies + resolve threads at the end. This is the right entry point when reviewing **someone else's** PR feedback on **your** PR, or any time you want to handle the full set of review comments in one sitting. Continue with [Workflow](#workflow) below.

**B) `/resolve-pr-comments --from-doc <file>`** — load only items marked `[d]` (discuss) from a review handover document produced by `investigate-pr-comments`. Skip the GitHub fetch entirely. Run investigation subagents only for those items. Proceed with the existing Phase 1 interactive loop. **After each user decision, write the resolution back into the document** (update the item's status marker + Resolution note in place) rather than implementing immediately. When all `[d]` items have been processed, exit with:

> Decisions written back to `<file>`. Run `/execute-review-decisions <file>` when ready.

This entry point is for the automated review pipeline (`implement-feature` → `review-pr` → `investigate-pr-comments` → handover doc) when the user has flagged items as needing interactive discussion. The doc remains the single source of truth — `execute-review-decisions` reads `[x]`/`[~]` items including the ones you just resolved here.

When invoked via `--from-doc`:

- Status marker rewriting: `[d]` → `[x]` if user picks the recommended option, `[d]` → `[~]` if user gives a custom instruction or edits, `[d]` → `[-]` if user skips, leave `[d]` if user defers further.
- Resolution note: write `fix (a)`, `fix (b)`, the custom instruction verbatim, or `reply: <text>` per the schema in `investigate-pr-comments/references/handover-format.md`.
- Do **not** implement code, do **not** post to GitHub, do **not** resolve threads. That is `execute-review-decisions`'s job after the user reviews the updated doc.
- Skip the dedup pass against GitHub threads — the handover doc already deduped at write time.

Three usage paths in one place:

- **Automated (own PRs):** `implement-feature` runs `review-pr` → `investigate-pr-comments` → produces handover doc → user edits → `execute-review-decisions <file>`.
- **Discuss flagged items only:** `/resolve-pr-comments --from-doc <file>` (this entry point B).
- **Manual interactive (others' PRs / any time):** `/resolve-pr-comments [PR]` (entry point A — full flow below).

## Workflow

### 1. Identify the PR

- If the user provides a PR number (e.g., `/resolve-pr-comments 603`), use that
- Otherwise, detect the PR from the current branch:
  ```bash
  gh pr view --json number,title,url --jq '.number'
  ```
- Confirm the PR with the user before proceeding

### 2. Fetch unresolved review threads

Use the GraphQL API to get only unresolved threads. **Paginate** — the GitHub GraphQL API caps `first:` at 100, and PRs with heavy review traffic routinely exceed that. Missing threads is silent: the query succeeds, you just never see the tail, which makes it trivially easy to reply "all resolved!" while threads sit unresolved in the UI. Always loop over `pageInfo.hasNextPage` until it returns false.

```bash
gh api graphql -f query='
query($after: String) {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100, after: $after) {
        nodes {
          id
          isResolved
          comments(first: 10) {
            nodes {
              id
              author { login }
              body
              path
              line
              createdAt
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}' -f after=""
```

Loop: if `pageInfo.hasNextPage` is true, re-run with `-f after="<endCursor>"` and accumulate `nodes` into a single list. Stop when `hasNextPage` is false.

Extract owner/repo from the git remote. Filter to `isResolved == false`.

**Sanity check:** print the total thread count and unresolved count (e.g., `Total: 55, Unresolved: 9`) so the user can eyeball it against the GitHub UI before you start Phase 1. If the number looks low for the PR in question, suspect pagination — re-run and verify you've drained all pages.

### 3. Fetch review-level comments

Inline threads don't capture everything — reviewers often include important findings in the **review body** (the top-level summary submitted with a review). These can contain critical issues, items outside the diff, or cross-cutting concerns that don't attach to a specific line.

Fetch review bodies from the same PR. **Paginate the same way as threads** — same 100-item cap, same silent-truncation risk:

```bash
gh api graphql -f query='
query($after: String) {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviews(first: 100, after: $after) {
        nodes {
          id
          author { login }
          body
          state
          url
          createdAt
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}' -f after=""
```

Loop on `pageInfo.hasNextPage` until false, accumulating `nodes`.

Filter to reviews where `body` is non-empty and not just a generic "LGTM" or approval. Focus on reviews with `state` of `CHANGES_REQUESTED` or `COMMENTED` that contain substantive feedback — look for bullet points, code blocks, or paragraphs that raise specific issues.

Parse the review body into individual action items. A single review body often contains multiple distinct points (e.g., a "Critical" section and a "Not in diff but worth noting" section). Split these into separate items so each gets its own investigation and decision, just like inline threads. Use markdown headers, numbered lists, or paragraph breaks as splitting cues.

Present review-body items **before** inline threads — they tend to be higher-priority (cross-cutting concerns, issues outside the diff, critical findings the reviewer chose to highlight at the top level). For each item, note that it came from a review-level comment and link to the review URL.

Since review bodies aren't threads, they can't be resolved via GraphQL. Instead, reply to them with a PR comment at the end (alongside the thread replies), referencing the review URL.

### 4. Phase 1 — Collect decisions (fast, interactive)

This phase builds a complete decision list. Investigation runs in **parallel batches via subagents** so the user is rarely waiting on a single comment to be analysed — by the time they finish answering question N, the report for question N+K is usually already on disk.

**Read `references/investigate.md` before launching the first batch.** That file is the authoritative spec for the subagent prompt, the report format, batch sizing, and ordering. The summary below is the orchestration loop only.

#### Orchestration loop

Order: review-body items first, then inline threads in fetch order. Build a single ordered queue, then chunk into batches.

**Pre-batch dedup pass.** Before chunking, scan the queue for duplicates so subagents don't waste cycles investigating the same thing twice:

- Same `file:line` with near-identical body → collapse into one entry, attach the other thread IDs as aliases.
- Review-body item that clearly references an issue already covered by an inline thread (same file/function, same concern) → drop the review-body item; the inline thread will handle it.
- Multiple comments on the same symbol/function raising the same concern → collapse, note all thread IDs.

Collapsed entries carry the full list of original thread IDs so Phase 6 can reply/resolve all of them with the same answer. When in doubt, keep separate — present-time dedup (step 3 below) is the fallback for non-obvious dupes.

1. **First batch (synchronous).** Chunk the queue into batches of B comments (default B=5). Spawn ONE subagent for batch 1 (covering queue items 1..B), pass the multi-comment prompt template from `references/investigate.md`, and wait for it to return per-comment reports for the whole batch. Total subagents across the run = `ceil(queue_size / B)`, NOT `queue_size`. A 20-comment queue at B=5 = 4 subagents, not 20. Skip subagents entirely if the queue has fewer than 3 items — just investigate inline.

2. **Background prefetch.** As soon as you start questioning the user on batch K, spawn batch K+1's subagent in the background (`run_in_background: true`) — one subagent for the next B comments, not B subagents. Maintain a lookahead of at least one batch. If the user is unusually fast and catches up, await the in-flight subagent before presenting.

3. **For each comment, in queue order:**
   - **Present** the subagent's condensed report: location, what the code does, what the reviewer wants, the option list with the recommended pick highlighted. Don't dump the raw subagent output — pick the headline and the options.
   - **Record the user's decision.** Accept shorthand: "fix" = take the recommended option, "reply" = post the drafted reply, "defer" = add to the running deferred bucket, "skip" = no action. Custom instructions ("fix but use approach X", "defer + Linear ticket") are recorded verbatim.
   - **Show running progress** (`Progress: 5/12 — 3 fix, 1 defer, 1 reply`).
   - **Batch responses** are fine: "fix the next 3", "skip all low-priority nits". Apply across the queue, then continue.
   - **Deduplicate as you go** — pre-batch dedup catches obvious cases, but if a subagent's report reveals a non-obvious duplicate of an earlier decision (same root cause, different surface), note it and confirm with the user rather than re-presenting the full report. Carry the new thread ID into the original decision so both threads get the same reply/resolve in Phase 6.

4. **Cancel waste.** If the user says "skip the rest" or "defer everything below priority X", cancel any background batches still investigating items that are now resolved by that blanket decision. Don't burn subagent time on work the user has already triaged away.

Do not implement anything in this phase.

After all comments have been reviewed, present a **decision summary table**:

```
| #  | File              | Action | Detail                              |
|----|-------------------|--------|-------------------------------------|
| 1  | router.ts:42      | Fix    | Add null check before access        |
| 2  | api-client.ts:88  | Reply  | Retry logic is intentional          |
| 3  | types.ts:15       | Fix    | Narrow type from string to union    |
| 4  | schema.ts:7       | Defer  | Needs broader refactor              |
| ...| ...               | ...    | ...                                 |
```

**If there are deferred items**, organize them before moving on:

- Group related deferred comments into logical tickets (e.g., multiple type-safety deferrals might belong in one "improve type coupling" issue)
- Present the proposed tickets with title, description, and which comments they cover
- Detect the project's issue tracker from context (Linear, GitHub Issues, Jira, etc.) — check for CLI tools (`linear`, `gh issue`), MCP servers, or project conventions. If unclear, ask the user which tracker to use.
- The user may adjust grouping, rename tickets, or decide some deferrals don't need a ticket at all
- Create the agreed-upon tickets

Ask: **"Ready to implement?"** Wait for confirmation before proceeding to Phase 2.

### 5. Phase 2 — Implement all changes (autonomous, batched)

Once the user confirms the decision summary, switch into implementation mode. By this point Phase 1 has filled the context with investigation notes and decision chatter, so the rules that govern execution — especially the TDD requirement for bug fixes — need to be reloaded fresh before any code change happens.

**Before touching any code, read `references/execute.md` in full.** That file is the authoritative playbook for Phase 2: TDD for bug fixes (red → green → suite), ordering, commit grouping, reply-only handling, and the wrap-up report. Treat it as the primary instruction for this phase; this section is just the pointer.

Do not start editing until you have re-read that file in the current turn.

### 6. Bulk reply and resolve

After all changes are implemented:

1. **Show a summary** of proposed replies — list each comment with the reply text.

2. **Ask the user to confirm** before posting anything. They might want to adjust a reply.

3. **Post all replies and resolve all threads** in batched GraphQL mutations. Use aliases to combine replies and resolves — batch in groups of 6 to stay within API limits:

   ```bash
   gh api graphql -f query='
     mutation {
       reply0: addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: "THREAD_ID_0", body: "Fixed: renamed variable to userCount"}) {
         comment { id }
       }
       resolve0: resolveReviewThread(input: {threadId: "THREAD_ID_0"}) {
         thread { isResolved }
       }
       reply1: addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: "THREAD_ID_1", body: "Added null check"}) {
         comment { id }
       }
       resolve1: resolveReviewThread(input: {threadId: "THREAD_ID_1"}) {
         thread { isResolved }
       }
     }'
   ```

   Build the mutation dynamically — for each thread, add a `replyN: addPullRequestReviewThreadReply(...)` alias if a reply is warranted, and a `resolveN: resolveReviewThread(...)` alias if the thread should be resolved. Use the thread `id` from the fetch query (step 2) directly — these are the same GraphQL node IDs needed by both mutations.
   - Skipped comments are left unresolved and unreplied unless the user says otherwise.
   - For review-body items (which aren't threads), post a single PR comment summarizing what was addressed, using `gh pr comment`. Reference the review URL so the reviewer can find the response.

4. **Push the changes** if not already pushed.

5. **Post-flight verification** — re-run the paginated thread fetch from step 2 and assert the unresolved count is zero (or matches the set the user said to skip). This catches the silent pagination-truncation failure mode: if step 2 missed a page, you'll reply "all resolved" while threads linger in the UI. Always do this before the user walks away — it's one extra API call that surfaces a bug class the user would otherwise only catch by scrolling through the PR themselves.

6. Let the user know all review comments have been addressed.

## Important behaviors

- **Two phases, strictly separated** — Phase 1 is for decisions only (no code changes). Phase 2 is for implementation (no new decisions). This separation is what makes the workflow fast — the user can give all their decisions in one sitting, then walk away while implementation happens.
- **One comment at a time in Phase 1** — don't batch or summarize the investigation phase. Present each comment individually with your analysis and options, then wait for the user's decision.
- **Accept shorthand** — if the user says "fix", that means "do what you proposed." Don't ask for confirmation. If they say "defer", record it and move on. Keep the conversation moving.
- **Investigate before asking** — the whole point is that the user shouldn't have to context-switch into the code to decide. Read the code, understand the issue, and present options with enough detail that the user can decide at a glance.
- **User decides the action** — the user might pick one of your options or tell you something different entirely. Follow their lead.
- **Always verify before committing** — run `git diff` before staging. Run typecheck/lint/tests as appropriate for the change.
- **Group commits logically** — don't commit after each individual fix. Group related changes (e.g., "all code quality fixes", "error handling improvements", "new tests") into logical commits.
- **Defer all GitHub interaction to the end** — no replying or resolving mid-session. This lets the user review everything at once and change their mind before anything goes live.
- **Concise replies** — keep GitHub replies short and factual. State what was changed, not why the reviewer was right.
- **Skip your own replies** — when fetching threads, the user's own replies are not actionable comments. Focus on comments from reviewers (including automated reviewers like Copilot).
- **Deduplicate review-body items against inline threads** — review summaries often mention the same issues that also appear as inline comments. When a review-body item clearly refers to something already covered by an inline thread (same file, same issue), skip the review-body item and note it will be handled when you reach the inline thread. Only process review-body items that raise points _not_ covered by any inline thread.
