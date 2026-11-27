---
name: green-before-done
version: 0.1.0
disable-model-invocation: true
description: Nothing is reported done while any check fails that was not already failing before the change.
---

# Rule: green before done

**Rule.** Nothing is reported done while any check fails that was not already failing before the change.

**Why.** A regression the author did not notice becomes the reviewer's or the next person's problem. "Done" must mean the existing safety net still holds.

**Applies.** Every change. Checks include tests, type checks, lint, build, and CI. Exempt: checks already failing before your change, which you must show were failing and list in the report.

**Check.** You can show the full check suite's output on the final commit, with the command and its last lines. Any failing check is shown to have failed before your change as well.

**If it blocks you.** If a check fails and you cannot fix it within the goal's scope, do not report done. Report "not met, blocked by this check" with the output.
