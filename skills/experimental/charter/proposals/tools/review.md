# review (review-pr) notes

Facts about the review configuration, modes and specialist agents, copied from the old `review-pr` skill. Referenced by the toolchain map; read before first use. Not a format: output shapes live in the `review-*` primitives.

## Arguments and modes

```
/review-pr [PR] [--deep] [--pipeline] [--re-review]
```

- **`PR`** — optional PR number. If omitted, auto-detect from the
  current branch via `gh pr view --json number`. If auto-detect fails,
  ask.
- **`--deep`** — interactive triage before posting. Walk each finding
  with the user (post / edit / drop) before posting the agreed batch.
- **`--pipeline`** — auto-mode file write only; do not touch GitHub.
  Used by `implement-feature` Step 5a. Equivalent to setting
  `PIPELINE=1` env. Flag wins on conflict.
- **`--re-review`** — follow-up pass on a PR that already received a
  review round. Adds three things: fetch prior review history
  (Step 2b), inject an "already raised" block into every specialist
  prompt (Step 5), and dispatch the resolution-verifier agent whose
  verdicts land in a numbered resolution report (Steps 6 and 9). Use
  it when re-running review after the author pushed fixes — a plain
  re-run re-discovers and re-surfaces issues already raised (often
  already resolved) and never checks whether the prior round was
  addressed.

Mode resolution:

| `--deep` | `--pipeline` / `PIPELINE=1` | Mode            |
| -------- | --------------------------- | --------------- |
| set      | (ignored)                   | deep            |
| unset    | set                         | auto pipeline   |
| unset    | unset                       | auto standalone |

`--deep` and `--pipeline` are mutually exclusive in spirit; if both
appear, `--deep` wins (interactive intent always overrides
auto-mode).

`--re-review` is **orthogonal** to the table above: it changes _what
extra is computed_ (prior history, injection, verifier, resolution
report), while `--deep` / `--pipeline` keep deciding _where output
goes_. It composes with any row — `--pipeline --re-review` writes both
files and stays off GitHub; `--deep --re-review` triages interactively
with prior context injected and still writes the resolution report.

Source: skills/review/review-pr/SKILL.md:45-84

## Config location and defaults

Resolve `review.yaml` in this order, first hit wins:

1. `<repo_root>/.claude/review.yaml` — repo-local. Resolved from
   `git rev-parse --show-toplevel`.
2. `~/.claude/review.yaml` — shared default.

An empty file is valid (skill uses defaults — see
`_shared/review.example.yaml` for the schema and defaults).

If neither file exists:

- **Standalone modes** (no `--pipeline`, no `PIPELINE=1`): proceed
  with `{}` and run defaults.
- **Pipeline mode**: skip silently with the message
  `review-pr not configured for pipeline use — create .claude/review.yaml to enable`.
  Auto-invocation should not run unwanted reviews against the user's
  PRs; the pipeline is opt-in per repo.

Defaults applied when keys are missing (see `review.example.yaml` for
documentation):

- `guidelines: []`
- `output_dir: $REPO_ROOT/plans.local/<repo>/` (the `<repo>` token is
  substituted from the repo directory name, derived so it stays stable
  across worktrees of the same repo, and `$REPO_ROOT` anchors the
  prefix to the repo root rather than the agent's CWD — see Step 9 for
  the exact derivation and full resolution rules; user overrides are
  taken verbatim)
- `severity_threshold: suggestion`
- `focus: []`
- `agents:` omitted → defaults
- `guidelines_mode: shared`
- `finding_overlap: group`

Source: skills/review/review-pr/SKILL.md:90-122; _shared/review.example.yaml:1-143 (documented keys: guidelines, output_dir, severity_threshold, focus, agents, guidelines_mode, finding_overlap)

## Specialists and fallback

Apply the rules in `references/agents.md`:

