# Single-pass review prompt

Fallback prompt used by `review-pr` when no sub-agents resolve. Two
trigger paths from `SKILL.md` Step 4:

1. **Plugin missing** — `agents:` omitted (default) and the
   `pr-review-toolkit` first-probe Task call fails with
   `unknown subagent_type`. Fall back to single-pass review against
   this prompt and emit the info line about installing the plugin.
2. **Forced single-pass** — `agents: []` in config. Skip the plugin
   probe entirely; go straight to this prompt.
3. **All entries unresolvable** — `agents:` is a non-empty list but
   every entry failed to resolve. Emit a warning, then run this
   prompt.

The prompt below is delivered as one Task call (or one inline LLM
turn — same content either way) and the result is normalised through
the same pipeline (`SKILL.md` Step 7 onward) as if a sub-agent
emitted it.

## Prompt template

````text
You are reviewing pull request <PR_NUMBER> for <REPO_NAME>.

# PR metadata
Title: <title>
Author: <author>
Base ref: <baseRefName>
Head ref: <headRefName>
Body:
<body or "(empty)">

# Focus hint
<comma-separated `focus:` values, or "(none)">

# Project guidelines
<full guidelines block — concatenated contents of every path under
 `guidelines:` in the config, joined by a blank line and a path
 header. If `guidelines:` is empty or missing, the line "(none)".>

# Diff
```diff
<unified diff from `gh pr diff <N>`>
````

# Your task

Review the diff for:

- correctness bugs (null/undefined, off-by-one, race conditions,
  unhandled error paths, type mismatches)
- adherence to the project guidelines above (if any)
- silent failures (catch blocks that swallow errors, ignored
  promises, missing error logging)
- test-coverage gaps for the new behaviour the diff introduces
- type design (over-broad types, missing invariants, leaked internal
  types)
- code simplification (dead branches, redundant abstractions,
  over-engineering)

Focus on the highest-confidence findings. Skip stylistic
nitpicks unless the project guidelines call them out explicitly.

# Output format

Return ONLY a JSON array of findings. Each finding must conform to
the canonical schema documented in
`review-pr/references/findings-schema.md`:

[
{
"file": "src/auth.ts",
"line": 42,
"severity": "critical | important | suggestion | nit",
"description": "<one-paragraph statement of the problem>",
"recommendation": "<concrete proposed fix or follow-up>",
"reported_by": ["single-pass"]
}
]

Severity guidance:

- "critical" — correctness bug, security issue, explicit guideline
  violation, blocker for merge.
- "important" — should-fix issue: typing, duplication, missing test
  coverage, UX regression.
- "suggestion" — polish or preference; author may decline with
  rationale.
- "nit" — micro-style; only emit if guidelines call it out.

If you find nothing actionable, return `[]`. Do not narrate. Do not
return findings outside the schema. Do not wrap the JSON in a code
fence.

```

## Notes

- `reported_by` is hard-coded to `["single-pass"]` — the orchestrator
  overrides this at normalisation time, but defaulting it makes
  manual smoke testing of the prompt simpler.
- Severity guidance mirrors the Code-Review-Comment Conventions in
  the plan's Context section so single-pass output is comparable to
  multi-agent output downstream.
- The single-pass model is the same `model:` declared in
  `SKILL.md` frontmatter (`sonnet`). No nested model selection — the
  fallback runs in-process, not as a Task call, so it inherits.
- Single-pass output goes through the same aggregation pipeline. With
  one source the dedup pass is a no-op, but threshold filtering, bot-
  skim, and emoji prefixing still apply.
```
