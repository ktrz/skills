---
name: resolve-pr-comments
version: 1.3.0
model: sonnet
description: Walk through unresolved PR review comments one at a time, investigating each one and presenting options before asking the user what to do. Replies and thread resolution happen in bulk at the end. Use this skill when the user says "resolve PR comments", "address review feedback", "handle PR review", "go through review comments", "fix PR comments", or references review feedback on a pull request. Also trigger when the user mentions a PR number with review-related intent.
---

# Resolve PR Review Comments

Walk through unresolved review comments on a GitHub PR. For each comment, investigate the code, present the user with concrete options, then implement their chosen action. After all comments are processed, reply to every thread and resolve them in one batch.

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

### 3. Process each comment one at a time

For each unresolved thread:

1. **Present the comment** clearly:
   - File path and line number
   - Author
   - The comment body
   - Any replies in the thread

2. **Investigate the code** before asking the user anything:
   - Read the relevant file and surrounding context
   - Understand what the reviewer is asking for
   - Consider whether the comment is a bug fix, style nit, design suggestion, question, etc.
   - Think about what the fix would actually look like

3. **Present options** — based on your investigation, offer the user concrete choices. Tailor these to the specific comment, but common options include:
   - **Fix it** — describe the specific change you'd make. For bug comments, mention the test you'd write first (e.g., "I'll add a test that passes `null` to `processUser()` and expects it not to throw, then add the null guard")
   - **Partially address** — if the comment has multiple parts or you agree with some but not all
   - **Reply explaining why** — if the current code is correct or the suggestion doesn't apply, draft what you'd say
   - **Skip** — move on without action
   - **Something else** — the user always has the option to direct you differently

   The key is specificity: don't just say "fix it?" — say what the fix would be so the user can make an informed decision quickly.

4. **Wait for the user's decision** before acting.

5. **Implement the chosen action**:
   - **If the comment identifies a bug**, use a test-first approach:
     1. **Write a failing test** that reproduces the bug described in the review comment. The test should target the specific faulty behavior — not a broad integration test, but a focused one that fails because of the bug.
     2. **Run the test** and confirm it actually fails. If it doesn't fail, reconsider whether the bug is real or whether the test is targeting the right behavior. Adjust the test or discuss with the user.
     3. **Apply the fix** to make the test pass.
     4. **Run the test again** to confirm it passes, along with any other related tests to check for regressions.
     5. Commit the test and fix together with a descriptive message.
   - **For all other comment types** (style nits, design suggestions, naming, etc.):
     - Make code changes if applicable
     - Run typecheck/lint/tests as appropriate to verify
     - Commit the fix with a descriptive message referencing the ticket if one is apparent from the branch name.
   - Always review `git diff` before committing.
   - **Do NOT reply to the comment or resolve the thread yet** — save these for the end.

6. **Track what was done** — keep a running list of each thread, what action was taken, and what reply to post. Present this list in a brief summary line after each comment so the user can see progress (e.g., "3/7 done — 2 fixed, 1 skipped").

7. **Move to the next comment.**

### 4. Bulk reply and resolve

After all comments have been processed:

1. **Show a summary** of everything that was done — list each comment with the action taken and the proposed reply.

2. **Ask the user to confirm** before posting anything. They might want to adjust a reply or change their mind on something.

3. **Post all replies and resolve all threads** in a single batched GraphQL mutation. Use aliases to combine every reply and resolve into one request:
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

4. **Push the changes** if not already pushed.

5. Let the user know all review comments have been addressed.

## Important behaviors

- **One comment at a time** — don't batch or summarize the investigation phase. Present each comment individually with your analysis and options, then wait for the user's decision.
- **Investigate before asking** — the whole point is that the user shouldn't have to context-switch into the code to decide. Read the code, understand the issue, and present options with enough detail that the user can decide at a glance.
- **User decides the action** — the user might pick one of your options or tell you something different entirely. Follow their lead.
- **Always verify before committing** — run `git diff` before staging. Run typecheck/lint/tests as appropriate for the change.
- **Commit after each fix** — each resolved comment gets its own commit so the history is clear.
- **Defer all GitHub interaction to the end** — no replying or resolving mid-session. This lets the user review everything at once and change their mind before anything goes live.
- **Concise replies** — keep GitHub replies short and factual. State what was changed, not why the reviewer was right.
- **Skip your own replies** — when fetching threads, the user's own replies are not actionable comments. Focus on comments from reviewers (including automated reviewers like Copilot).
