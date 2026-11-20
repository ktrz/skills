---
name: parent-only-judges
version: 0.1.0
disable-model-invocation: true
description: While orchestrating, the parent only decomposes, briefs, judges and synthesizes; it never searches, reads, writes, runs or drafts.
---

# Rule: parent only judges

**Rule.** While orchestrating, the parent only decomposes, briefs, judges and synthesizes; it never searches, reads, writes, runs or drafts.

**Why.** The parent's context is the scarce resource that holds the thread. Every file it reads or command it runs spends that context on work a child can do and report in a few lines.

**Applies.** Goal `orchestrate`, from restating the task to the final synthesis. Searching, reading files, writing code, running commands and drafting text all go to a child. Exempt: reading the goal files in play (`orchestrate`, and a goal named with `using`) and the rules and primitives they bind.

**Check.** The parent's own tool calls in the session are Agent calls, plus reads of the exempt files, and the final answer. Show the list of tool calls.

**If it blocks you.** If a step cannot be handed over as written, split it into smaller steps that can; do not do it yourself.
