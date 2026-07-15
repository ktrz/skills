# Comment relevance filter

Shared rule for deciding whether a PR comment is review signal worth
processing. Used by `review-pr` (overlap-skim, its
`review-pr/references/aggregation.md`) and `investigate-pr-comments`
(Step 1 source-B ingestion).

## Why content, not author

The obvious filter — "skip authors whose login ends in `[bot]`, plus a
known-bot allowlist" — is the wrong axis. Two examples that break it:

- **CodeRabbit** posts a "Review skipped — draft detected" boilerplate
  ping that's pure noise, **and** posts detailed line-anchored review
  findings on non-draft PRs that are real signal. Same author,
  opposite relevance.
- **A human reviewer** drops a `:+1:` reaction comment or a
  `bumping` thread-keep-alive that carries no review content.
  Human author, zero signal.

Filtering by author either loses CodeRabbit's findings (false
suppress) or floods the queue with status pings (false admit).
Filtering by content classifies each comment on its own merits,
ages well, and works with new tools without a list update.

The detection rule that follows is intentionally cheap — pattern
matches on the comment body plus a couple of structural checks. No
LLM call needed for the easy cases. For the residual ambiguous
middle, an LLM judge can take a second pass.

## Detection rule

A comment is **review-relevant** when **all** of:

1. It anchors to code: has a non-null `file` + `line`, **or** the
   body quotes/references identifiers, file paths, or line ranges.
2. Its body, after stripping HTML comments and collapsible
   `<details>` blocks, contains at least one of:
   - A critique, question, or suggestion about the code
     ("should", "could", "consider", "?", "missing", "broken",
     "instead of", "why", a diff suggestion block).
   - A concrete recommendation or fix proposal.
   - A reference to a specific defect class (perf, security,
     correctness, style, naming, etc.).
3. It is **not** one of the boilerplate shapes in the skip list
   below.

A comment is **skipped** when **any** of:

- Body matches a boilerplate shape:
  - "Review skipped" / "Draft detected" / "I'll review when ready"
  - "Coverage decreased / increased by N%" without inline anchors
  - CI status pings ("build passing", "checks running")
  - Marketing / announcement content (most tool comments wrap these
    in `<details>` — strip those first; if the visible body is
    empty after stripping, skip)
  - Reaction-only / thread-keep-alive ("ping", "bump", "lgtm" with
    no anchor, single emoji)
- Body is pure links / images with no prose.
- Body length < 20 chars after normalisation and the author is the
  PR creator (likely a self-thread-keep-alive).

The skip list is small on purpose. Anything not on it falls through
to the "relevant" bucket — better to admit a borderline comment than
to suppress real review signal.

## Implementation outline

```
function isReviewRelevant(comment):
    body = stripHtmlComments(comment.body)
    body = stripCollapsedDetails(body)         # <details>...</details>
    if matchesAny(body, BOILERPLATE_PATTERNS):
        return false
    if len(body.trim()) < 20 and authorIsPrOwner: return false
    if anchorsToCode(comment) or hasCritiqueSignal(body):
        return true
    return false                                # default: skip
```

Pattern list (loose; both skills should keep their own copy aligned
with this reference):

```
BOILERPLATE_PATTERNS = [
    /review skipped/i,
    /draft detected/i,
    /coverage (in|de)creased/i,
    /^(:?\+1:|:thumbsup:|:rocket:|lgtm|ship it|bump|ping)\s*$/i,
    /<!-- (auto-generated|skip review)/i,
]
```

When ambiguous (body has both boilerplate and substantive content —
e.g. CodeRabbit's reports that wrap findings inside `<details>`),
strip the boilerplate first and re-evaluate. If the surviving prose
anchors to code or expresses critique, the comment is relevant; the
findings inside should be extracted as separate items, not the
wrapping summary.

## LLM judge for the residue

After the deterministic pass, a small fraction of comments will
land in a grey zone — visible prose, no obvious boilerplate, but
unclear whether it's review content. Both skills can optionally run
a one-shot LLM judge on those (prompt: "Is this comment a code
review observation worth a maintainer's attention? Reply
`relevant` or `skip` with one sentence of reasoning."). Cap at
~20 judge calls per PR; over the cap, default to "relevant" and let
the user triage.

## Out of scope

This rule decides whether a comment enters the investigation /
overlap-skim pipeline at all. Once admitted, downstream stages
(`review-pr` overlap-skim's substance overlap check,
`investigate-pr-comments` subagent investigation) still apply per
their own criteria. The relevance filter is the first cheap pass,
not the last word.
