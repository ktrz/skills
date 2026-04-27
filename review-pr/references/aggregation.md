# Aggregation

Rules for combining sub-agent findings into a single output stream.
Used by `review-pr/SKILL.md` Step 8.

All operations work on findings already normalised to the canonical
schema in `findings-schema.md`. Anything that can't be normalised was
already dropped with a warning at Step 7.

## Pipeline order

```
[normalised findings from N agents]
        │
        ▼
  exact-duplicate dedup     (always on)
        │
        ▼
  same-(file,line) handling per `finding_overlap`:
    group  → keep distinct, mark for visual grouping
    merge  → LLM-judge near-duplicates, collapse
        │
        ▼
  severity threshold filter (drop below floor)
        │
        ▼
  bot-skim suppression      (post-time only — auto-standalone + deep)
        │
        ▼
  emoji prefix + post / write
```

`severity_threshold` and `bot-skim` are **per-finding**. A `(file, line)`
group with two findings can be filtered or suppressed independently —
losing one to the bot-skim does not remove the other.

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
bot-skim eligibility.

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

## Bot-skim suppression

Applies only at **post time** (auto-standalone and deep modes). The
auto-pipeline file write does **not** run bot-skim — the file is the
async hand-off and the user decides; suppression on file write would
hide signal. Bot-skim runs immediately before posting comments.

Bot-skim procedure (one extra `gh` call before posting):

1. Fetch existing PR review comments and review-body items:
   ```bash
   gh pr view <N> --json reviews,comments
   ```
2. Filter to bot authors — login ends with `[bot]` or matches a known
   set (Copilot, Snyk, Sonar, etc.).
3. For each finding about to be posted, check whether any bot comment
   on the same `(file, line)` raises a substantively overlapping
   point. Use a lightweight LLM judge for the substance check
   (description + bot comment body).
4. If overlap found → suppress the finding from the posted batch. Log
   the suppression: `bot-skim: dropped <severity> on <file>:<line>
(Copilot already flagged)`. If the finding's severity is `critical`
   or `important` and the user wants to weight it higher, the spec
   allows posting a brief reply to the bot comment instead of a
   duplicate top-level finding — leave that as a deep-mode option;
   auto-standalone simply suppresses.

Bot-skim is **per-finding**, not per-group. A `(file, line)` group
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
