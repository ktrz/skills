# Findings schema

> **Contract doc.** This is the owned format specification for a review
> finding — the normalised shape every sub-agent (and the single-pass
> fallback) must produce before aggregation. Treat the shape and field rules
> below as the stable interface: `review-pr` prose may change, but a findings
> file that conforms here must keep validating.

|               |                                                                   |
| ------------- | ----------------------------------------------------------------- |
| **Owner**     | `skills/review/review-pr`                                         |
| **Consumers** | `review-pr` aggregation; the handover format imports these fields |
| **Validator** | `skills/review/review-pr/validate-findings.mjs` (zero-dep node)   |
| **Status**    | contract                                                          |

Canonical shape for a single review finding. This file is the single
source of truth — `skills/review/review-pr/SKILL.md`, `skills/review/review-pr/references/agents.md`,
`skills/review/review-pr/references/aggregation.md`, the auto-mode file output, and the
Phase 2 handover format (`skills/review/investigate-pr-comments/references/handover-format.md`)
all import from here.

## Contents

- [Shape](#shape)
- [Field rules](#field-rules)
- [Severity mapping](#severity-mapping)
- [Severity ordering](#severity-ordering)
- [Emoji prefixing (post-time only)](#emoji-prefixing-post-time-only)
- [Auto-mode file format](#auto-mode-file-format)
- [Validator usage](#validator-usage)

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
- **`resolution_status`** — optional; exactly one of `addressed`,
  `partial`, `not-addressed`, `cant-tell`. Only set in `--re-review`
  runs, and only on a finding that matches a **prior item** (same
  `(file, line)` plus substantively overlapping point — the identity
  rule in `rereview-agent.md`). A specialist that re-includes a
  still-open prior finding sets `"not-addressed"` so output rendering
  can mark it "previously raised, still open" instead of presenting it
  as a fresh discovery. The resolution-verifier agent reuses this same
  enum as its per-comment `verdict` (see `rereview-agent.md` → "Verifier
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

## Auto-mode file format

When `review-pr` runs in auto mode (pipeline OR standalone), it writes
findings to `<output_dir>/pr-<N>-auto-review.md` as `[?]` items. Each
finding becomes one section that conforms to the Phase 2 handover
schema (see `skills/review/investigate-pr-comments/references/handover-format.md`).
The format is byte-identical to what `investigate-pr-comments` writes
so a downstream merge does not need to re-parse.

Minimum keys persisted per item: `file`, `line`, `severity`,
`description`, `recommendation`, `reported_by`. Severity is persisted
verbatim — emoji prefixing happens at post time, not file-write time,
so the document remains a clean structured input for downstream tools.

## Validator usage

`validate-findings.mjs` gates a findings file (a single finding object or a
JSON array of findings) against the shape and field rules above:

```bash
node skills/review/review-pr/validate-findings.mjs <path-to-findings.json>
```

- Exit `0` — every finding conforms. Prints `OK: …`.
- Exit `1` — prints one `path: message` line per violation, then a count.
- Exit `2` — usage error or the file could not be read.

It enforces: `severity` in the four-bucket enum; non-empty `description` and
`recommendation`; a non-empty `reported_by` array of non-empty strings;
`file`/`line` either both `null` (PR-level finding) or both set, with `file`
repo-relative (no leading `./`, no absolute path, forward slashes) and `line`
an integer ≥ 1; and `resolution_status`, when present, in
`addressed|partial|not-addressed|cant-tell`. Fixtures live in
`skills/review/review-pr/fixtures/`; the suite is
`tests/review-pr/validate-findings.test.mjs` (`node --test`).

The validator is co-located with `review-pr` and not distributed to other
skills: `review-pr` is the sole producer of findings JSON, so nothing else
needs to run it on an installed copy (see `_shared/README.md` →
"Distributed categories").
