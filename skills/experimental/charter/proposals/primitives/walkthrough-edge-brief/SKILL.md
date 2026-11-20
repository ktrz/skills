---
name: walkthrough-edge-brief
version: 0.1.0
disable-model-invocation: true
description: The single brief given to the edge-verification subagent of a PR walkthrough, and the line grammar its report must follow.
---

# Primitive: walkthrough edge brief

**Primitive.** The single brief given to the edge-verification subagent of a PR walkthrough, and the line grammar its report must follow.

**Consumer.** LLM: one verification subagent. Its report is then read positionally by the synthesizing session, which copies edges and status tokens into the `depmap` diagram; the grammar must hold exactly. No parser.

**Artifact.** See `artifact.md` beside this file: the brief template, the Section A line grammar `<source file> -> <target>: <what> [runtime | type-only] [added|removed|changed|unchanged]`, its rules and worked examples. Source: skills/review/narrate-pr/references/edge-verification-brief.md:1-159

**Slots.**

| Slot | Filled with | Required |
| ---- | ----------- | -------- |
| `{component inventory}` | component-inventory sections from every scope report, neutralised of fence tags, inside the `<external_data source="research">` fence | yes |
| `{base sha}` | the same pinned merge-base commit the research briefs carried | yes |
| `{runtime environments relevant to the repo}` | the runtime distinctions that matter here, e.g. `browser` / `server` / `worker` | yes |

**Check.** Show the brief with the three slots filled and the text outside them matching `artifact.md`. Show that every Section A line of the returned report matches the grammar, with one line per pair and exact bracket spellings. The report is saved verbatim as the edge report.

**Version.** 0.1.0. Changing the line grammar or a bracket spelling is a major bump. Producer: goal `pr-walkthrough`. Consumer: the synthesizing session (via `walkthrough-json` derivation of edges).
