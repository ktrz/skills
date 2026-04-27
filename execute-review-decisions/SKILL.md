---
name: execute-review-decisions
version: 1.0.0
model: sonnet
description: >
  Execute approved decisions from a review handover document — implement
  code changes, then post resolved items to the PR in bulk. This is the
  only step that touches GitHub in the automated review loop. Triggers on
  "/execute-review-decisions <file>" or "execute review decisions".
---

# Execute Review Decisions

Read a review handover document (`pr-NNN-review-decisions.md`), implement
every approved item with fresh context, then post replies and resolve
threads on the PR in a single bulk batch.

This is the **last step** in the automated review pipeline (see
`plans.local/skills/skill-tighten-implement-feature-flow.md` Flow 1) and
the **only** step in that pipeline that writes to GitHub. Auto-mode
`review-pr` and `investigate-pr-comments` produce the handover doc
silently; this skill turns the user's offline triage into code + PR
activity.

This skill does not re-investigate. It treats the handover doc as the
authoritative input and trusts the user's status markers verbatim.

## Args

```
/execute-review-decisions <file>
```

- **`<file>`** — required path to the handover document, typically
  `plans.local/<repo>/pr-<N>-review-decisions.md`. Error out if the
  argument is missing or the file is unreadable. Do not auto-detect —
  the file is the explicit hand-off.

## Workflow

### Step 1: Read the document fresh

Do not rely on prior context — by the time the user marks the doc up,
they may have edited it in another window, taken a break, or come back
days later. Open the file, read it end-to-end, and parse it as if you
have never seen it before.

The handover schema is owned by `investigate-pr-comments/references/handover-format.md`
and the underlying finding shape comes from
`review-pr/references/findings-schema.md` — both are the canonical
sources. The summary below is enough to bucket items; reach for the
schema files for edge cases.

Each item is an `## [<status>] <source_tag> — <file>:<line> or "Review body"`
section with the following fields:

- **Source:** `auto-review` (no thread ID — these came from
  `review-pr` auto-mode) or `reviewer: @<login>` (came from a human
  reviewer; the original thread ID is preserved in metadata).
- **Comment:** the original review text.
- **Analysis / Recommendation / Options:** investigation output from
  Phase 2.
- **Resolution:** free-form note from the user. May be empty (the
  status marker carries the meaning) or may override option (a) for
  `[~]` items.

Status markers (see `investigate-pr-comments/references/handover-format.md`):

| Marker | Meaning                                                 | This skill's action                            |
| ------ | ------------------------------------------------------- | ---------------------------------------------- |
| `[?]`  | pending — user has not triaged                          | leave alone; report as still pending           |
| `[x]`  | approved option (a) as-is                               | implement option (a); reply + resolve thread   |
| `[~]`  | approved with edits                                     | implement the resolution note; reply + resolve |
| `[d]`  | discuss — flagged for `/resolve-pr-comments --from-doc` | leave alone; do not touch the thread           |
| `[-]`  | skip                                                    | leave alone; do not post                       |

Build four lists by status marker:

- `execute` — all `[x]` and `[~]` items
- `pending` — all `[?]` items
- `discuss` — all `[d]` items
- `skip` — all `[-]` items

If `execute` is empty, exit with the message:

> Mark items `[x]` or `[~]` in `<file>` and re-run.

Print the four counts so the user can see the workload before
proceeding.

### Step 2: Implement

**Before touching code, read `resolve-pr-comments/references/execute.md`
in full.** That file is the authoritative playbook for execution and
must be loaded fresh into context at this boundary — it covers TDD for
bug fixes (red → green → suite), commit grouping, ordering, reply-only
handling, and the wrap-up report. Do not duplicate it here; treat it
as the primary instruction for this step.

Per-item rules layered on top of `execute.md`:

- **`[x]` (approved as-is)** — implement option (a) verbatim from the
  handover document's Options block. The investigation already named
  the change.
- **`[~]` (approved with edits)** — implement exactly the user's
  Resolution note. The note overrides option (a). If the note is more
  specific than option (a), follow the note; if it conflicts, follow
  the note.
- **Ambiguous resolution** — if the resolution note is unclear (e.g.
  "see option a but also handle the empty case"), pick the **safest
  interpretation** (the one with the smallest blast radius and the
  most explicit handling) and **flag it in the wrap-up report** so
  the user can review. Never silently extrapolate.
- **Bug-classified items** — TDD applies per `execute.md`: red test
  first, then minimal fix, then suite. The classification lives on
  the original finding (see `review-pr/references/findings-schema.md`
  severity buckets — `critical` / `important` are usually bugs;
  `suggestion` / `nit` usually are not, but the Analysis field is the
  ground truth).
