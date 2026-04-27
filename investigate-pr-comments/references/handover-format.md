# Handover document format

Canonical schema for `pr-NNN-review-decisions.md`. This file is the single
source of truth for the handover document format. `review-pr` (auto-mode
file output), `investigate-pr-comments` (writer), and
`execute-review-decisions` (reader) all conform to it.

## Document header

```markdown
# PR <N> Review Decisions

**PR:** <url>
**Branch:** <headRefName> → <baseRefName>
**Generated:** <ISO-8601 timestamp>
**Status:** PENDING REVIEW

## Source counts

- Auto-review findings: <N>
- Human reviewer comments: <N>
- Total items: <N> (<N> critical, <N> important, <N> suggestion/nit)
```

## Item schema

Each review item occupies one `##`-level section. The section heading
encodes the current status marker and a short label.

```markdown
## [?] <source_tag> — <file>:<line>

**Severity:** critical | important | suggestion | nit
**Source:** auto-review | reviewer: @<login>
**Reported by:** <agent-name(s) or reviewer login>
**Comment:** <original comment or finding description verbatim>
**Analysis:** <what the code does today and why this finding matters — 1-3 sentences>
**Recommendation:** <recommended option — concrete enough to act on at a glance>
**Options:**

- (a) <recommended fix> ← suggested
- (b) <alternative approach>
- (c) Reply: <draft reply if no code change is needed>

**Resolution:** <!-- write "fix (a)", "fix (b)", custom instruction,
"reply: <text>", or leave blank and mark [d] to
discuss interactively via /resolve-pr-comments --from-doc -->
```

For review-body items with no inline anchor, use `"review body"` in the
heading instead of `<file>:<line>`:

```markdown
## [?] <source_tag> — review body
```

For auto-review findings where the finding spans multiple lines or is
cross-cutting, use the first/most representative line.

### Source tag format

- Auto-review: `auto:<severity>` — e.g. `auto:critical`, `auto:suggestion`
- Human reviewer: `reviewer:@<login>` — e.g. `reviewer:@alice`

When both auto-review and a human reviewer flag the same location, keep
both as separate items. Add an annotation on the auto-review entry:

```markdown
**Note:** also flagged by @<login> (see next item)
```

This preserves both framings for the user to choose from during triage.

## Status markers

Status markers appear at the start of each `##` heading:

| Marker | Meaning                                                                         |
| ------ | ------------------------------------------------------------------------------- |
| `[?]`  | Pending — user has not decided yet                                              |
| `[x]`  | Approved — implement option (a) as written                                      |
| `[~]`  | Approved with edits — implement exactly what the Resolution note says           |
| `[d]`  | Discuss — flag for interactive resolution via `/resolve-pr-comments --from-doc` |
| `[-]`  | Skip — no action needed; will not be posted or implemented                      |

`execute-review-decisions` reads only `[x]` and `[~]` items. It leaves
`[d]`, `[-]`, and `[?]` items untouched. `/resolve-pr-comments --from-doc`
reads only `[d]` items and writes resolutions back into the document.

## Item ordering

Items appear in this order within the document:

1. Critical auto-review findings
2. Important auto-review findings
3. Human reviewer comments (in fetch order from GitHub)
4. Suggestion/nit auto-review findings

Within each group, order is stable (fetch order for human comments;
severity-desc then file:line-asc for auto findings — matching the
`review-pr` aggregation sort).

## Schema compatibility with findings-schema.md

Every auto-review item in the handover document is the hand-off form of
a finding that conforms to `review-pr/references/findings-schema.md`. The
mapping is:

| findings-schema field | Handover field              |
| --------------------- | --------------------------- |
| `file`                | `<file>` in section heading |
| `line`                | `<line>` in section heading |
| `severity`            | `**Severity:**` line        |
| `description`         | `**Comment:**` line         |
| `recommendation`      | `**Recommendation:**` line  |
| `reported_by`         | `**Reported by:**` line     |

The `severity` field is persisted verbatim (no emoji prefix). Emoji
prefixing (`🚨 Critical`, `⚠️ Important`, `💡 Suggestion`) is applied
at post time by `execute-review-decisions` — not when writing the
document.

## Auto-mode file (`pr-NNN-auto-review.md`)

`review-pr` in auto-mode (pipeline or standalone) writes findings to
`<output_dir>/pr-<N>-auto-review.md` using this exact format. The file
is byte-identical to the items that `investigate-pr-comments` would
produce for those same findings — so a downstream merge needs no
re-parsing. Items in this file always use `[?]` markers and
`auto:<severity>` source tags.

## Full example

```markdown
# PR 42 Review Decisions

**PR:** https://github.com/owner/repo/pull/42
**Branch:** feat/user-auth → main
**Generated:** 2026-04-27T14:32:00Z
**Status:** PENDING REVIEW

## Source counts

- Auto-review findings: 3
- Human reviewer comments: 2
- Total items: 5 (1 critical, 2 important, 2 suggestion)

---

## [?] auto:critical — src/auth/router.ts:87

**Severity:** critical
**Source:** auto-review
**Reported by:** code-reviewer, silent-failure-hunter
**Comment:** `verifyToken` result is not null-checked before accessing `user.id`; passing an expired token throws `TypeError: Cannot read properties of null` at runtime.
**Analysis:** `verifyToken` returns `null` on expired or invalid tokens. Line 87 accesses `result.user.id` unconditionally, so any unauthenticated request to this endpoint will crash the process rather than returning a 401.
**Recommendation:** Add a null guard — if `!result` return a 401 response before accessing `result.user.id`.
**Options:**

- (a) Add `if (!result) return res.status(401).json({ error: 'Unauthorized' });` immediately after line 85 ← suggested
- (b) Wrap in a try/catch and let the error middleware handle it (less explicit, masks other errors)
- (c) Reply: (not applicable — this is a correctness bug)

**Resolution:** <!-- write "fix (a)", "fix (b)", custom instruction, "reply: <text>", or leave blank and mark [d] -->

---

## [?] reviewer:@alice — src/auth/router.ts:102

**Severity:** important
**Source:** reviewer: @alice
**Reported by:** @alice
**Comment:** The retry loop here doesn't have a backoff — it'll hammer the DB on transient failures.
**Analysis:** Lines 100-108 implement a retry loop with `await new Promise(r => setTimeout(r, 100))` — a fixed 100ms delay regardless of attempt count. Under sustained load this creates a tight retry storm against the database.
**Recommendation:** Replace the fixed delay with exponential backoff (e.g. `100 * 2 ** attempt` ms) and add a jitter term.
**Options:**

- (a) Replace fixed delay with `Math.min(100 * 2 ** attempt + Math.random() * 50, 5000)` ← suggested
- (b) Use an existing backoff library (e.g. `exponential-backoff` or `p-retry`)
- (c) Reply: "Intentional fixed delay per ADR-014 — the DB connection pool already provides backpressure."

**Resolution:** <!-- write "fix (a)", "fix (b)", custom instruction, "reply: <text>", or leave blank and mark [d] -->
```
