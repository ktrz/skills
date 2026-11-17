---
name: review-reply
version: 0.1.0
disable-model-invocation: true
description: The reply posted on a review thread, or on an earlier comment, once the finding it answers has an outcome; also the PR comment answering review-body items and the per-PR round summary.
---

# Primitive: review reply

**Primitive.** The reply posted on a review thread, or on an earlier comment, once the finding it answers has an outcome; also the PR comment answering review-body items and the per-PR round summary.

**Consumer.** Human: the reviewer reading the thread or the PR conversation on GitHub.

**Artifact.** See `artifact.md` beside this file: the two thread-reply variants, the reply text per outcome, the `+1` reply, the review-body comment and the round summary. The prefix table, joiner, `+1` line, `Fixed in <commit>` and the examples are copied from the old skills (`skills/review/execute-review-decisions/SKILL.md:186-245, 316-328`; `skills/review/resolve-pr-comments/SKILL.md:227-249, 267`). The declined and deferred texts, the review-body comment and the round summary are not in the sources; they were written for the charter. Core forms:

```text
<prefix> — <reply text>
<reply text>
```

The first is the "from a handover item" variant, the second the "no handover" variant.

**Variant by goal.** From a handover item: `review-decisions-applied`. No handover: `review-comments-resolved`, `address-review`, `stack-to-approved`. The variant follows where the item came from, never the agent's taste.

**Slots.**

| Slot             | Filled with                                                                                 | Required                                   | When empty                                         |
| ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| `<prefix>`       | the severity row in `artifact.md`, from the severity persisted in the handover item          | handover variant only                      | unknown severity: `⚠️ Important` and log a warning |
| `<reply text>`   | the outcome row in `artifact.md`; short and factual (source: "State what was changed, not why the reviewer was right") | yes          | never empty                                        |
| `<commit>`       | short SHA of a commit already pushed to the branch that owns the lines                      | `+1` reply; fix replies in `address-review` and `stack-to-approved` | elsewhere: omit ` Fixed in <commit>.` |
| `<ticket URL>`   | the ticket the finding was deferred to                                                      | deferred outcome                           | never empty                                        |
| `<review URL>`, `<thread URL>`, `<head commit>` | the review or thread answered; the PR's head SHA when the summary is posted | review-body comment, round summary | never empty                              |

**Check.** For each reply or comment posted: its URL, the variant used and the goal that chose it, the prefix (handover variant), and every required slot filled. Review-body items are not threads: they get the review-body comment, never a thread reply.

**Version.** 0.1.0. Changing the prefix literals, the ` — ` joiner or an outcome literal is a major bump. Producers: goals `review-decisions-applied`, `review-comments-resolved`, `address-review`, `stack-to-approved`. Consumer: the reviewer.
