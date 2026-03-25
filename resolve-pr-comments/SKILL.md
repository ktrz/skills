---
name: resolve-pr-comments
version: 1.0.0
model: sonnet
description: Walk through unresolved PR review comments one at a time, implementing fixes and resolving threads. Use this skill when the user says "resolve PR comments", "address review feedback", "handle PR review", "go through review comments", "fix PR comments", or references review feedback on a pull request. Also trigger when the user mentions a PR number with review-related intent.
---

# Resolve PR Review Comments

Walk through unresolved review comments on a GitHub PR one at a time. For each comment, present it to the user, ask how they want to handle it, implement the fix, commit, reply to the comment, and resolve the thread.

## Workflow

### 1. Identify the PR

- If the user provides a PR number (e.g., `/resolve-pr-comments 603`), use that
- Otherwise, detect the PR from the current branch:
  ```bash
  gh pr view --json number,title,url --jq '.number'
  ```
- Confirm the PR with the user before proceeding

### 2. Fetch unresolved review threads

Use the GraphQL API to get only unresolved threads — this avoids re-processing already resolved comments:

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

2. **Ask the user** what they want to do. Wait for their response — do not assume an action.

3. **Implement the fix** based on the user's direction:
   - Make code changes
   - Add tests if requested
   - Run typecheck/tests to verify

4. **Commit the fix** automatically after verifying it passes. Use a descriptive commit message referencing the ticket if one is apparent from the branch name. Always review `git diff` before committing.

5. **Reply to the comment** on GitHub explaining what was done:
   ```bash
   gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies \
     -X POST -f body="<concise summary of what was done>"
   ```

6. **Resolve the thread** via GraphQL:
   ```bash
   gh api graphql -f query='
     mutation {
       resolveReviewThread(input: {threadId: "THREAD_ID"}) {
         thread { isResolved }
       }
     }'
   ```

7. **Move to the next comment** — present it and ask the user again.

### 4. Wrap up

After all comments are processed:
- Push the changes if not already pushed
- Let the user know all review comments have been addressed

## Important behaviors

- **One comment at a time** — don't batch or summarize. Present each comment individually and wait for the user's decision before acting.
- **User decides the action** — the user might say "fix it", "skip", "add a test", "just reply explaining why", etc. Follow their lead.
- **Always verify before committing** — run `git diff` before staging. Run typecheck/lint/tests as appropriate for the change.
- **Commit after each fix** — don't batch commits. Each resolved comment gets its own commit so the history is clear.
- **Concise replies** — keep GitHub replies short and factual. State what was changed, not why the reviewer was right.
- **Skip your own replies** — when fetching threads, the user's own replies are not actionable comments. Focus on comments from reviewers (including automated reviewers like Copilot).
