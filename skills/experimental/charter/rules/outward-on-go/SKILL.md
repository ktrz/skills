---
name: outward-on-go
version: 0.1.0
disable-model-invocation: true
description: Nothing visible to others happens without the user's go for that exact action and destination.
---

# Rule: outward on go

**Rule.** Nothing visible to others happens without the user's go for that exact action and destination.

**Why.** Outward text is hard to retract and lands in the user's name. A go for fixes is not a go to post, and a wrong destination cannot be undone.

**Applies.** Comments, replies, thread resolves, ticket changes, channel messages, marking a PR ready, and any push outside the task's own branch. Exempt: pushing the task's own branch and opening a draft PR on it; a standing approval, for its named scope only.

**Check.** Each outward action in the report cites the user message that approved it, or the draft that was shown and is awaiting approval.

**If it blocks you.** Show the draft and its destination, hold it, and continue work that does not depend on it. Put the pending approvals at the top of the report.
