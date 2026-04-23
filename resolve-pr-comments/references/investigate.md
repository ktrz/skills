# Parallel investigation — subagent prompt template

Phase 1 investigation runs in parallel batches. Each subagent investigates
one comment and returns a structured result the orchestrator presents to
the user. The orchestrator never asks a subagent to make decisions or
edit code — it only gathers context and proposes options.

## When to launch

- **First batch (synchronous)** — at the start of Phase 1, launch a batch
  of N investigations in a single message (multiple Agent tool calls in
  parallel). Wait for all to finish before presenting comment 1 to the
  user. The user should never wait for the very first investigation.
- **Subsequent batches (background)** — as soon as the user starts
  answering questions on batch K, launch batch K+1 in the background
  (`run_in_background: true`). By the time the user reaches the first
  comment of batch K+1, results should already be ready. Maintain a
  lookahead of at least 1 batch.
- **Stalls** — if the user is faster than the background batch, the
  orchestrator waits for that one investigation to finish, then proceeds.
  This is the worst case; lookahead avoids it for the rest of the queue.

Default batch size: **5**. Tune up for very large PRs or short comments
(less context per investigation), down for comments touching huge files.

## Ordering

Investigations may finish out of order. The orchestrator presents
comments to the user in the original priority order (review-body items
first, then inline threads in fetch order). Stash results by comment
index and pull from the stash as the user advances.

## What to send the subagent

Each subagent gets one self-contained prompt. It does not see the
conversation history, the other comments, or the user's prior decisions.
Include everything it needs:

- Repo path (absolute) and the PR number for context
- Comment metadata: author, file path, line number (or "review-body" if
  it has no inline anchor), the comment body verbatim, any reply chain
- For review-body items: the review URL and the specific item extracted
  from the body (not the whole review)
- If the queue entry was collapsed in the pre-batch dedup pass, include
  the alias thread IDs and a one-line note ("also covers threads X, Y —
  same concern"). The subagent investigates once; the orchestrator
  fans the resulting decision out to all aliased threads in Phase 6.
- Explicit instruction that this is **investigation only** — no edits,
  no commits, no GitHub interaction

## What the subagent returns

A short structured report. Keep it tight — the orchestrator will read
several of these in a row, and the user will see a condensed version.

```
## Comment [N] — [file:line OR review-body]
**Reviewer:** [author]
**Comment:** [one-line summary; quote verbatim if short]

**What the code does today:** [1-3 sentences. Reference the relevant
function/lines so the user can jump if needed.]

**What the reviewer is asking for:** [1-2 sentences interpreting intent.
If ambiguous, say so and list the plausible readings.]

**Classification:** bug | style | design | question | docs | other
(Bug => Phase 2 will use TDD. See references/execute.md.)

**Options:**
- **Fix:** [specific change, e.g., "Add null check at line 42 before
  accessing user.profile; covered by new test in user.test.ts."]
- **Reply:** [draft reply if "current code is correct" is plausible,
  e.g., "Retry logic is intentional — see ADR-014."]
- **Defer:** [what would need to happen to address it later, e.g.,
  "Needs broader refactor of auth module; track as separate ticket."]
- **Skip:** [only suggest if the comment is clearly a non-issue]

**Recommended:** [your top pick + one-sentence reason]
```

The "Recommended" field is for the orchestrator to lead with when
presenting to the user, but the user always sees all options.

## Subagent prompt template

Use the `general-purpose` subagent type unless the comment is purely
research (then `Explore`). Pass this prompt verbatim, filling the
bracketed slots:

```
You are investigating ONE PR review comment so the orchestrator can
present the user with concrete options. You are not editing code, not
committing, not posting to GitHub. Investigation only.

Repo: [absolute path]
PR: [number] in [owner/repo]

Comment:
- Author: [login]
- Location: [file:line OR "review body — see URL"]
- Body:
  [verbatim comment, indented 2 spaces]
- Replies (if any):
  [verbatim, indented]
- Review URL (review-body items only): [url]

Your job:
1. Read the relevant file(s). Look at enough surrounding context to
   understand the function/module, not just the flagged line.
2. Decide what the reviewer is actually asking for. If their wording is
   ambiguous, name the plausible readings.
3. Classify: bug, style, design, question, docs, other. Bugs trigger
   TDD in Phase 2 — be honest about whether wrong behaviour is at stake.
4. Propose 2-4 concrete options the user could pick from. Each option
   must be specific enough that the user can decide at a glance — say
   what the fix would be, not "fix it".
5. Recommend one option with a one-sentence reason.

Return the structured report described in references/investigate.md
(format starting with "## Comment [N]"). Keep it under ~250 words.
Do not edit any files. Do not run git or gh commands beyond read-only
inspection.
```

## Concurrency caps

GitHub API and local file reads are cheap; the bottleneck is subagent
spawn cost. A batch of 5 in parallel is comfortable. Going above ~8
risks rate-limiting on tool calls and clutters the orchestrator's
notification stream. If a PR has 40 comments, that's 8 batches of 5,
not one batch of 40.

## When parallel investigation is not worth it

- Fewer than 3 unresolved comments — just investigate inline.
- All comments cluster in the same file/function — one investigation
  covers them; ask the user to triage as a group instead.
- The user has explicitly opted into "go one at a time, I want to
  steer." Then drop back to the sequential flow.
