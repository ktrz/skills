---
name: comment-relevance
version: 0.1.0
disable-model-invocation: true
description: The rule that decides whether a PR comment is review signal or boilerplate, with its pattern lists and optional LLM-judge pass.
---

# Primitive: comment relevance

**Primitive.** The rule that decides whether a PR comment is review signal or boilerplate, with its pattern lists and optional LLM-judge pass.

**Consumer.** LLM: any agent filtering existing PR comments (overlap-skim, prior-findings set, investigation queue). No parser.

**Artifact.** See `artifact.md` beside this file: detection rule, skip list, implementation outline, the three pattern lists (`AUTO_GENERATED_PATTERNS`, `BOILERPLATE_PATTERNS`, `COVERAGE_PATTERN`), the ambiguity rule and the judge prompt.

Source: _shared/references/comment-relevance.md:39-146

**Slots.** The comment (body, `file`, `line`, author); the PR owner for the short-body check. Author identity is never a filter.

**Check.** List each comment with its verdict (relevant or skip) and the clause that decided it; judge calls are capped at ~20 per PR, over the cap default to relevant.

**Version.** 0.1.0. Adding a skip pattern is minor; changing the admit bar is major. Producers: none (read only). Consumers: `pr-reviewed`, `findings-investigated`, `rereview-briefs`.
