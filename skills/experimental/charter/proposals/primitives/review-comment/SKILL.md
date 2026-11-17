---
name: review-comment
version: 0.1.0
disable-model-invocation: true
description: The text of a review comment that posts one finding, inline at its line or PR-level, and the shape of one review carrying several.
---

# Primitive: review comment

**Primitive.** The text of a review comment that posts one finding, inline at its line or PR-level, and the shape of one review carrying several.

**Consumer.** Human: the PR author and reviewers reading the review on GitHub. A later overlap-skim or re-review matches these comments by `(file, line)` and point (primitives `review-aggregation`, `rereview-briefs`).

**Artifact.** Not in the sources: the old skill names the severity prefix and the posting calls but fixes no body (`skills/review/review-pr/SKILL.md:431-438, 453-459`). The literal below was written for the charter to match the `<prefix> — <text>` form of `review-reply`, and awaits the user's confirmation.

Finding comment: the body of one inline review comment at the finding's `file:line`, or, for a PR-level finding (`file` and `line` both null), the body of one comment-type review with no inline comments.

```text
<prefix> — <description>

<recommendation>
```

One review carrying several findings (deep mode of `pr-reviewed`; `review-others-pr`): a single comment-type review whose inline comments are one finding comment each at its `file:line`. Its body holds the PR-level finding comments in output order, joined by a line `---` with a blank line on each side, and is empty when there are none.

**Slots.**

| Slot               | Filled with                                                        | Required | When empty                                         |
| ------------------ | ------------------------------------------------------------------ | -------- | -------------------------------------------------- |
| `<prefix>`         | the emoji-prefix row of `review-finding` for the finding's severity | yes      | unknown severity: `⚠️ Important` and log a warning |
| `<description>`    | the finding's `description`, verbatim                              | yes      | never empty                                        |
| `<recommendation>` | the finding's `recommendation`, verbatim                           | yes      | never empty                                        |

A deep-mode `(e)` edit replaces `<description>` and `<recommendation>` with the user's text; `<prefix> — ` stays.

**Check.** For each posted comment: its URL, its `file:line` or "PR-level", the prefix against the finding's severity, and the body compared slot by slot. For one review carrying several: the review URL, and its inline comment count equal to the inline findings posted.

**Version.** 0.1.0. Changing a prefix literal, the ` — ` joiner, the blank line before `<recommendation>` or the `---` joiner is a major bump. Producers: goals `pr-reviewed` (default and deep mode), `review-others-pr`. Consumer: the PR's readers.
