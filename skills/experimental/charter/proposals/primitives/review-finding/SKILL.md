---
name: review-finding
version: 0.1.0
disable-model-invocation: true
description: The normalised JSON shape of one review finding, with field rules, severity mapping, ordering and emoji prefixes.
---

# Primitive: review finding

**Primitive.** The normalised JSON shape of one review finding, with field rules, severity mapping, ordering and emoji prefixes.

**Consumer.** LLM: every review child that emits findings, and the agent that aggregates them. No parser (the doc itself says there is no runtime validator).

**Artifact.** See `artifact.md` beside this file: shape, field rules, severity mapping table, severity ordering, emoji prefix table (post time only) and the conformance paragraph. Core shape:

```json
{
  "file": "src/auth.ts",
  "line": 42,
  "severity": "critical | important | suggestion | nit",
  "description": "<one-paragraph statement of the problem>",
  "recommendation": "<concrete proposed fix or follow-up>",
  "reported_by": ["code-reviewer"],
  "resolution_status": "not-addressed"
}
```

Source: skills/review/review-pr/references/findings-schema.md:31-134, 150-159

**Slots.** Per field in `artifact.md`. `resolution_status` is optional and only present in re-review runs; `file` and `line` are both `null` for a PR-level finding.

**Check.** For a findings set: every finding has severity in the four-bucket enum, non-empty `description`, `recommendation` and `reported_by`, `file`/`line` both null or both set (repo-relative path, integer line ≥ 1). Unparseable agent output gets a one-line warning naming the agent and is skipped.

**Version.** 0.1.0. Changing a field name or enum value is a major bump. Producers: review children, `review-agent-brief`. Consumers: `review-aggregation`, `review-handover` (imports these fields), `rereview-briefs`.
