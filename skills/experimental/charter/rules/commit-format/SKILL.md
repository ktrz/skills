---
name: commit-format
version: 0.1.0
disable-model-invocation: true
description: Every commit follows the project's commit message format and is one logical unit.
---

# Rule: commit format

**Rule.** Every commit follows the project's commit message format and is one logical unit.

**Why.** History is read long after the session ends. A consistent format keeps tooling and changelogs working, and one-unit commits can be reviewed, reverted, or bisected on their own.

**Applies.** Every commit you create. The format is whatever the project defines (contributing guide, commit-lint config, git hooks, or recent history); this rule does not supply one. Exempt: none.

**Check.** Name the source that defines the project's format and show that each commit message matches it (hook or lint passing, or a comparison with recent commits). Each commit's diff serves one stated purpose.

**If it blocks you.** If no project format can be found, do not invent one: record it as a `record-dont-guess` event and match the style of recent commits meanwhile. If the sources disagree, do not pick silently: record it and follow recent history meanwhile. If a commit hook rejects a message, fix the message; never bypass the hook.
