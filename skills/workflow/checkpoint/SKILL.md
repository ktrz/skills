---
name: checkpoint
version: 1.0.0
model: sonnet
description: At a session length/cost checkpoint, assess the current session and recommend whether to compact (shrink context, stay) or hand off (end here, resume fresh), with a ready-to-paste prompt for each.
argument-hint: "compact | handoff | (blank to assess + recommend)"
---

The user crossed a turn-count checkpoint (statusline ⟳ tier / the checkpoint-nudge notification). Help them decide between shrinking context to keep going, or stopping for a fresh session.

If the argument is `compact` or `handoff`, skip the assessment and produce just that one prompt (the relevant section below). Otherwise **assess and recommend**:

## assess + recommend (default)

1. Read the current session: the goal, what's done + verified, what's still open, and — decisively — whether you're **mid-task or at a natural break**, and whether the work so far is **durably saved** (committed, written to a file, posted) or only lives in this conversation.

2. **Recommend one** with a single-line reason:
   - **compact** when work is unfinished / mid-thread and the live context (recent decisions, in-flight state) is still load-bearing for the next steps.
   - **handoff** when you're at a clean break, the work is durably saved, and a fresh agent could resume from a doc without the conversation history.

3. Output **both** prompts so the user can override, with the recommended one marked `← recommended`. Keep each tight; reference artifacts (files, PRs, plans, tickets) by path/URL, never restate their contents.

Then stop and let the user choose — do not auto-run either.

## compact prompt

Claude cannot run `/compact` itself (user command). Produce the instruction the user pastes after it: goal + current state (done/verified) + immediate next steps. One copyable code block beginning with `/compact `, nothing else in the block.

## handoff prompt

Either the `/handoff <focus>` line for the user to run, or — if they confirm — invoke the `handoff` skill directly to write the doc and report the saved path. Tailor `<focus>` to what the next session is for.
