# Findings schema

Canonical shape for a single review finding. This file is the single
source of truth — `review-pr/SKILL.md`, `review-pr/references/agents.md`,
`review-pr/references/aggregation.md`, the auto-mode file output, and the
Phase 2 handover format (`investigate-pr-comments/references/handover-format.md`)
all import from here.

## Shape

Every finding produced by a sub-agent (or the single-pass fallback) must
be normalised into this exact shape before aggregation:

```json
{
  "file": "src/auth.ts",
  "line": 42,
  "severity": "critical | important | suggestion | nit",
  "description": "<one-paragraph statement of the problem>",
  "recommendation": "<concrete proposed fix or follow-up>",
  "reported_by": ["code-reviewer"]
}
```

## Field rules

- **`file`** — repo-relative path, forward slashes, no leading `./`. For
  cross-cutting findings without a single anchor (e.g. naming
  consistency across files), use the most representative file.
- **`line`** — integer line number in the head ref (the diff's "+"
  side). For findings that span a range, use the first line. For
  PR-level findings with no inline anchor (review-body equivalent),
  set `line: null` and `file: null`.
- **`severity`** — exactly one of `critical`, `important`,
  `suggestion`, `nit`. See the severity table below for mapping rules
  when an agent emits its own scoring.
- **`description`** — natural language. One paragraph; no leading
  emoji (emoji prefixing happens at post time per the
  Code-Review-Comment Conventions in the plan's Context section).
- **`recommendation`** — actionable; tells the reader what to change.
  May reference a code snippet or a commit-style suggestion.
- **`reported_by`** — list of agent names (or `single-pass` for the
  fallback). After dedup, this array unions all contributing agents.

## Severity mapping

Some sub-agents emit their own confidence or severity scoring. Map to
our four buckets before aggregation:

| Source signal                                    | Bucket       |
| ------------------------------------------------ | ------------ |
| explicit `critical`                              | `critical`   |
| explicit `important` / `should fix`              | `important`  |
| explicit `suggestion`                            | `suggestion` |
| explicit `nit`                                   | `nit`        |
| confidence score 91–100 (e.g. pr-review-toolkit) | `critical`   |
| confidence score 76–90                           | `important`  |
| confidence score 51–75                           | `suggestion` |
| confidence score < 51                            | drop         |
| 1–10 scale: 9–10                                 | `critical`   |
| 1–10 scale: 7–8                                  | `important`  |
| 1–10 scale: 4–6                                  | `suggestion` |
| 1–10 scale: < 4                                  | drop         |

If an agent's output cannot be parsed into this shape (missing fields,
unknown severity, malformed JSON), log a one-line warning naming the
agent and skip those findings — never crash the run.

## Severity ordering

For threshold filtering and "highest severity first" ordering:

```
critical > important > suggestion == nit
```

`nit` and `suggestion` are interchangeable for ordering purposes; both
render with the 💡 Suggestion emoji per the Code-Review-Comment
Conventions in the plan's Context section.

## Emoji prefixing (post-time only)

The `severity` field is stored verbatim; emoji prefixing is applied at
post / write time, not when the finding is created. The mapping is:

| Severity     | Emoji prefix  |
| ------------ | ------------- |
| `critical`   | 🚨 Critical   |
| `important`  | ⚠️ Important  |
| `suggestion` | 💡 Suggestion |
| `nit`        | 💡 Suggestion |

If an agent emits a severity outside the four buckets above, default
the prefix to ⚠️ Important and log a warning.

## Auto-mode file format

When `review-pr` runs in auto mode (pipeline OR standalone), it writes
findings to `<output_dir>/pr-<N>-auto-review.md` as `[?]` items. Each
finding becomes one section that conforms to the Phase 2 handover
schema (see `investigate-pr-comments/references/handover-format.md`).
The format is byte-identical to what `investigate-pr-comments` writes
so a downstream merge does not need to re-parse.

Minimum keys persisted per item: `file`, `line`, `severity`,
`description`, `recommendation`, `reported_by`. Severity is persisted
verbatim — emoji prefixing happens at post time, not file-write time,
so the document remains a clean structured input for downstream tools.
