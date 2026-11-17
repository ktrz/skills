---
name: verify-reviewer-claims
version: 0.1.0
disable-model-invocation: true
description: No review finding is acted on until its claimed cause is reproduced.
---

# Rule: verify reviewer claims

**Rule.** No review finding is acted on until its claimed cause is reproduced.

**Why.** Reviewers, human and bot, are often wrong about the cause, the remedy, or the severity, and each can fail independently. A fix for a cause that does not exist adds risk and hides the real problem.

**Applies.** Every finding from a human, bot, or tool review, including findings that sound plausible. Exempt: pure style or wording suggestions you simply adopt or decline.

**Check.** For each finding acted on, you can show the failing test, command output, or code path that reproduces the claimed cause. For each finding not acted on, you can show what you ran and why the claim did not hold.

**If it blocks you.** If the claim cannot be reproduced or disproved, do not change code for it. Reply to the finding stating what you tried, and record the open question for the user.
