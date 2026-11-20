---
name: stack-commands-only
version: 0.1.0
disable-model-invocation: true
description: A branch that belongs to a stack is rebased, pushed and submitted only through the stack tool, never by bare push, hand-rolled rebase or force-push.
---

# Rule: stack commands only

**Rule.** A branch that belongs to a stack is rebased, pushed and submitted only through the stack tool, never by bare push, hand-rolled rebase or force-push.

**Why.** Bypassing the tool desynchronises stack metadata and PR bases, and the damage surfaces later in review.

**Applies.** Any branch registered in a stack. The stack tool is the one the stack was created with (the toolchain map names it where a map exists); if it cannot be identified, treat as `record-dont-guess`. Exempt: none.

**Check.** The report lists each rebase, push and submit of a stack branch with its stack-tool command, and the stack tool's status shows no PR needing a rebase.

**If it blocks you.** If the stack tool fails, stop, report the stack's state and the error, and do not improvise with plain git.
