---
name: delegate-by-tier
version: 0.1.0
disable-model-invocation: true
description: Each child runs on the model and effort the delegation table assigns to its kind of work; work above a tier is escalated, not ground through.
---

# Rule: delegate by tier

**Rule.** Each child runs on the model and effort the delegation table assigns to its kind of work; work above a tier is escalated, not ground through.

**Why.** Cheap work on a top model wastes cost; hard work on a cheap model returns poor answers. A child that grinds past its tier burns tokens on work it cannot do well.

**Applies.** Every Agent call, set as `model` plus effort in the brief. Work above a child's tier comes back to the parent, which re-dispatches it upward. Exempt: none.

| Model  | Best for             | Effort                                        |
| ------ | -------------------- | --------------------------------------------- |
| haiku  | bulk mechanical      | low                                           |
| sonnet | scoped research      | medium                                        |
| opus   | multi-step reasoning | xhigh                                         |
| fable  | judgment, taste      | medium; xhigh only for hardest calls, no high |

**Check.** List each child with its model, effort and kind of work, and show each matches a table row.

**If it blocks you.** Escalate the one hard call to the next tier up as a single child; do not run it on the lower tier.
