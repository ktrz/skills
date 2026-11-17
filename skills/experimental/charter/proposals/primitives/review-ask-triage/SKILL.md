---
name: review-ask-triage
version: 0.1.0
disable-model-invocation: true
description: The ordered decision table that keeps, demotes or drops a review-ask bullet by comparing the user's latest review with the PR's current head.
---

# Primitive: review-ask triage

**Primitive.** The ordered decision table that keeps, demotes or drops a review-ask bullet by comparing the user's latest review with the PR's current head.

**Consumer.** LLM: the agent building the plan, which applies the table. Human: the user, who sees the resulting bullet or "Already handled" note.

**Artifact.** See `artifact.md` beside this file: the review-state record, the bullet form and the ordered rules including the `REVIEW_COVERS_HEAD` predicate. Source: skills/workflow/plan-my-day/SKILL.md:562-578, 596-599, 601-666

**Slots.**

| Slot | Filled with | Required |
| --- | --- | --- |
| `ME_LOGIN` | `viewer.login` from the review-state query | yes |
| `MY_REVIEW` | the user's latest submitted review (highest non-null `submittedAt`) or none | yes |
| `headOid`, `commitOid` | `headRefOid` and the review's `commit.oid`; compared, never quoted | yes |
| `isReviewRequested` | true when the PR came from the review-requested search | yes |

**Check.** One row per review ask: the rule number that fired, the three inputs (state, commit SHA equality, requested flag) and the resulting bullet, note or drop. A missing record keeps the ask visible.

**Version.** 0.1.0. Reordering or changing a rule is a major bump. Producer and consumer: goal `daily-plan`.
