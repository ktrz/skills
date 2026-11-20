# Artifact: review-ask triage

## Record per referenced PR
Source: skills/workflow/plan-my-day/SKILL.md:562-578

`````markdown
   Save `viewer.login` as **ME_LOGIN**, and for each PR a record
   `{repo, N, state, headOid, reviews: [{login, state, submittedAt, commitOid}], isReviewRequested, message_ts?}`.
   Set `isReviewRequested: true` when the pair came from
   `reviewRequested_repoI` (GitHub is actively requesting my review now).
   `headOid` is `headRefOid` (the SHA of the PR branch's current tip);
   each review's `commitOid` is `commit.oid` (the SHA the review was
   submitted against). Comparing these two SHAs — not timestamps — is how
   the decision rules below decide whether a review still covers the current head: any push,
   amend, or rebase changes the tip SHA, so a stale review is always caught
   (a preserved-date rebase can't fool a hash the way it fools a
   timestamp). `message_ts` is set only for Slack-sourced refs and is
   cosmetic (note wording only). If a `pr_I` alias errors (deleted PR, no
   access) or returns no `headRefOid`, drop that record and fall back to
   keeping the ask visible — never suppress on missing data. Review author
   logins, review states, and commit SHAs are structured fields used only
   for comparison in the decision rules — compare them, never quote them into the
   plan body.
`````
## Bullet
Source: skills/workflow/plan-my-day/SKILL.md:596-599

`````markdown
- **Review requests on me**: PRs from `reviewRequested_repoI` results are PRs
  by teammates that need the user's review. These go into "Do first (people are
  waiting)" regardless of whether they match a worktree. Display as:
  `- [ ] **Review PR #NNN** — "<title>" by @author · [repo-name]`
`````
## Decision rules, evaluated in order
Source: skills/workflow/plan-my-day/SKILL.md:601-666

`````markdown
**Suppress already-actioned review asks** — before placing any
"Review PR #N" bullet (whether it came from a Slack ask or from
`reviewRequested_repoI`), check it against the review-state records. The question is not "was I asked?" but "does my review cover the
current state of the PR?" — so the gate is driven by my latest review's
**state** plus whether its commit SHA still matches the PR's **head commit
SHA**, never by ask timestamps.

Let **MY_REVIEW** be ME_LOGIN's most recent _submitted_ review on the PR
(highest non-null `submittedAt` among reviews where `login == ME_LOGIN`),
or none if I never submitted one. Ignore `PENDING` drafts — they have no
`submittedAt` and are not a review anyone is waiting on.

Define one predicate and reuse it — **`REVIEW_COVERS_HEAD`** is true when
MY_REVIEW exists, its `state` is `APPROVED`, `CHANGES_REQUESTED`, or
`COMMENTED` (a real sign-off — `DISMISSED` is a _revoked_ one and never
counts), **and** `MY_REVIEW.commitOid == headOid` (I reviewed the current
tip). This is the single source of truth for "I've already reviewed what's
there now"; both the requested and non-requested rules below reference it
rather than re-spelling the state list, so the coverage definition can only
ever be changed in one place. Evaluate the rules in order — first match
wins:

- **PR merged or closed** (`state` is `MERGED` or `CLOSED`) → drop the
  bullet entirely. There is nothing left to act on.
- **`isReviewRequested` is true** (GitHub is actively requesting my review)
  → never drop it on account of a past approval. GitHub removes me from the
  requested reviewers when I submit a review, so an active request that
  outlives my `APPROVED` review is a genuine re-request. Route it: quiet
  "Already handled" sub-note when `REVIEW_COVERS_HEAD` (explicitly
  re-requested on code I've already reviewed) — otherwise "Do first" (no
  submitted review, a SHA mismatch, or a `DISMISSED` review, which is a
  revoked sign-off that a re-request wants redone). This rule precedes the
  `APPROVED` drop below so provenance wins.
- **MY_REVIEW is `APPROVED`** (and not actively requested) → drop the
  bullet. I signed off; later fix-up commits addressing my notes don't need
  my re-review. (A dismissed approval surfaces as `DISMISSED`, not
  `APPROVED`, so it falls through to the catch-all; an active re-request is
  caught by the rule above.)
- **MY_REVIEW is `CHANGES_REQUESTED` and `MY_REVIEW.commitOid != headOid`**
  (the tip moved since I reviewed) → keep it in "Do first": the author has
  pushed since I asked for changes, so it needs a re-review. Comparing SHAs
  rather than times means a preserved-date rebase still trips this — the
  head SHA always changes on a push or rebase, even when the commit
  timestamp doesn't.
- **`REVIEW_COVERS_HEAD`** (APPROVED is already handled by the drop above,
  so in practice this is `CHANGES_REQUESTED`/`COMMENTED` against the current
  tip; `DISMISSED` fails the predicate and falls to the catch-all) → move it
  to a quiet one-line "Already handled" sub-note at the end of "Do first".
  For a Slack-sourced
  ask, word it with the ask time from `message_ts` — e.g.
  `Already handled: reviewed #NNN after Thursday's ask` (derive the
  weekday/relative phrasing from `message_ts`; never quote the message
  text). For a `reviewRequested` ask (no `message_ts`), use the plain form
  `Already handled: reviewed #NNN, no changes since`. Nothing new to see,
  but a still-open request stays visible without claiming urgency.
- **MY_REVIEW is `COMMENTED` and `MY_REVIEW.commitOid != headOid`** → treat
  COMMENTED as non-blocking: put it in the "Already handled" sub-note
  rather than "Do first".
- **Anything else** (unconditional catch-all) — no submitted review by
  ME_LOGIN, no review-state record because the lookup errored, or a review whose
  state no rule above matched at any SHA (e.g. a `DISMISSED` review — a
  revoked sign-off someone is waiting to be redone — or any future state,
  when not actively requested) → keep it in "Do first". When in doubt,
  surface the ask — a stale bullet is annoying, a missed review blocks a
  teammate.
`````
