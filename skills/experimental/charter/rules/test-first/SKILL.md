---
name: test-first
version: 0.1.0
disable-model-invocation: true
description: No production code without a test that was seen failing for the right reason first.
---

# Rule: test first

**Rule.** No production code without a test that was seen failing for the right reason first.

**Why.** A test written after the code proves only that the code does what it does. Watching it fail is the only evidence that the test can detect the behaviour's absence.

**Applies.** Any change to runtime behaviour. Exempt: docs, comments, formatting, pure renames, config with no testable behaviour, and code with no test harness in the project (record that as a decision instead).

**Check.** For each behaviour added or changed, you can name the test and show its failing output from before the implementation. "It fails because the function does not exist" counts; a syntax error in the test does not.

**If it blocks you.** If the behaviour cannot be tested with reasonable effort, do not write the code anyway. Treat it as `record-dont-guess`: record what is untestable and why, then stop on that part.
