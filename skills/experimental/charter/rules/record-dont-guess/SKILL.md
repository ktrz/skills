---
name: record-dont-guess
version: 0.1.0
disable-model-invocation: true
description: When a requirement is ambiguous or a rule blocks progress, record the decision needed and stop the affected part; never guess silently.
---

# Rule: record, don't guess

**Rule.** When a requirement is ambiguous or a rule blocks progress, record the decision needed and stop the affected part; never guess silently.

**Why.** A silent guess looks identical to a requirement in the final diff. The reviewer cannot tell which behaviour was asked for and which was invented, so the cost of a wrong guess is paid late.

**Applies.** Two readings of a requirement that would produce different behaviour; a conflict between two rules; a rule that makes a done-condition unreachable; any waiver of a rule. Exempt: choices with no observable effect (naming, internal structure), which are yours.

**Check.** The decision log (`plans.local/<repo>/<ticket, PR number, or short slug>-decisions.md`) has an entry for each such moment: the question, the options, the choice, and who made it (user, or you with the reason it was safe to proceed).

**If it blocks you.** Ask the user if they are present. If they are not, stop only the affected part, continue everything that does not depend on the answer, and put the open decision at the top of the report. Proceeding on an assumption is allowed only when it is cheap to reverse, and then the entry says so.
