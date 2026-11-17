---
name: exact-artifacts
version: 0.1.0
disable-model-invocation: true
description: "Output that a bound primitive governs matches it exactly: every literal present, every required slot filled, nothing added, dropped or reworded outside the slots."
---

# Rule: exact artifacts

**Rule.** Output that a bound primitive governs matches it exactly: every literal present, every required slot filled, nothing added, dropped or reworded outside the slots.

**Why.** Readers, parsers and habits break on drift: a reviewer scans for the same fields, a parser rejects a changed marker, a later run matches on a heading.

**Applies.** Every artifact named in the goal's "Conforms to". A format the user gives for this task outranks the primitive. Where a rule names a project source ahead of the primitive, that source wins. A repo override at `<repo>/.claude/charter-primitives/<name>/` replaces the charter primitive whole.

**Check.** One report row per bound primitive: the path or URL of the produced artifact, plus the primitive's own Check evidence (validator output, or a slot-by-slot comparison).

**If it blocks you.** If the content does not fit the slots, do not bend the format; record it per `record-dont-guess`. A parser-consumed artifact that fails its validator twice is removed, not handed on.