- **Auto-review items** — these have no thread ID. Implement them the
  same way as reviewer items; the difference only matters at post
  time.
- **Reply-only items** — if the resolution note is `reply: <text>`
  with no code change, no commit is needed. Draft the reply and move
  on (see `execute.md` "Reply-only items").
- **Commit grouping** — group related changes into logical commits
  per `execute.md`. Do not commit per-item. Commit messages describe
  the batch, not individual review comments.

After implementation: run `git diff`, scan staged hunks, then run
typecheck / lint / test as appropriate. The full test suite runs once
before the bulk post in Step 3.

### Step 3: Post to PR (sole GitHub interaction)

This is the only step that writes to GitHub. Everything before it has
been local-only.

#### 3a. Show the proposed reply summary

Before any GitHub call, show the user a single table of the items
about to post:

```
| #  | File:Line         | Severity   | Source            | Reply preview                           |
|----|-------------------|------------|-------------------|------------------------------------------|
| 1  | router.ts:42      | 🚨 Critical | reviewer: @alice  | Added null check; covered by new test.   |
| 2  | api-client.ts:88  | ⚠️ Important| auto-review       | Narrowed return type to union of states. |
| 3  | types.ts:15       | 💡 Suggestion| reviewer: @bob   | Renamed for clarity.                     |
```

Ask: **"Post all replies and resolve threads?"** Wait for confirmation.
The user can edit the wording of any reply before posting; if they
do, update the entry and re-show the table before posting.

#### 3b. Bot-skim suppression

Before posting, run the bot-skim check from the plan's Context
section (also documented in `review-pr/references/aggregation.md`):

1. Fetch existing PR review comments and reviews:
   ```bash
   gh pr view <N> --json reviews,comments
   ```
2. Filter to comments authored by GitHub Apps (login ends in
   `[bot]` — Copilot, Snyk, Sonar, etc.).
3. For each item we are about to post, check whether a bot has
   already flagged the same `file:line` with substantively
   overlapping content. If yes:
   - **Suppress** the new comment; do not post it.
   - Optionally post a brief **reply on the bot's existing comment**
     to weight it higher (e.g. "+1 — fixed in <commit>").
4. Auto-review items that are PR-level (no `file:line`) cannot
   collide with inline bot comments; they always pass skim.

Bot-skim is **per-finding**, not per-group — if a `(file, line)` had
two distinct findings (e.g. 🚨 + 💡) in the handover, suppressing one
does not suppress the other.

#### 3c. Apply severity emoji prefixing

For every reply that survives bot-skim, prepend the severity emoji
per the Code-Review-Comment Conventions (also in
`review-pr/references/findings-schema.md`):

| Severity        | Prefix                       |
| --------------- | ---------------------------- |
| `critical`      | `🚨 Critical`                |
| `important`     | `⚠️ Important`               |
| `suggestion`    | `💡 Suggestion`              |
| `nit`           | `💡 Suggestion`              |
| (anything else) | `⚠️ Important` + log warning |

Severity for each item comes from the handover doc verbatim — it was
persisted by `review-pr` / `investigate-pr-comments` and never mutated
between then and now.

#### 3d. Bulk post via batched GraphQL mutation

