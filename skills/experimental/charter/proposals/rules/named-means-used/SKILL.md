---
name: named-means-used
version: 0.1.0
disable-model-invocation: true
description: When the user names a tool, skill, source, location or output format, exactly that is used; any substitution is asked for first.
---

# Rule: named means used

**Rule.** When the user names a tool, skill, source, location or output format, exactly that is used; any substitution is asked for first.

**Why.** A silent substitution is the sharpest kind of ignored instruction, and the user cannot see it in the result.

**Applies.** Anything named in the request or the plan. Exempt: none.

**Check.** List each named item from the request and show where each was used.

**If it blocks you.** If the named thing is unavailable, treat it as `record-dont-guess`: record the substitution you would need, and stop the affected part until the user agrees.
