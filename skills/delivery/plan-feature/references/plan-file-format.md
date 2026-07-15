# Plan-file format

> **Contract doc.** This is the owned format specification for the phased
> plan file — the artifact `plan-feature` produces and `implement-feature` /
> `execute-phase` consume. Treat the rules below as the stable interface
> between those skills: process prose in a producer or consumer may change,
> but a plan file that conforms here must keep parsing.

|               |                                                                                |
| ------------- | ------------------------------------------------------------------------------ |
| **Owner**     | `skills/delivery/plan-feature` (writer)                                        |
| **Consumers** | `skills/delivery/implement-feature`, `skills/delivery/execute-phase` (readers) |
| **Validator** | `skills/delivery/plan-feature/validate-plan.mjs` (zero-dep node)               |
| **Status**    | contract                                                                       |

## Contents

- [Why this is a contract](#why-this-is-a-contract)
- [Document shape](#document-shape)
- [Sections](#sections)
  - [Title (H1)](#title-h1)
  - [Context](#context)
  - [Execution Order](#execution-order)
  - [Phase sections](#phase-sections)
  - [Optional sections](#optional-sections)
- [What each consumer reads](#what-each-consumer-reads)
- [Validation rules](#validation-rules)
- [Validator usage](#validator-usage)
- [Distribution](#distribution)

## Why this is a contract

`plan-feature` writes a plan; `implement-feature` parses it to schedule phase
cohorts; `execute-phase` parses a single phase section to brief a worktree
agent. Three skills, one artifact. Encoding the load-bearing structure here —
and gating it with a runnable validator — lets the prose in any of the three
skills evolve without silently breaking the hand-off. The contract captures
only what a consumer actually parses; everything else in a plan is free-form
author judgment.

## Document shape

```markdown
# <TICKET-KEY>: <Feature Name>

## Context

<problem being solved + ticket ref + key decisions + architecture constraints>

## Execution Order

<DAG + a plain-English readout of which phases are parallel vs sequential>

---

## Phase 1 (PR 1): <Title>

<vertical slice: files to touch, TDD note, the concrete deliverable>

## Phase 2 (PR 2): <Title>

<vertical slice>
```

## Sections

### Title (H1)

Exactly one H1 line. Convention: `# <TICKET-KEY>: <Feature Name>` (the ticket
key also drives plan-file discovery by filename). Only the count-of-one is
enforced; the text is free-form.

### Context

A `## Context` section. `execute-phase` pastes it verbatim into every worktree
agent brief, so a phase agent inherits the problem statement, ticket reference,
and key decisions. Required.

### Execution Order

A `## Execution Order` section carrying the phase DAG and a plain-English
parallel-vs-sequential readout. `implement-feature` reads this to decide which
phases dispatch together. Required whenever the plan has **two or more** phases;
a single-phase plan may omit it (nothing to sequence).

Express dependencies in prose the reader can follow, e.g. _"Phases 2 and 3 are
independent (different files) and can run in parallel after Phase 1 lands."_

### Phase sections

One `## Phase <N>` heading per phase. `N` is a non-negative integer. The
heading may carry a trailing label — `## Phase 1 (PR 1): Data layer` — but the
`Phase <N>` prefix is what both consumers match on.

- Phase numbers must be **unique**.
- Phase numbers must form a **contiguous run** with no gaps. The run may start
  at `1` (the usual `plan-feature` output) or at `0` (plans that open with a
  mechanical Phase 0, e.g. a whole-repo restructure).
- Each phase must have a **non-empty body** — the files to touch, a TDD note,
  and the concrete deliverable a reviewer can verify. An empty phase gives a
  worktree agent nothing to execute.

### Optional sections

- `## Visual Spec` — if present, `execute-phase` pastes it into the agent brief
  alongside Context. Use it for UI phases.
- `## Open Questions` — carried for the human; consumers ignore it.

Any additional prose or sections are permitted and ignored by the validator.

## What each consumer reads

| Consumer            | Reads                                                                   |
| ------------------- | ----------------------------------------------------------------------- |
| `plan-feature`      | Writes the whole document (Stage 3).                                    |
| `implement-feature` | All `## Phase N` sections + `## Execution Order` (parallelism, deps).   |
| `execute-phase`     | The requested `## Phase <N>` section + `## Context` + `## Visual Spec`. |

Progress tracking is a sibling artifact, not part of the plan file: a phase is
complete when `<plan-dir>/<plan-name>-phase-<N>-progress.md` exists with every
checkbox checked (see `implement-feature` Step 2).

## Validation rules

`validate-plan.mjs` enforces, collecting **all** violations before exiting:

1. **`rule-1-title`** — exactly one H1 (`# …`) line.
2. **`rule-2-context`** — a `## Context` section is present.
3. **`rule-3-execution-order`** — a plan with ≥ 2 phases has an
   `## Execution Order` section.
4. **`rule-4-phases`** — at least one `## Phase <N>` section.
5. **`rule-5-phase-unique`** — no duplicate phase numbers.
6. **`rule-6-phase-contiguous`** — phase numbers form a contiguous run starting
   at 0 or 1 (no gaps).
7. **`rule-7-phase-body`** — every phase section has a non-empty body.

Headings inside fenced code blocks (` ` ```) are ignored, so an embedded
template or a shell comment never counts as structure.

## Validator usage

```bash
node skills/delivery/plan-feature/validate-plan.mjs <path-to-plan.md>
```

- Exit `0` — the plan conforms. Prints `OK: …`.
- Exit `1` — prints one `[rule] message` line per violation, then a count.
- Exit `2` — usage error or the file could not be read.

Fixtures the test suite checks live in
`skills/delivery/plan-feature/fixtures/` (one valid-* per accepted shape, one
invalid-* per rule); the suite is `tests/plan-feature/validate-plan.test.mjs`
(`node --test`).

## Distribution

The validator is **co-located with its owner** (`plan-feature`) and is not
distributed into the consumer skills. Consumers read a plan file by
LLM-parsing its markdown, not by shelling out to the validator, so — unlike the
handover-validator, which each review skill must _run_ from its own directory
on an installed copy — no cross-skill bundle is needed. This mirrors the
co-located `narrate-pr/validate.mjs`. See `_shared/README.md` → "When a
contract validator needs a `bundles:` entry" for when a validator instead
warrants a `bundles:` entry.
