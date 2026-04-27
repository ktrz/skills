---
name: investigate-pr-comments
version: 1.0.0
model: sonnet
description: >
  Investigate all review sources for a PR — auto-review findings file and
  human reviewer comments from GitHub — using parallel subagents, then write
  a structured handover document for the user to review offline. Triggers on
  "investigate PR comments", "analyse review", or automatically from
  implement-feature after review-pr completes.
---

# Investigate PR Comments

Gather all review signal for a pull request from two sources — the
`review-pr` auto-mode findings file and unresolved human reviewer
comments from GitHub — run parallel investigation subagents over every
item, and write a single structured handover document the user can edit
at their own pace.

This skill is the second step in the automated review pipeline (see
`plans.local/skills/skill-tighten-implement-feature-flow.md` for the
visual model). It produces no GitHub side effects. The handover document
is the async hand-off between fast machine work and human triage.

## Args

```
/investigate-pr-comments [PR] [--auto-review-file <path>]
```

- **`PR`** — optional PR number. If omitted, auto-detect from the current
  branch via `gh pr view --json number`. If auto-detect fails, ask.
- **`--auto-review-file <path>`** — path to the `pr-<N>-auto-review.md`
  file produced by `review-pr` auto-mode. If provided and the file
  exists, its `[?]` items are loaded as the auto-review source. If the
  path does not exist, log a one-line warning and continue with the
  GitHub-only source.

## Workflow

### Step 1: Gather sources

Collect items from two independent sources in parallel.

**Source A — auto-review file** (if `--auto-review-file` provided):

- Parse every `[?]`-marked section from the file. Each section already
  conforms to `references/handover-format.md`; no re-normalisation
  needed.
- Tag each item `source: "auto-review"`.
- If the file is missing or unreadable, log a warning and continue.

**Source B — GitHub reviewer comments**:

Fetch unresolved threads and review-body items via the paginated GraphQL
queries in `resolve-pr-comments/references/`. Do not duplicate those
queries here — load and reuse them verbatim.

For each unresolved item:

- Tag `source: "reviewer: @<login>"`.
- Preserve: author login, file path, line number (or `null` for
  review-body items), comment body verbatim, any reply chain.
- Skip resolved threads and bot comments (authors with `[bot]` suffix).

### Step 2: Merge and deduplicate

Build a single ordered queue from both sources:

1. Critical auto-review findings (severity = `critical`)
2. Important auto-review findings (severity = `important`)
3. Human reviewer comments (GitHub fetch order)
4. Suggestion/nit auto-review findings

Within each auto-review group: severity-desc, then `(file, line)` asc.

Run the pre-batch dedup pass from `resolve-pr-comments` on the merged
list — collapse exact-duplicate human comment threads (same location,
same body after normalisation). Auto-review items are already deduped
by `review-pr`; do not merge them with human items.

**Overlap annotation** — when an auto-review item and a human comment
land on the same `(file, line)`:

- Keep both as separate queue entries (do not merge — merging risks
  dropping signal from one framing).
- Add `**Note:** also flagged by @<login> (see next item)` to the
  auto-review entry so the user can pick the framing they prefer.

### Step 3: Investigate in parallel

Spawn one investigation subagent per queue item, following
`resolve-pr-comments/references/investigate.md` verbatim:

- Default batch size: 5. Launch the first batch synchronously; launch
  subsequent batches in the background (`run_in_background: true`) as
  the user advances through prior items.
- Each subagent receives: repo path (absolute), PR number, the item's
  metadata (author, location, body verbatim, any reply chain), and the
  explicit instruction that this is **investigation only** — no edits,
  no commits, no GitHub interaction.
- Subagent returns the structured report format defined in
  `resolve-pr-comments/references/investigate.md`.
- Collect all results before writing the handover document.

### Step 4: Write the handover document

Resolve output path: `plans.local/<repo>/pr-<N>-review-decisions.md`,
where `<repo>` is the repo directory name from
`git rev-parse --show-toplevel`.

Write the document conforming to
`investigate-pr-comments/references/handover-format.md`:

- Document header: PR url, branch (`headRef → baseRef`), ISO-8601
  timestamp, `Status: PENDING REVIEW`, source counts.
- One `##`-level section per queue item, in merge order (Step 2).
- Every item starts with `[?]` — no decisions have been made yet.
- Populate from the subagent investigation result:
  - `**Analysis:**` from the subagent's "What the code does today" +
    "What the reviewer is asking for".
  - `**Recommendation:**` from the subagent's "Recommended" field.
  - `**Options:**` from the subagent's option list, preserving `(a)`,
    `(b)`, `(c)` labelling; mark the recommended option `← suggested`.
- Leave `**Resolution:**` as the HTML comment placeholder — the user
  fills this in.
- Separate items with `---` horizontal rules.

### Step 5: Exit cleanly

Print to stdout:

```
Handover document written to <path>
  Auto-review: <N> items (<N> critical, <N> important, <N> suggestion/nit)
  Human comments: <N> items
  Total: <N> items

Next steps:
  Edit and run: /execute-review-decisions <path>
  For [d] items: /resolve-pr-comments --from-doc <path>
```

Do not wait. The document is the async hand-off — the user triages at
their own pace.

## Important behaviours

- **No GitHub side effects** — this skill only reads from GitHub (fetches
  unresolved threads). It never posts comments, resolves threads, or
  modifies the PR. The sole output is the local handover document.
- **Source dedup is conservative** — auto and human items on the same
  location are kept separate. The user decides which framing to act on;
  automatic merging risks silent signal loss.
- **Investigation is always parallel** — even for small queues (< 3
  items), investigation subagents run in parallel. The synchronous
  first-batch wait is bounded; background batches ensure low latency for
  the rest.
- **Subagent logic is not duplicated** — investigation prompt, batch
  sizing, and ordering rules all live in
  `resolve-pr-comments/references/investigate.md`. This skill follows
  those rules without copying them.
- **GraphQL fetch is not duplicated** — the paginated GitHub queries live
  in `resolve-pr-comments/references/`. Load and reuse; do not
  re-implement.
- **Handover format is the single source of truth** — all fields written
  to the document conform to
  `investigate-pr-comments/references/handover-format.md`, which is
  itself schema-compatible with `review-pr/references/findings-schema.md`.
  Downstream tools (`execute-review-decisions`,
  `resolve-pr-comments --from-doc`) parse the document relying on this
  contract.