**Reuse the `resolve-pr-comments` Step 6 bulk-mutation logic verbatim
— do not duplicate it.** The mutation pattern, alias scheme, and
batch sizing live in `resolve-pr-comments/SKILL.md` (Step 6 — "Bulk
reply and resolve"). The shape is:

```bash
gh api graphql -f query='
  mutation {
    reply0: addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: "THREAD_ID_0", body: "🚨 Critical — Added null check; covered by new test."}) {
      comment { id }
    }
    resolve0: resolveReviewThread(input: {threadId: "THREAD_ID_0"}) {
      thread { isResolved }
    }
    reply1: addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: "THREAD_ID_1", body: "..."}) {
      comment { id }
    }
    resolve1: resolveReviewThread(input: {threadId: "THREAD_ID_1"}) {
      thread { isResolved }
    }
  }'
```

- Batch in groups of 6 to stay within API limits (per
  `resolve-pr-comments` Step 6).
- Build aliases dynamically. Each item with a thread ID gets a
  `replyN` + `resolveN` pair.
- Use the original thread `id` from the handover doc / Phase 2 fetch
  — these are GraphQL node IDs and work with both mutations.

#### 3e. Auto-review items (no thread ID)

Auto-review findings did not come from GitHub, so there is no thread
to reply to or resolve. Instead, post **a single grouped PR comment**
summarising what was addressed:

```
gh pr comment <N> --body "..."
```

Format the body grouped by severity emoji, with location refs:

```
## Auto-review items addressed

### 🚨 Critical
- `router.ts:42` — Added null check; covered by new test.

### ⚠️ Important
- `api-client.ts:88` — Narrowed return type to union of states.

### 💡 Suggestion
- `types.ts:15` — Renamed for clarity.
```

This is one comment for the entire auto-review batch — not one comment
per finding. The reviewer's eye should land on a tidy summary, not an
N-comment burst.

#### 3f. `[d]` and `[-]` items

Post nothing. `[d]` items will be handled by
`/resolve-pr-comments --from-doc <file>` later; their threads stay
unresolved and untouched on the PR. `[-]` items are explicit user
skips — leave the threads alone (the user will resolve manually if
they want).

#### 3g. Push the branch

If commits from Step 2 have not been pushed, push them now (so the
reviewer's view of "Fixed in <commit>" replies points at code they
can actually see).

#### 3h. Post-flight verification

Re-run the paginated thread fetch from `resolve-pr-comments` Step 2
(verbatim — same paginated GraphQL query, same `pageInfo.hasNextPage`
loop). Assert:

```
unresolved_count == len(skip) + len(discuss)
```

That is: the only threads that should still be unresolved are the
`[-]` skips and the `[d]` discuss-laters. If the count is higher,
something silently fell out of the bulk post (typically a pagination
truncation or a thread ID mismatch). Surface the discrepancy in the
report and do not pretend the run was clean.

### Step 4: Report

Print a concise wrap-up. Suggested shape:

```
Executed: <N> items
  Files changed: <list, one per line if short>
  Tests added: <count> (or "none" if no bug fixes)
  Commits: <list of commit subjects>

Posted to PR #<N>:
  Replies: <count>
  Threads resolved: <count>
  Auto-review summary comment: 1 (or "skipped — no auto-review items")
  Bot-skim suppressed: <count>

Skipped: <len(skip)> items marked [-]
Discuss later: <len(discuss)> items marked [d] — run /resolve-pr-comments --from-doc <file>
Still pending: <len(pending)> items marked [?] — edit <file> and re-run

Ambiguous resolutions (please review): <list, or "none">
```

If anything in Step 2 diverged from the plan (e.g. a `[~]` resolution
needed a different approach because of a typing constraint), call it
out in the wrap-up so the user can spot-check before the reviewer
re-engages.

### Step 5: Offer to mark draft PR ready

After the report, check whether the PR is currently draft:

```bash
gh pr view <N> --json isDraft -q .isDraft
```

If `true` AND post-flight verification passed (`unresolved_count == len(skip) + len(discuss)`), prompt:

> All auto-findings resolved. Mark PR `<N>` ready for review? [y/N]

On `y`: `gh pr ready <N>`. Print confirmation.

On `N` or no response: print "Leaving PR `<N>` as draft. Run `gh pr ready <N>` when ready." and exit.

If the PR is not draft, skip this step entirely.

If post-flight failed, do **not** offer to mark ready — the discrepancy must be resolved first.

## Important behaviours

- **The doc is authoritative; do not re-investigate.** If a status
  marker says `[x]`, the user has already approved option (a). If it
  says `[~]`, the resolution note is the spec. Do not second-guess
  either via fresh code reads — that's what Phase 2 was for.
- **Sole GitHub interaction is at Step 3.** Steps 1 and 2 are local
  only. This means the user can interrupt at any point during
  implementation without leaving the PR in a half-replied state.
- **Failure semantics are biased toward "commits stay, GitHub
  doesn't".** If implementation fails partway, commits already
  written stay on disk (the user can see and amend them). The bulk
  GraphQL mutation requires explicit confirmation in 3a, so a partial
  implementation never accidentally posts replies for code that
  hasn't shipped.
- **Ambiguous `[~]` resolutions get the safest interpretation, not a
  question.** This skill is the autonomous tail of the pipeline — it
  should not block on clarifying questions. Pick the conservative
  reading, ship it, and surface the choice in the report so the user
  can correct in the next round.
- **Auto-review items are summarised, not spammed.** One grouped PR
  comment per run, not N inline comments. The reviewer's PR view
  should not look like a bot just emptied a queue.
- **Bot-skim and emoji prefixing are per-finding** — see
  `review-pr/references/findings-schema.md` and the plan's Context
  section for the full rule.
- **Do not duplicate logic from `resolve-pr-comments`.** The execute
  playbook (`references/execute.md`) and the bulk-mutation pattern
  (Step 6) live there; this skill cites them. If those rules need to
  evolve, edit them in `resolve-pr-comments` and this skill picks up
  the change.
