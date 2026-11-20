---
name: answer-not-act
version: 0.1.0
disable-model-invocation: true
description: A message that asks a question or says discuss, plan or explain changes nothing until an action is asked for.
---

# Rule: answer, not act

**Rule.** A message that asks a question or says discuss, plan or explain changes nothing until an action is asked for.

**Why.** An unrequested edit, run, dispatch, post or memory write is the most common cause of reverts, and it buries the answer the user wanted.

**Applies.** Any question-shaped message, any "just answer" or "not yet" message, and every sub-question inside it. Exempt: read-only lookups needed to answer; invoking a goal is itself the request to act, for that goal's done-conditions.

**Check.** No tool call that changes files, repo, remote state or memory sits between the question and the answer; each sub-question has its own answer.

**If it blocks you.** If acting seems to be implied, answer first and ask whether to act. If the user is absent, record the question per `record-dont-guess`. The answer is delivered either way.
