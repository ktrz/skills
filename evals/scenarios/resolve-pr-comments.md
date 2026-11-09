# Live eval spec — `resolve-pr-comments`

- **Target:** `resolve-pr-comments`
- **Stable path:** `skills/review/resolve-pr-comments`
- **Trigger set:** [`resolve-pr-comments.trigger.json`](./resolve-pr-comments.trigger.json)

These scenarios check the boundary between handling existing reviewer feedback and
performing a fresh code review. Run them against a real model as described in
[`../README.md`](../README.md). A valid trigger set is not evidence that routing
passes; record live results separately.

Use a test PR with existing review comments for positive GitHub-backed cases.
Use a fixture handover document with at least one `[d]` item for the document
case. Do not approve replies, thread resolution, pushes, or other GitHub writes
while checking trigger selection.

## Scenarios

### `feedback-trigger` — select the existing-feedback workflow

- **Prompts:**
  - "address feedback on PR #123"
  - "resolve the reviewer comments on PR #123"
  - "go through the unresolved review threads on my pull request"
  - "fix the changes requested by the reviewer on PR #123"
- **Should trigger:** yes
- **Expect:**
  - The `resolve-pr-comments` skill is read or invoked for each paraphrase.
  - The workflow asks the user to confirm the PR before fetching review threads.
  - It investigates existing feedback and collects decisions, rather than starting
    a fresh review of the diff.
  - It keeps implementation and GitHub writes behind the existing confirmation gates.

### `handover-trigger` — preserve the document-only entry point

- **Prompt:** discuss the [d]-flagged review decisions using --from-doc pr-123-review-decisions.md
- **Should trigger:** yes
- **Expect:**
  - The skill selects the `--from-doc` entry point and processes only `[d]` items.
  - It skips the GitHub fetch and writes decisions into the handover document.
  - It does not implement code, post replies, or resolve GitHub threads.

### `fresh-review-negative-trigger` — leave new reviews to another workflow

- **Prompts:**
  - "review PR #123"
  - "review PR #123 for correctness and security"
  - "review the changes in my branch since main"
  - "review this diff for bugs before I open a pull request"
- **Should trigger:** no
- **Expect:**
  - None of these prompts reads or invokes `resolve-pr-comments`.
  - A PR number alone does not select the existing-feedback workflow.
  - The response handles the fresh review request without fetching unresolved
    threads as part of this skill's decision-collection workflow.

### `status-negative-trigger` — leave status checks outside this workflow

- **Prompt:** check the status of PR #123
- **Should trigger:** no
- **Expect:** the response checks PR status without invoking `resolve-pr-comments`
  or collecting decisions on review feedback.
