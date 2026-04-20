---
name: resolve-pr-comments
version: 1.6.0
model: sonnet
description: Walk through unresolved PR review comments one at a time, investigating each one and presenting options before asking the user what to do. Replies and thread resolution happen in bulk at the end. Use this skill when the user says "resolve PR comments", "address review feedback", "handle PR review", "go through review comments", "fix PR comments", or references review feedback on a pull request. Also trigger when the user mentions a PR number with review-related intent.
---

# Resolve PR Review Comments

Walk through unresolved review comments on a GitHub PR in two phases: first collect the user's decisions on every comment (fast, interactive), then implement all changes in a batch (autonomous). Replies and thread resolution happen in bulk at the end.

The two-phase approach lets the user give rapid-fire decisions ("fix", "defer", "skip") without waiting for implementation between each one. This is much faster than alternating between deciding and implementing.

## Workflow

### 1. Identify the PR

- If the user provides a PR number (e.g., `/resolve-pr-comments 603`), use that
- Otherwise, detect the PR from the current branch:
  ```bash
  gh pr view --json number,title,url --jq '.number'
  ```
- Confirm the PR with the user before proceeding

### 2. Fetch unresolved review threads

Use the GraphQL API to get only unresolved threads:

```bash
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 50) {
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
      }
    }
  }
}'
```

Extract owner/repo from the git remote. Filter to `isResolved == false`.

### 3. Fetch review-level comments

Inline threads don't capture everything — reviewers often include important findings in the **review body** (the top-level summary submitted with a review). These can contain critical issues, items outside the diff, or cross-cutting concerns that don't attach to a specific line.

Fetch review bodies from the same PR:

```bash
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviews(first: 50) {
        nodes {
          id
          author { login }
          body
          state
          url
          createdAt
        }
      }
    }
  }
}'
```

Filter to reviews where `body` is non-empty and not just a generic "LGTM" or approval. Focus on reviews with `state` of `CHANGES_REQUESTED` or `COMMENTED` that contain substantive feedback — look for bullet points, code blocks, or paragraphs that raise specific issues.

Parse the review body into individual action items. A single review body often contains multiple distinct points (e.g., a "Critical" section and a "Not in diff but worth noting" section). Split these into separate items so each gets its own investigation and decision, just like inline threads. Use markdown headers, numbered lists, or paragraph breaks as splitting cues.

Present review-body items **before** inline threads — they tend to be higher-priority (cross-cutting concerns, issues outside the diff, critical findings the reviewer chose to highlight at the top level). For each item, note that it came from a review-level comment and link to the review URL.

Since review bodies aren't threads, they can't be resolved via GraphQL. Instead, reply to them with a PR comment at the end (alongside the thread replies), referencing the review URL.

### 4. Phase 1 — Collect decisions (fast, interactive)

This phase is about building a complete decision list. Move quickly — investigate each comment, present options, record the user's call, move on. Do NOT implement anything yet.

Process review-body items first, then inline threads. For each item:

1. **Present the comment** clearly:
   - For inline threads: file path, line number, author, comment body, any replies
   - For review-body items: author, the specific item extracted from the review, link to the review

2. **Investigate the code** before asking the user anything:
   - Read the relevant file and surrounding context
   - Understand what the reviewer is asking for
   - Consider whether the comment is a bug fix, style nit, design suggestion, question, etc.
   - Think about what the fix would actually look like

3. **Present options** — based on your investigation, offer the user concrete choices. Tailor these to the specific comment, but common options include:
   - **Fix** — describe the specific change you'd make
   - **Reply** — if the current code is correct or the suggestion doesn't apply, draft what you'd say
   - **Defer** — acknowledge the point but handle it in a follow-up (e.g., a separate issue or PR)
   - **Skip** — move on without action or reply
   - **Something else** — the user always has the option to direct you differently

   The key is specificity: don't just say "fix it?" — say what the fix would be so the user can decide at a glance.

4. **Record the user's decision** — the user may give a one-word answer ("fix", "defer", "reply", "skip") or provide more specific instructions. Record exactly what they said. If they say something custom (e.g., "fix but use approach X" or "defer, create a Linear issue"), record that too.

5. **Show running progress** after each decision:
   ```
   Progress: 5/12 — 3 fix, 1 defer, 1 reply
   ```

6. **Recognize shorthand** — if the user establishes a pattern, let them go faster:
   - "defer" alone means "add to the relevant deferred issue we've been using"
   - "fix" alone means "do what you suggested"
   - "reply" alone means "post the reply you drafted"
   - The user may also batch responses: "fix the next 3" or "skip all the low-priority nits"

7. **Deduplicate as you go** — if a comment is clearly a duplicate of one already discussed (same issue, different thread), note it and ask the user to confirm rather than re-investigating.

8. **Move to the next comment.** Do not implement anything yet.

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

5. Let the user know all review comments have been addressed.

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
- **Deduplicate review-body items against inline threads** — review summaries often mention the same issues that also appear as inline comments. When a review-body item clearly refers to something already covered by an inline thread (same file, same issue), skip the review-body item and note it will be handled when you reach the inline thread. Only process review-body items that raise points *not* covered by any inline thread.
