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
  "reported_by": ["code-reviewer"],
  "resolution_status": "not-addressed"
}
```

`resolution_status` is optional and appears only in `--re-review` runs —
see the field rules below.

## Field rules

- **`file`** — repo-relative path, forward slashes, no leading `./`, no
  absolute path, and no `..` segment that would escape the repo root. For
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
- **`resolution_status`** — optional; exactly one of `addressed`,
  `partial`, `not-addressed`, `cant-tell`. Only set in `--re-review`
  runs, and only on a finding that matches a **prior item** (same
  `(file, line)` plus substantively overlapping point — the identity
  rule in primitive `rereview-briefs`). A specialist that re-includes a
  still-open prior finding sets `"not-addressed"` so output rendering
  can mark it "previously raised, still open" instead of presenting it
  as a fresh discovery. The resolution-verifier agent reuses this same
  enum as its per-comment `verdict` (see primitive `rereview-briefs` → "Verifier
  output handling"); verifier entries are not findings and bypass
  aggregation. Absent everywhere outside `--re-review`; downstream
  consumers must treat a missing field as "not applicable", not as
  `not-addressed`.

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

## Conformance

A conforming findings file (a single finding object or a JSON array of
findings) satisfies the shape and field rules above: `severity` in the
four-bucket enum; non-empty `description` and `recommendation`; a non-empty
`reported_by` array of non-empty strings; `file`/`line` either both `null`
(PR-level finding) or both set, with `file` repo-relative (no leading `./`, no
absolute path, no `..` escape segment, forward slashes) and `line` an integer
≥ 1; and `resolution_status`, when present, in
`addressed|partial|not-addressed|cant-tell`.
