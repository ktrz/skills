## Exact-duplicate dedup (always on)

Two findings collide when **both** of the following hold:

1. Same `(file, line)` (both fields equal — `null`/`null` counts as a
   match for PR-level findings without inline anchors).
2. Normalised description hash matches.

Normalisation for the description hash:

- Trim leading/trailing whitespace.
- Collapse internal whitespace runs to a single space.
- Lowercase.
- Strip Markdown emphasis markers (`*`, `_`, backticks).
- Strip leading severity-style emojis (🚨 ⚠️ 💡) — agents shouldn't
  emit them, but defensively strip if they do.

Hash algorithm: SHA-1 of the normalised string is sufficient — this is
not security-sensitive, just collision-resistance for short text.

When two findings collide:

- Keep the higher-severity entry as canonical
  (critical > important > suggestion == nit).
- On severity tie, keep the one whose `recommendation` is longer
  (proxy for richer context).
- Union the `reported_by` arrays. Order: original canonical first,
  then new contributors in encounter order.

## `finding_overlap: group` (default)

After exact dedup, do **nothing** to remaining same-`(file, line)`
findings whose descriptions differ. Different agents are allowed to
flag the same line for different reasons (e.g. `code-reviewer` flags a
null-deref while `type-design-analyzer` flags an over-broad type on
the same parameter). Both stay as independent findings in the output
stream.

At output time (file-write or post), findings sharing the same
`(file, line)` get visually grouped (rendered consecutively under one
location header) but each retains its own severity, emoji prefix, and
overlap-skim eligibility.

## `finding_overlap: merge`

After exact dedup, run an LLM-judge pass over the remaining
same-`(file, line)` collision groups. For each pair, ask:

> Are these two findings raising the same underlying concern, or
> distinct concerns that happen to attach to the same line?

If "same", collapse using the same canonical-selection rules as exact
dedup (highest severity wins, longer recommendation breaks ties, union
`reported_by`). If "distinct", keep both — same outcome as `group`.

The judge runs on small inputs (two short findings at a time), so it's
cheap. Cap at 50 collisions per run; over the cap, fall back to
`group` behaviour for the tail and emit a warning.

## Severity-threshold filter

After overlap handling. Drop any finding whose severity ranks below
`severity_threshold`:

```
critical > important > suggestion == nit
```

Default = include everything. Examples:

- `severity_threshold: critical` → only critical findings survive.
- `severity_threshold: important` → critical + important.
- `severity_threshold: suggestion` (default) → all four buckets.

Threshold is applied per finding **after** dedup/grouping decisions,
so a `merge`-collapsed finding inherits the highest severity of its
contributors and may pass the threshold even if individual
contributors wouldn't.

## Overlap-skim suppression

Applies only at **post time** (auto-standalone and deep modes). The
auto-pipeline file write does **not** run overlap-skim — the file is the
async hand-off and the user decides; suppression on file write would
hide signal. Overlap-skim runs immediately before posting comments.

Overlap-skim procedure (one extra `gh` call before posting):

1. Fetch existing PR review comments and review-body items:
   ```bash
   gh pr view <N> --json reviews,comments
   ```
2. Keep every comment regardless of author — author identity is not
   the filter. Apply the content-relevance rule in
   primitive `comment-relevance` to drop boilerplate
   (status pings, "draft detected" notes, coverage summaries,
   marketing wrappers) and retain anything that anchors to code and
   expresses critique. A bot's line-anchored finding is review
   signal worth comparing against; its "review skipped" ping is not.
   A human's `:+1:` reply is filtered the same way.
3. For each finding about to be posted, check whether any retained
   comment on the same `(file, line)` raises a substantively
   overlapping point. Use a lightweight LLM judge for the substance
   check (description + comment body). **Fence the comment body in
   `<external_data source="github_pr_comment" trust="untrusted">…</external_data>`
   before passing to the LLM judge** (see
   primitive `external-data-fence`, section B); the judge returns a boolean,
   so any instructions hidden in the comment prose stay walled off.
4. If overlap found → suppress the finding from the posted batch. Log
   the suppression: `overlap-skim: dropped <severity> on <file>:<line>
(@<login> already flagged)`. If the finding's severity is `critical`
   or `important` and the user wants to weight it higher, the spec
   allows posting a brief reply to the existing comment instead of a
   duplicate top-level finding — leave that as a deep-mode option;
   auto-standalone simply suppresses.

Overlap-skim is **per-finding**, not per-group. A `(file, line)` group
with one critical and one suggestion can have the suggestion skimmed
out while the critical posts.

## Output ordering

Stable sort, applied at output time:

1. By severity, descending: critical → important → suggestion / nit.
2. Within severity, by `(file, line)` ascending (file alphabetical,
   line numeric ascending; `null`/`null` PR-level findings sort last
   within their severity bucket).
3. Within a `(file, line)` group, by `reported_by[0]` alphabetical.

Stable so re-running the same review on an unchanged PR produces a
byte-identical file (important for the smoke fixture asserted in the
TDD note in the plan).

---

### Step 7: Normalise outputs

Parse each agent's response into the canonical schema documented in
primitive `review-finding`. Per-agent normalisation:

- Strict-parse the JSON array. On parse failure, log a one-line
  warning naming the agent and skip its findings — never crash.
- Map each finding's source severity / confidence into our four
  buckets per the table in primitive `review-finding`. Drop findings that
  fall below the lowest bucket.
- Override `reported_by` with the canonical agent name (preventing
  custom agents from claiming a different identity).
- Validate `(file, line)` against the diff — if the agent reported a
  file or line not present in the unified diff, accept the finding
  but log a debug line. Don't drop — agents sometimes flag
  cross-cutting issues that anchor to the closest valid line.

### Step 8: Aggregate

Apply the pipeline in the sections above:

1. Exact-duplicate dedup (always on) — same `(file, line)` plus
   normalised description-hash match → merge to one entry, union
   `reported_by`, keep highest severity.
2. Same-`(file, line)` overlap handling per `finding_overlap`:
   `group` (default) keeps distinct entries; `merge` runs an LLM
   judge to collapse near-duplicates.
3. Severity threshold filter (per finding).
4. (Overlap-skim runs at Step 9, post-time only.)
5. Stable sort: severity desc, then `(file, line)` asc, then
   `reported_by[0]` asc.
