---
name: read-before-claim
version: 0.1.0
disable-model-invocation: true
description: No statement about how code, the environment, a PR or a ticket behaves or stands is made without reading or running the source in this session.
---

# Rule: read before claim

**Rule.** No statement about how code, the environment, a PR or a ticket behaves or stands is made without reading or running the source in this session.

**Why.** An answer from memory can be invented, and a wrong claim stated as fact costs more than the lookup would have.

**Applies.** Claims of behaviour, cause, status, and "it is done", across every PR and thread in scope, including comments that arrived since you last looked. Exempt: stated opinions and hypotheses labelled as such.

**Check.** Each claim names what was read or run: file and line, command and output, or URL.

**If it blocks you.** If the source cannot be read or run, say so and label the statement a hypothesis.