- **`agents:` omitted** → try the 6 pr-review-toolkit defaults. Probe
  the plugin with one Task call (e.g. `code-reviewer`); on
  `unknown subagent_type`, fall back to single-pass review using
  `references/review-prompt.md` and emit the info line.
- **`agents:` literal list** → resolve each entry per the rules
  (subagent_type vs custom path). Skip unresolvable entries with a
  warning. If all entries fail, fall back to single-pass with a
  warning.
- **`agents: []`** → force single-pass. Never probe.

Set the resolved-agents list before continuing.

[`pr-review-toolkit`](https://github.com/anthropics/claude-plugins) plugin:

| Subagent type                             | Aspect                       |
| ----------------------------------------- | ---------------------------- |
| `pr-review-toolkit:code-reviewer`         | guideline + bug check        |
| `pr-review-toolkit:comment-analyzer`      | comment accuracy + drift     |
| `pr-review-toolkit:silent-failure-hunter` | swallowed errors + try/catch |
| `pr-review-toolkit:pr-test-analyzer`      | test-coverage gaps           |
| `pr-review-toolkit:type-design-analyzer`  | type / invariant design      |
| `pr-review-toolkit:code-simplifier`       | dead code / over-engineering |

These six are the canonical default set. They can be replaced or trimmed
via the `agents:` config key.

## Resolution rules

For each entry in `agents:` (in order):

1. **Looks like a Task `subagent_type`** — entry contains `:` (plugin
   namespace) **or** has no `/` and no `.` (bare name). Try a Task call
   with `subagent_type: <entry>`. If the call returns
   `unknown subagent_type`, treat as unresolved.

2. **Looks like a path** — entry contains `/` or ends with `.md`.
   Resolve relative to the repo root. The file must exist and have a
   markdown frontmatter block with at least a `name:` key. Treat the
   entry as a custom Task agent — register it inline by reading the
   file and using its body as the agent's system prompt for the Task
   call.

3. **Unresolvable** — log a one-line warning:
   `agent "<entry>" not found — skipping` and continue. Do not abort.

## Fallback semantics

Source: skills/review/review-pr/SKILL.md:223-235; skills/review/review-pr/references/agents.md:20-53

## Fallback table and warn lines

```text
config.agents     → behaviour
─────────────────────────────────────────────────────────────────────────
omitted           → try all 6 defaults
                    if pr-review-toolkit not installed (first probe Task
                    fails with "unknown subagent_type"), fall back to
                    single-pass review using `review-prompt.md`.
                    Emit info line:
                      "pr-review-toolkit not installed — running
                       single-pass review. Install for parallel
                       specialised review."

literal list      → resolve each entry per rules above. Dispatch the
                    resolved subset. If ALL entries fail to resolve,
                    fall back to single-pass review with a warning.

[]                → force single-pass review. Never dispatch sub-agents,
                    never probe for plugin availability.
```
```

Source: skills/review/review-pr/references/agents.md:56-73

## Resolution verifier (re-review only)

- **Dispatched only when** `--re-review` is active **and** the
  prior-findings set built at Step 2b is non-empty. It cannot be
  enabled, disabled, or replaced via the `agents:` key — it is part of
  the re-review mode itself, and `agents: []` (forced single-pass) does
  not suppress it.
- **Prompt** — built from the template in `rereview-agent.md`
  ("Verifier prompt"), not the per-agent template above. It receives
  the fenced prior comments and the fenced diff; it does not receive
  the `focus:` hint or the guidelines block (it audits resolution, it
  does not review code).
- **Dispatch** — as a general-purpose Task call in the same parallel
  turn as the specialists (SKILL.md Step 6). No plugin probe involved;
  the verifier works whether or not pr-review-toolkit is installed.
- **Output** — its JSON (one verdict per prior comment) bypasses Step 7
  normalisation and Step 8 aggregation, flowing only into the Step 9
  resolution report. Parse and failure handling per `rereview-agent.md`
  → "Verifier output handling".

Source: skills/review/review-pr/references/agents.md:173-189
